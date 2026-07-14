import { neon } from "@neondatabase/serverless";
import { DashboardData, defaultDashboardData, normalizeDashboardData } from "./types";

const ROW_ID = "main";

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

  return normalizeDashboardData(rows[0].data as Partial<DashboardData>);
}

export async function saveDashboardData(data: DashboardData): Promise<void> {
  const db = sql();
  await ensureTable();
  await db`
    INSERT INTO dashboard_state (id, data, updated_at)
    VALUES (${ROW_ID}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
