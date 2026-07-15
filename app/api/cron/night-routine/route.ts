import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, saveDashboardData } from "@/lib/db";
import { logFor, stepsForDate } from "@/lib/routines";
import { buildNightRoutineText } from "@/lib/sms-messages";
import { sendSms, twilioConfigured } from "@/lib/sms";
import { alreadySent, canSendMore, recordSent } from "@/lib/textalerts";
import { easternDateKey, fakeEasternDate, isEasternQuietHours, isNearEasternTime } from "@/lib/servertime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only fires if the night routine hasn't been started at all - silence is
// the reward for already being on it.
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
  const easternNow = fakeEasternDate();
  const today = easternDateKey(easternNow);
  const { textAlerts } = data;

  if (!textAlerts.settings.nightEnabled) {
    return NextResponse.json({ ok: true, skipped: "night text off" });
  }
  if (isEasternQuietHours(easternNow)) {
    return NextResponse.json({ ok: true, skipped: "quiet hours" });
  }
  if (alreadySent(textAlerts, today, "night")) {
    return NextResponse.json({ ok: true, skipped: "already sent today" });
  }
  if (!canSendMore(textAlerts, today)) {
    return NextResponse.json({ ok: true, skipped: "daily text cap reached" });
  }
  if (!isNearEasternTime(textAlerts.settings.nightTime, easternNow, 60)) {
    return NextResponse.json({ ok: true, skipped: "not near configured time" });
  }

  const nightSteps = stepsForDate(data.routines.config, "night", easternNow);
  if (nightSteps.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no night routine configured" });
  }

  const doneCount = logFor(data.routines, today).completedStepIds.night.length;
  if (doneCount > 0) {
    return NextResponse.json({ ok: true, skipped: "already started" });
  }

  try {
    await sendSms(buildNightRoutineText(nightSteps.length));
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "SMS failed" },
      { status: 500 }
    );
  }

  await saveDashboardData({ ...data, textAlerts: recordSent(textAlerts, today, "night") });

  return NextResponse.json({ ok: true, sent: true });
}
