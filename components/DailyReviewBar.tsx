"use client";

import { DailyReviewData, ENERGY_OPTIONS, MOOD_OPTIONS, dailyReviewEntryFor } from "@/lib/types";
import { todayKey } from "@/lib/date";

export default function DailyReviewBar({
  dailyReview,
  onOpen,
}: {
  dailyReview: DailyReviewData;
  onOpen: () => void;
}) {
  const entry = dailyReviewEntryFor(dailyReview, todayKey());
  const moodEmoji = MOOD_OPTIONS.find((m) => m.key === entry.mood)?.emoji;
  const energyEmoji = ENERGY_OPTIONS.find((m) => m.key === entry.energy)?.emoji;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="safe-bottom mx-5 mb-2 mt-2 flex items-center justify-between rounded-xl2 border border-paper-border bg-paper-surface py-3 pl-4 pr-[4.25rem] shadow-paper"
    >
      <span className="text-sm text-paper-muted">Daily Review</span>
      {moodEmoji || energyEmoji ? (
        <span className="text-base">
          {moodEmoji} {energyEmoji}
        </span>
      ) : (
        <span className="text-xs italic text-paper-faint">Evening check-in</span>
      )}
    </button>
  );
}
