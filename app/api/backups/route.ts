import { NextResponse } from "next/server";
import { listBackups } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backups = await listBackups();
    return NextResponse.json({ ok: true, backups });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load backups" },
      { status: 500 }
    );
  }
}
