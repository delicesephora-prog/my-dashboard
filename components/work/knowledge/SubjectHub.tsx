"use client";

import { KnowledgeData, computeMastery, dueCardsForSubject } from "@/lib/knowledge";
import MasteryBadge from "./MasteryBadge";

export default function SubjectHub({
  knowledge,
  onOpenSubject,
  onOpenPrep,
  onOpenAdd,
}: {
  knowledge: KnowledgeData;
  onOpenSubject: (id: string) => void;
  onOpenPrep: () => void;
  onOpenAdd: () => void;
}) {
  const now = new Date();
  const streak = knowledge.scholarStreak;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl2 bg-work p-4 pb-3.5 shadow-paper-lg">
        <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E6B98A]">Scholar Streak</p>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-serif text-3xl leading-none text-paper-surface">{streak.current}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-work-soft">
              day{streak.current === 1 ? "" : "s"} in a row
            </div>
          </div>
          <div className="text-right text-[11px] text-work-soft">Best: {streak.longest}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {knowledge.subjects.map((s) => {
          const mastery = computeMastery(s.id, knowledge);
          const due = dueCardsForSubject(knowledge.cards, s.id, now, 100).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpenSubject(s.id)}
              className="rounded-xl2 border border-paper-border bg-paper-surface p-4 text-left shadow-paper active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-semibold text-paper-ink">{s.name}</div>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-paper-muted">{s.pitch}</p>
                </div>
                <MasteryBadge level={mastery.level} score={mastery.score} />
              </div>
              {due > 0 && <p className="mt-2 text-[11px] font-medium text-work">{due} card{due === 1 ? "" : "s"} due</p>}
            </button>
          );
        })}
        {knowledge.subjects.length === 0 && (
          <p className="py-6 text-center text-[13px] italic text-paper-muted">No subjects yet - add your first one below.</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenPrep}
          className="flex-1 rounded-xl2 border border-paper-border bg-paper-surface py-3 text-[13px] font-medium text-paper-ink active:scale-[0.98]"
        >
          📋 Prep for 1:1
        </button>
        <button
          type="button"
          onClick={onOpenAdd}
          className="flex-1 rounded-xl2 border border-work py-3 text-[13px] font-medium text-work active:scale-[0.98]"
        >
          + Add Subject
        </button>
      </div>
    </div>
  );
}
