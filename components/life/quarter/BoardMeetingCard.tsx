"use client";

import { useState } from "react";
import { BoardMeetingData, hasMeetingThisWeek, sortedMeetingDates } from "@/lib/boardmeeting";
import { formatWeekRange } from "@/lib/week";
import { SummaryPreview } from "../../BoardMeeting";

export default function BoardMeetingCard({
  boardMeetings,
  onStart,
}: {
  boardMeetings: BoardMeetingData;
  onStart: () => void;
}) {
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const doneThisWeek = hasMeetingThisWeek(boardMeetings);
  const dates = sortedMeetingDates(boardMeetings);
  const viewing = viewingDate ? boardMeetings.meetings[viewingDate] : null;

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Weekly Board Meeting
        </p>
        {doneThisWeek && <span className="text-[11px] font-medium text-life">Done this week ✓</span>}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-xl bg-life py-2.5 text-center text-[13px] font-medium text-paper-surface transition active:scale-[0.98]"
      >
        {doneThisWeek ? "Redo This Week's Meeting" : "Start This Week's Meeting"}
      </button>

      {dates.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
            Past Meetings
          </p>
          {dates.slice(0, 6).map((date) => {
            const record = boardMeetings.meetings[date];
            return (
              <button
                key={date}
                type="button"
                onClick={() => setViewingDate(date)}
                className="rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-left text-[12.5px] text-paper-ink"
              >
                Week of {formatWeekRange(record.weekKeyReviewed)}
              </button>
            );
          })}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
          <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
            <p className="font-serif text-[1.1rem] text-paper-ink">Board Meeting</p>
            <button
              type="button"
              onClick={() => setViewingDate(null)}
              aria-label="Close"
              className="text-paper-muted"
            >
              ✕
            </button>
          </div>
          <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-4">
            <SummaryPreview
              weekKey={viewing.weekKeyReviewed}
              lifeScoreAvg={viewing.lifeScoreAvg}
              routineConsistencyAvg={viewing.routineConsistencyAvg}
              wins={viewing.wins}
              whatSlipped={viewing.whatSlipped}
              vaultTotal={viewing.vaultTotal}
              debtTotal={viewing.debtTotal}
              weeklyFocus={viewing.weeklyFocus}
              goals={viewing.goals}
              warRoomMoves={viewing.warRoomMoves}
            />
          </div>
        </div>
      )}
    </div>
  );
}
