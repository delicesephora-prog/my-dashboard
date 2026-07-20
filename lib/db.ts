import { neon } from "@neondatabase/serverless";
import { DashboardData, defaultDashboardData, normalizeDashboardData } from "./types";
import { isLetterUnlocked } from "./warroom";

const ROW_ID = "main";

// Once sealed, the letter's text is withheld from every read until the
// unlock date - checked against the server's clock, not the client's.
function redactLockedLetter(data: DashboardData): DashboardData {
  const letter = data.year.warRoom.letter;
  if (!letter.sealed || isLetterUnlocked()) return data;
  return {
    ...data,
    year: { ...data.year, warRoom: { ...data.year.warRoom, letter: { ...letter, text: "" } } },
  };
}

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel Project Settings -> Environment Variables."
    );
  }
  return neon(url);
}

// Creates the storage table the first time the app talks to the database.
// There is nothing to run by hand - this happens automatically.
async function ensureTable() {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS dashboard_state (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function getDashboardData(): Promise<DashboardData> {
  const db = sql();
  await ensureTable();
  const rows = await db`SELECT data FROM dashboard_state WHERE id = ${ROW_ID}`;

  if (rows.length === 0) {
    const initial = defaultDashboardData();
    await db`
      INSERT INTO dashboard_state (id, data)
      VALUES (${ROW_ID}, ${JSON.stringify(initial)}::jsonb)
    `;
    return initial;
  }

  return redactLockedLetter(normalizeDashboardData(rows[0].data as Partial<DashboardData>));
}

export type SaveDebugInfo = {
  dbHost: string;
  dbPath: string;
  brainDumpReceived: string;
  brainDumpConfirmedByDb: string;
  dumpItemCountReceived: number;
  dumpLatestItemReceived: string;
  rowsWrittenByInsert: number;
};

function latestDumpText(data: Partial<DashboardData> | null | undefined): { count: number; latest: string } {
  const items = data?.lists?.dump?.items ?? [];
  if (items.length === 0) return { count: 0, latest: "(none)" };
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { count: items.length, latest: sorted[0].text };
}

// Temporary: a lightweight, no-Vercel-required way to see exactly what the
// database has stored right now, viewable directly in the app UI. Checks
// both Brain Dump (the free-text pencil-icon field) and the Dump list (the
// green "Dump" quick-capture button) since they're easy to mix up.
export async function getDebugSnapshot(): Promise<{
  dbHost: string;
  dbPath: string;
  brainDumpNow: string;
  dumpItemCount: number;
  dumpLatestItem: string;
  updatedAt: string | null;
  allRows: { id: string; updatedAt: string }[];
}> {
  const url = process.env.DATABASE_URL ?? "";
  let dbHost = "(not set)";
  let dbPath = "(not set)";
  try {
    const parsed = new URL(url);
    dbHost = parsed.host;
    dbPath = parsed.pathname;
  } catch {
    dbHost = "(unparseable)";
  }
  const db = sql();
  await ensureTable();

  // Every row in the table, not just "main" - reveals whether writes are
  // silently landing under a different id than the app reads from.
  const allRowsRaw = await db`SELECT id, updated_at FROM dashboard_state ORDER BY updated_at DESC`;
  const allRows = allRowsRaw.map((r) => ({ id: String(r.id), updatedAt: String(r.updated_at) }));

  const rows = await db`SELECT data, updated_at FROM dashboard_state WHERE id = ${ROW_ID}`;
  if (rows.length === 0) {
    return {
      dbHost,
      dbPath,
      brainDumpNow: "(no row yet)",
      dumpItemCount: 0,
      dumpLatestItem: "(no row yet)",
      updatedAt: null,
      allRows,
    };
  }
  const rowData = rows[0].data as Partial<DashboardData>;
  const brainDumpNow = String(rowData?.brainDump ?? "");
  const { count, latest } = latestDumpText(rowData);
  const updatedAt = String(rows[0].updated_at);
  return { dbHost, dbPath, brainDumpNow, dumpItemCount: count, dumpLatestItem: latest, updatedAt, allRows };
}

export async function saveDashboardData(data: DashboardData): Promise<SaveDebugInfo> {
  const db = sql();
  await ensureTable();

  // Once the letter is sealed, no client can ever overwrite it again -
  // this also protects against a client that only ever saw the redacted
  // (blank) text echoing that blank back and erasing the real letter.
  // This check is a bonus protection, not the primary job of this
  // function - if it fails for any reason, the save must still go
  // through rather than blocking every future save.
  let toSave = data;
  try {
    const rows = await db`SELECT data FROM dashboard_state WHERE id = ${ROW_ID}`;
    if (rows.length > 0) {
      const existing = normalizeDashboardData(rows[0].data as Partial<DashboardData>);
      if (existing.year.warRoom.letter.sealed) {
        toSave = {
          ...data,
          year: {
            ...data.year,
            warRoom: { ...data.year.warRoom, letter: existing.year.warRoom.letter },
          },
        };
      }
    }
  } catch (err) {
    console.error("[db] sealed-letter guard check failed, saving anyway:", err);
  }

  const url = process.env.DATABASE_URL ?? "";
  let dbHost = "(not set)";
  let dbPath = "(not set)";
  try {
    const parsedUrl = new URL(url);
    dbHost = parsedUrl.host;
    dbPath = parsedUrl.pathname;
  } catch {
    dbHost = "(unparseable)";
  }

  const result = await db`
    INSERT INTO dashboard_state (id, data, updated_at)
    VALUES (${ROW_ID}, ${JSON.stringify(toSave)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    RETURNING data->>'brainDump' AS brain_dump_after_write
  `;

  const { count, latest } = latestDumpText(toSave);

  return {
    dbHost,
    dbPath,
    brainDumpReceived: toSave.brainDump,
    brainDumpConfirmedByDb: String(result[0]?.brain_dump_after_write ?? ""),
    dumpItemCountReceived: count,
    dumpLatestItemReceived: latest,
    rowsWrittenByInsert: result.length,
  };
}
