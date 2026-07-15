import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/db";
import { todayKey } from "@/lib/date";
import { ROUTINE_KEYS, completionForDate, logFor, stepsForDate } from "@/lib/routines";
import { habitsAtRisk } from "@/lib/frontpage";
import { buildEveningNudge } from "@/lib/sms-messages";
import { sendSms, twilioConfigured } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!twilioConfigured()) {
    return NextResponse.json({ ok: true, skipped: "Twilio not configured" });
  }

  const data = await getDashboardData();
  const now = new Date();

  const pcts: number[] = [];
  for (const key of ROUTINE_KEYS) {
    const { total, pct } = completionForDate(data.routines.config, data.routines, key, now);
    if (total > 0 && pct !== null) pcts.push(pct);
  }
  const routinePct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;

  const nightSteps = stepsForDate(data.routines.config, "night", now);
  const nightDoneIds = new Set(logFor(data.routines, todayKey(now)).completedStepIds.night);
  const nightRemaining = nightSteps.filter((s) => !nightDoneIds.has(s.id)).length;

  const atRisk = habitsAtRisk(data.habits, now).map((r) => ({
    label: r.habit.label,
    doneCount: r.doneCount,
    weeklyGoal: r.habit.weeklyGoal,
  }));

  const message = buildEveningNudge({ routinePct, nightRemaining, atRiskHabits: atRisk });

  if (!message) {
    return NextResponse.json({ ok: true, sent: false, reason: "on track" });
  }

  try {
    await sendSms(message);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "SMS failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sent: true });
}
