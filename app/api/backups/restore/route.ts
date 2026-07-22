import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackupData, saveDashboardData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ id: z.string() });

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Missing backup id." }, { status: 400 });
    }

    const data = await getBackupData(parsed.data.id);
    if (!data) {
      return NextResponse.json({ ok: false, error: "That backup no longer exists." }, { status: 404 });
    }

    await saveDashboardData(data, Date.now());
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Restore failed" },
      { status: 500 }
    );
  }
}
