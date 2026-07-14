import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardData, saveDashboardData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const taskSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  done: z.boolean(),
  focus: z.boolean(),
  createdAt: z.string(),
});

const worldSchema = z.object({
  tasks: z.array(taskSchema).max(500),
  notes: z.string().max(20000),
});

const dashboardSchema = z.object({
  version: z.literal(1),
  work: worldSchema,
  life: worldSchema,
});

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = dashboardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid dashboard data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    await saveDashboardData(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
