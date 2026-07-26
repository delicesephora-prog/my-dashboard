"use client";

import { MealCalendarData, MealCalendarMonth, togglePrepTask } from "@/lib/mealcalendar";
import CheckCircle from "@/components/CheckCircle";

export default function PrepWeekendsTab({
  month,
  monthData,
  onChange,
}: {
  month: string;
  monthData: MealCalendarMonth;
  onChange: (updater: (m: MealCalendarData) => MealCalendarData) => void;
}) {
  if (monthData.prepWeekends.length === 0) {
    return (
      <p className="py-8 text-center font-serif text-[0.95rem] italic text-paper-muted">
        No prep weekends seeded for this month yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-1.5 font-serif text-[16px] text-gold">The rhythm</p>
        <p className="text-[13px] leading-relaxed text-paper-muted">
          <b className="text-paper-ink">Saturday</b> = shop + marinate + one fun dinner.{" "}
          <b className="text-paper-ink">Sunday</b> = one 90-minute power hour: a batch dish, a grain, a
          sauce, boiled eggs, chopped veg. <b className="text-paper-ink">Weeknights</b> = 20-minute assembly
          or reheat, never full cooking. Cook properly ~3x a week; the dim calendar days are the payoff.
        </p>
      </div>

      {monthData.prepWeekends.map((w) => {
        const doneCount = w.tasks.filter((t) => t.done).length;
        return (
          <div key={w.id} className="rounded-xl2 border border-paper-border bg-paper-surface2 p-4 shadow-paper">
            <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-serif text-[15px] text-paper-ink">{w.title}</p>
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-gold">
                {w.tag} · {doneCount}/{w.tasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {w.tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2.5">
                  <CheckCircle
                    done={t.done}
                    onToggle={() => onChange((d) => togglePrepTask(d, month, w.id, t.id))}
                    accentClass="bg-life"
                    size="sm"
                    ariaLabel={t.done ? "Mark task not done" : "Mark task done"}
                  />
                  <span
                    className={`text-[13px] leading-snug ${
                      t.done ? "text-paper-muted line-through" : "text-paper-ink"
                    }`}
                  >
                    {t.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
