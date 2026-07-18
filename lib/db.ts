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
  try {
    console.log("[TEMP-DEBUG] using DATABASE_URL host:", new URL(url).host);
  } catch {
    console.log("[TEMP-DEBUG] DATABASE_URL is set but not a parseable URL");
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

  console.log(
    "[TEMP-DEBUG] getDashboardData read, raw brainDump:",
    JSON.stringify((rows[0].data as Partial<DashboardData> | null)?.brainDump ?? null)
  );
  return redactLockedLetter(normalizeDashboardData(rows[0].data as Partial<DashboardData>));
}

export async function saveDashboardData(data: DashboardData): Promise<void> {
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

  console.log("[TEMP-DEBUG] about to write, brainDump:", JSON.stringify(toSave.brainDump));

  const result = await db`
    INSERT INTO dashboard_state (id, data, updated_at)
    VALUES (${ROW_ID}, ${JSON.stringify(toSave)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    RETURNING data->>'brainDump' AS brain_dump_after_write
  `;
  console.log("[TEMP-DEBUG] write completed, DB now reports brainDump:", JSON.stringify(result[0]?.brain_dump_after_write ?? null));
}
