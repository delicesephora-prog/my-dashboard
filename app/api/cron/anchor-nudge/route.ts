import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, saveDashboardData } from "@/lib/db";
import { anchorsDueForNudge, markAnchorNudged } from "@/lib/rhythm";
import { buildAnchorNudgeText } from "@/lib/sms-messages";
import { sendSms, twilioConfigured } from "@/lib/sms";
import { alreadySent, canSendMore, recordSent } from "@/lib/textalerts";
import { easternDateKey, fakeEasternDate, isEasternQuietHours } from "@/lib/servertime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Several vercel.json schedule entries (spaced ~90 real minutes apart
// through the day) point here, since Vercel Hobby cron entries can only
// fire once a day each - checking often is what lets a nudge go out
// reasonably close to its configured time. Whichever checkpoint first
// finds an anchor due sends it and marks it nudged, so later checkpoints
// that same day skip it - never more than one nudge per anchor.
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
  let { textAlerts, rhythm } = data;

  if (!textAlerts.settings.anchorNudgesEnabled) {
    return NextResponse.json({ ok: true, skipped: "anchor nudges off" });
  }
  if (isEasternQuietHours(easternNow)) {
    return NextResponse.json({ ok: true, skipped: "quiet hours" });
  }

  const due = anchorsDueForNudge(
    rhythm,
    data.lifeQuarterly.paydayChecklist.anchorDate,
    easternNow,
    100
  );

  let sentCount = 0;
  for (const anchor of due) {
    if (!canSendMore(textAlerts, today)) break;
    const tag = `anchor:${anchor.id}`;
    if (alreadySent(textAlerts, today, tag)) continue;

    try {
      await sendSms(buildAnchorNudgeText(anchor.text));
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "SMS failed", sentCount },
        { status: 500 }
      );
    }

    textAlerts = recordSent(textAlerts, today, tag);
    rhythm = markAnchorNudged(rhythm, anchor.id, easternNow);
    sentCount++;
  }

  if (sentCount > 0) {
    await saveDashboardData({ ...data, textAlerts, rhythm }, Date.now());
  }

  return NextResponse.json({ ok: true, sent: sentCount });
}
