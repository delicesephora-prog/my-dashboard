import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, saveDashboardData } from "@/lib/db";
import { completionForDate } from "@/lib/workshutdown";
import { buildWorkShutdownText } from "@/lib/sms-messages";
import { sendSms, twilioConfigured } from "@/lib/sms";
import { alreadySent, canSendMore, recordSent } from "@/lib/textalerts";
import { easternDateKey, fakeEasternDate, isEasternQuietHours, isNearEasternTime } from "@/lib/servertime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only fires if Work Shutdown hasn't been started at all - silence is the
// reward for already being on it.
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

  if (!textAlerts.settings.workShutdownEnabled) {
    return NextResponse.json({ ok: true, skipped: "work shutdown text off" });
  }
  if (isEasternQuietHours(easternNow)) {
    return NextResponse.json({ ok: true, skipped: "quiet hours" });
  }
  if (alreadySent(textAlerts, today, "workShutdown")) {
    return NextResponse.json({ ok: true, skipped: "already sent today" });
  }
  if (!canSendMore(textAlerts, today)) {
    return NextResponse.json({ ok: true, skipped: "daily text cap reached" });
  }
  if (!isNearEasternTime(textAlerts.settings.workShutdownTime, easternNow, 60)) {
    return NextResponse.json({ ok: true, skipped: "not near configured time" });
  }

  const { done, total } = completionForDate(data.workShutdown, easternNow);
  if (total === 0) {
    return NextResponse.json({ ok: true, skipped: "no shutdown steps configured" });
  }
  if (done > 0) {
    return NextResponse.json({ ok: true, skipped: "already started" });
  }

  try {
    await sendSms(buildWorkShutdownText(total - done));
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "SMS failed" },
      { status: 500 }
    );
  }

  await saveDashboardData(
    { ...data, textAlerts: recordSent(textAlerts, today, "workShutdown") },
    Date.now()
  );

  return NextResponse.json({ ok: true, sent: true });
}
