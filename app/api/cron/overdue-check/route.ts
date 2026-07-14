import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, saveDashboardData } from "@/lib/db";
import { todayKey } from "@/lib/date";
import { isOverdue } from "@/lib/work-style";
import { buildOverdueAlert } from "@/lib/sms-messages";
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
  const today = todayKey();

  const overdueTasks = data.workOps.tasks.filter((t) => isOverdue(t.dueDate, today, t.status));
  const currentlyOverdueIds = new Set(overdueTasks.map((t) => t.id));
  const previouslyAlerted = new Set(data.smsAlerts.alertedOverdueTaskIds);
  const newlyOverdue = overdueTasks.filter((t) => !previouslyAlerted.has(t.id));

  if (newlyOverdue.length > 0) {
    try {
      await sendSms(
        buildOverdueAlert(newlyOverdue.map((t) => ({ title: t.title, dueDate: t.dueDate })))
      );
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "SMS failed" },
        { status: 500 }
      );
    }
  }

  // Keep the alerted set in sync with what's currently overdue, so a task
  // that's completed (or its due date pushed out) and later becomes
  // overdue again will trigger a fresh alert.
  await saveDashboardData({
    ...data,
    smsAlerts: { alertedOverdueTaskIds: Array.from(currentlyOverdueIds) },
  });

  return NextResponse.json({ ok: true, newlyOverdueCount: newlyOverdue.length });
}
