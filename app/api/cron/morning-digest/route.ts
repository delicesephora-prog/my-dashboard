import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getDashboardData } from "@/lib/db";
import { dateKey, formatElegantDate, todayKey } from "@/lib/date";
import { isOverdue, STATUS_LABELS } from "@/lib/work-style";
import { buildDigestHtml } from "@/lib/digest-email";
import { DailyReviewEntry, isDailyReviewEntryFilled } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAME = "Sephora";

function computeStreak(entries: Record<string, DailyReviewEntry>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // count backward from yesterday
  for (let i = 0; i < 400; i++) {
    const key = dateKey(cursor);
    const entry = entries[key];
    if (entry && isDailyReviewEntryFilled(entry)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const digestEmail = process.env.DIGEST_EMAIL;
  if (!resendApiKey || !digestEmail) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY or DIGEST_EMAIL is not set" },
      { status: 500 }
    );
  }

  const data = await getDashboardData();
  const today = todayKey();

  const oneThing = data.oneThing.date === today ? data.oneThing.text : "";

  const topPriorities = data.workOps.tasks
    .filter((t) => t.topPriority)
    .map((t) => ({
      title: t.title,
      dueDate: t.dueDate,
      statusLabel: STATUS_LABELS[t.status],
    }));

  const overdue = data.workOps.tasks
    .filter((t) => isOverdue(t.dueDate, today, t.status))
    .map((t) => ({ title: t.title, dueDate: t.dueDate }));

  const waiting = data.workOps.tasks
    .filter((t) => t.status === "waiting")
    .map((t) => ({ title: t.title, dueDate: t.dueDate }));

  const streak = computeStreak(data.dailyReview.entries);

  const html = buildDigestHtml({
    name: NAME,
    dateLabel: formatElegantDate(new Date()),
    oneThing,
    topPriorities,
    overdue,
    waiting,
    streak,
  });

  const resend = new Resend(resendApiKey);
  const result = await resend.emails.send({
    from: "My Dashboard <onboarding@resend.dev>",
    to: digestEmail,
    subject: "Your morning digest",
    html,
  });

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
