import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, saveDashboardData } from "@/lib/db";
import {
  RHYTHM_DAY_LABELS,
  RHYTHM_DAY_TYPE_LABELS,
  anchorsForDate,
  dayKeyForDate,
} from "@/lib/rhythm";
import { buildMorningRhythmText } from "@/lib/sms-messages";
import { sendSms, twilioConfigured } from "@/lib/sms";
import { alreadySent, canSendMore, recordSent } from "@/lib/textalerts";
import {
  easternDateKey,
  fakeEasternDate,
  isEasternQuietHours,
  isEasternWeekday,
  isNearEasternTime,
} from "@/lib/servertime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Two vercel.json schedule entries point here - one for weekdays, one for
// weekends - since each configured target time needs its own trigger. The
// route itself figures out which target applies based on the real Eastern
// weekday, so a single file serves both.
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

  if (!textAlerts.settings.morningEnabled) {
    return NextResponse.json({ ok: true, skipped: "morning texts off" });
  }
  if (isEasternQuietHours(easternNow)) {
    return NextResponse.json({ ok: true, skipped: "quiet hours" });
  }
  if (alreadySent(textAlerts, today, "morning")) {
    return NextResponse.json({ ok: true, skipped: "already sent today" });
  }
  if (!canSendMore(textAlerts, today)) {
    return NextResponse.json({ ok: true, skipped: "daily text cap reached" });
  }

  const weekday = isEasternWeekday(easternNow);
  const targetTime = weekday
    ? textAlerts.settings.morningWeekdayTime
    : textAlerts.settings.morningWeekendTime;
  if (!isNearEasternTime(targetTime, easternNow, 90)) {
    return NextResponse.json({ ok: true, skipped: "not near configured time" });
  }

  const dayKey = dayKeyForDate(easternNow);
  const anchors = anchorsForDate(
    data.rhythm,
    data.lifeQuarterly.paydayChecklist.anchorDate,
    easternNow
  ).map((a) => a.text);
  const oneThing = data.oneThing.date === today ? data.oneThing.text : "";

  const message = buildMorningRhythmText({
    dayLabel: RHYTHM_DAY_LABELS[dayKey],
    dayType: RHYTHM_DAY_TYPE_LABELS[dayKey],
    oneThing,
    anchors,
  });

  try {
    await sendSms(message);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "SMS failed" },
      { status: 500 }
    );
  }

  await saveDashboardData({ ...data, textAlerts: recordSent(textAlerts, today, "morning") });

  return NextResponse.json({ ok: true, sent: true });
}
