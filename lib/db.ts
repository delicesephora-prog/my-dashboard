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
  // save_seq is a client-generated timestamp (Date.now()) sent with every
  // save. Two saves can reach the server out of order (a slow request from
  // an earlier edit can complete after a fast request from a later one) -
  // comparing save_seq lets the write itself be rejected atomically when
  // it's older than what's already stored, instead of silently winning a
  // race and overwriting newer data.
  await db`ALTER TABLE dashboard_state ADD COLUMN IF NOT EXISTS save_seq BIGINT NOT NULL DEFAULT 0`;
}

// TEMPORARY diagnostic helper - returns exactly what's physically stored
// right now, with no normalization, so we can see the raw database state
// directly instead of guessing. Remove once the save-reliability issue is
// confirmed fully resolved.
export async function getDebugSnapshot(): Promise<{
  serverNow: string;
  rowExists: boolean;
  updatedAt: string | null;
  saveSeq: string | null;
  glowUpDailyLogs: unknown;
  glowUpDailyItemIds: unknown;
}> {
  const db = sql();
  const rows = await db`SELECT data, updated_at, save_seq FROM dashboard_state WHERE id = ${ROW_ID}`;
  if (rows.length === 0) {
    return {
      serverNow: new Date().toISOString(),
      rowExists: false,
      updatedAt: null,
      saveSeq: null,
      glowUpDailyLogs: null,
      glowUpDailyItemIds: null,
    };
  }
  const raw = rows[0].data as { glowUp?: { dailyLogs?: unknown; dailyItems?: { id: string }[] } };
  return {
    serverNow: new Date().toISOString(),
    rowExists: true,
    updatedAt: String(rows[0].updated_at),
    saveSeq: String(rows[0].save_seq),
    glowUpDailyLogs: raw.glowUp?.dailyLogs ?? null,
    glowUpDailyItemIds: raw.glowUp?.dailyItems?.map((i) => i.id) ?? null,
  };
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

export async function saveDashboardData(data: DashboardData, clientSeq: number): Promise<void> {
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

  // clientSeq is a wall-clock timestamp from whichever device is saving,
  // used to stop a same-device request that started editing earlier from
  // overwriting one that started later, even if their network requests
  // arrive at the server out of order. Comparing raw clientSeq values
  // ACROSS devices is not safe on its own: two real devices' clocks are
  // very often a little different (a phone that's a few minutes off is
  // completely ordinary, not a malfunction), and once one device's clock
  // reads "behind," every save it ever makes would compare as older and
  // get silently dropped - forever, with no error, while the app still
  // says "Saved". That exact failure is why saves stopped landing.
  //
  // Fix: only enforce the ordering check within a short window right
  // after the last write (long enough to cover a real same-device race,
  // which resolves in well under a second in practice) - any write more
  // than a few seconds after the last one always goes through no matter
  // what its timestamp says, because by then this can only be a
  // genuinely later edit, not a stale request finally arriving.
  // (window is 10 seconds - hardcoded directly below since it's a fixed
  // SQL interval literal, not something that needs to vary at runtime)
  const result = await db`
    INSERT INTO dashboard_state (id, data, updated_at, save_seq)
    VALUES (${ROW_ID}, ${JSON.stringify(toSave)}::jsonb, now(), ${clientSeq})
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now(), save_seq = EXCLUDED.save_seq
      WHERE EXCLUDED.save_seq >= dashboard_state.save_seq
         OR now() - dashboard_state.updated_at > interval '10 seconds'
    RETURNING save_seq
  `;

  if (result.length === 0) {
    // Only reachable if another save landed within the last few seconds
    // and genuinely does carry a later save_seq - a real, intentional
    // race loss, not a bug. Nothing to repair.
    console.warn("[db] save skipped: a newer save already landed within the race window.");
  }
}
