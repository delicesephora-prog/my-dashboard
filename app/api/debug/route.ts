import { NextResponse } from "next/server";
import { getDebugSnapshot } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY - a raw look at exactly what's stored in the database right
// now, bypassing every layer of normalization/caching, to diagnose the
// save-reliability issue directly instead of guessing. Protected by the
// same login middleware as the rest of the app. Remove once resolved.
export async function GET() {
  try {
    const snapshot = await getDebugSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
