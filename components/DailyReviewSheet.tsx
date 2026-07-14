"use client";

import { useState } from "react";
import {
  DailyReviewData,
  DailyReviewEntry,
  ENERGY_OPTIONS,
  MOOD_OPTIONS,
  dailyReviewEntryFor,
} from "@/lib/types";
import { todayKey, shiftDateKey, formatDayLabel } from "@/lib/date";
import WeekNav from "./WeekNav";
import JournalField from "./JournalField";
import EmojiPicker from "./EmojiPicker";

export default function DailyReviewSheet({
  dailyReview,
  onChange,
  onClose,
}: {
  dailyReview: DailyReviewData;
  onChange: (updater: (d: DailyReviewData) => DailyReviewData) => void;
  onClose: () => void;
}) {
  const [dateKey, setDateKey] = useState(() => todayKey());
  const entry = dailyReviewEntryFor(dailyReview, dateKey);
  const isToday = dateKey === todayKey();

  function updateEntry(updater: (e: DailyReviewEntry) => DailyReviewEntry) {
    onChange((d) => ({
      ...d,
      entries: { ...d.entries, [dateKey]: updater(dailyReviewEntryFor(d, dateKey)) },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="font-serif text-[1.1rem] text-paper-ink">Daily Review</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper-surface2 px-3.5 py-1.5 text-sm font-medium text-paper-muted"
        >
          Done
        </button>
      </div>

      <div className="px-5">
        <WeekNav
          label={formatDayLabel(dateKey)}
          isCurrent={isToday}
          unit="day"
          currentLabel="Today"
          onPrev={() => setDateKey((k) => shiftDateKey(k, -1))}
          onNext={() => setDateKey((k) => shiftDateKey(k, 1))}
        />
      </div>

      <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-5">
          <JournalField
            prompt="What did I accomplish today?"
            value={entry.accomplished}
            onChange={(text) => updateEntry((e) => ({ ...e, accomplished: text }))}
          />
          <JournalField
            prompt="What is still waiting?"
            value={entry.stillWaiting}
            onChange={(text) => updateEntry((e) => ({ ...e, stillWaiting: text }))}
          />
          <JournalField
            prompt="What can I improve tomorrow?"
            value={entry.improveTomorrow}
            onChange={(text) => updateEntry((e) => ({ ...e, improveTomorrow: text }))}
          />
          <JournalField
            prompt="Biggest win today"
            value={entry.biggestWin}
            onChange={(text) => updateEntry((e) => ({ ...e, biggestWin: text }))}
            placeholder="One thing worth remembering…"
          />

          <EmojiPicker
            label="Mood"
            options={MOOD_OPTIONS}
            value={entry.mood}
            onChange={(mood) => updateEntry((e) => ({ ...e, mood }))}
          />
          <EmojiPicker
            label="Energy"
            options={ENERGY_OPTIONS}
            value={entry.energy}
            onChange={(energy) => updateEntry((e) => ({ ...e, energy }))}
          />
        </div>
      </div>
    </div>
  );
}
