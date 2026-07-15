"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types";
import { quoteForToday } from "@/lib/quotes";
import {
  FrontPageNavTarget,
  computeRecommendation,
  computeWeekRecap,
  habitsAtRisk,
  pinnedFocusTasks,
  todayHabitProgress,
} from "@/lib/frontpage";
import {
  LifeScoreData,
  computeLifeScoreBreakdown,
  last30DaysScoreHistory,
  recordTodayScore,
} from "@/lib/lifescore";
import Greeting from "./Greeting";
import OneThing from "./OneThing";
import LifeScoreRing from "./LifeScoreRing";
import LifeScoreSheet from "./LifeScoreSheet";

export default function FrontPage({
  data,
  oneThingText,
  onOneThingChange,
  counts,
  onNavigate,
  onChangeLifeScore,
  onOpenQuickDump,
}: {
  data: DashboardData;
  oneThingText: string;
  onOneThingChange: (text: string) => void;
  counts: { work: number; life: number };
  onNavigate: (target: FrontPageNavTarget) => void;
  onChangeLifeScore: (updater: (l: LifeScoreData) => LifeScoreData) => void;
  onOpenQuickDump: () => void;
}) {
  // Deferred to the client, same as Greeting - the recommendation, "today"
  // habit progress, and week recap are all timezone-sensitive, so they
  // must reflect the visitor's own clock, not the server's.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const focusTasks = pinnedFocusTasks(data);

  return (
    <div className="scroll-quiet flex flex-col gap-3 overflow-y-auto pb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Greeting />
          {now && (
            <p className="mt-1.5 text-[0.8rem] italic leading-snug text-paper-muted">
              {quoteForToday(now)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenQuickDump}
          aria-label="Quick Dump"
          className="flex shrink-0 items-center gap-1 rounded-full bg-work px-3 py-2 text-[12px] font-medium text-paper-surface shadow-paper active:scale-95"
        >
          🧠 Dump
        </button>
      </div>

      <OneThing value={oneThingText} onChange={onOneThingChange} />

      {now && (
        <FrontPageBody
          data={data}
          now={now}
          counts={counts}
          focusTasks={focusTasks}
          onNavigate={onNavigate}
          onChangeLifeScore={onChangeLifeScore}
        />
      )}
    </div>
  );
}

function FrontPageBody({
  data,
  now,
  counts,
  focusTasks,
  onNavigate,
  onChangeLifeScore,
}: {
  data: DashboardData;
  now: Date;
  counts: { work: number; life: number };
  focusTasks: ReturnType<typeof pinnedFocusTasks>;
  onNavigate: (target: FrontPageNavTarget) => void;
  onChangeLifeScore: (updater: (l: LifeScoreData) => LifeScoreData) => void;
}) {
  const habitProgress = todayHabitProgress(data.habits, now);
  const atRisk = habitsAtRisk(data.habits, now);
  const recommendation = computeRecommendation(data, now);
  const recap = computeWeekRecap(data, now);
  const breakdown = computeLifeScoreBreakdown(data, now);
  const [scoreOpen, setScoreOpen] = useState(false);

  useEffect(() => {
    onChangeLifeScore((l) => recordTodayScore(l, breakdown.score, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdown.score]);

  return (
    <>
      <LifeScoreRing score={breakdown.score} label={breakdown.label} onTap={() => setScoreOpen(true)} />
      {scoreOpen && (
        <LifeScoreSheet
          breakdown={breakdown}
          history={last30DaysScoreHistory(data.lifeScore, now)}
          onClose={() => setScoreOpen(false)}
        />
      )}

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Today at a Glance
        </p>

        {focusTasks.length > 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            {focusTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate({ world: "work", workView: "dashboard" })}
                className="flex items-center gap-2 rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2 text-left text-[13px] text-paper-ink transition active:scale-[0.99]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-work" />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onNavigate({ world: "work", workView: "dashboard" })}
            className="rounded-xl border border-paper-border bg-paper-surface2 px-2 py-2.5 text-center transition active:scale-[0.97]"
          >
            <div className="font-serif text-xl text-paper-ink">{counts.work}</div>
            <div className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-paper-muted">
              Work Open
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ world: "life", lifeView: "week" })}
            className="rounded-xl border border-paper-border bg-paper-surface2 px-2 py-2.5 text-center transition active:scale-[0.97]"
          >
            <div className="font-serif text-xl text-paper-ink">{counts.life}</div>
            <div className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-paper-muted">
              Life Open
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ world: "life", lifeView: "habits" })}
            className="rounded-xl border border-paper-border bg-paper-surface2 px-2 py-2.5 text-center transition active:scale-[0.97]"
          >
            <div className="font-serif text-xl text-work">{habitProgress.pct}%</div>
            <div className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-paper-muted">
              Habits Today
            </div>
          </button>
        </div>

        {atRisk.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#C7A46B]/40 bg-[#C7A46B]/10 px-3 py-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#8A6F3D]">
              Streaks at risk
            </p>
            <p className="mt-0.5 text-[13px] text-paper-ink">
              {atRisk
                .map((r) => `${r.habit.icon} ${r.habit.label} (${r.doneCount}/${r.habit.weeklyGoal})`)
                .join(" · ")}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => recommendation && onNavigate(recommendation.target)}
        disabled={!recommendation}
        className="rounded-xl2 border border-work/30 bg-work-soft p-4 text-left shadow-paper transition active:scale-[0.99] disabled:active:scale-100"
      >
        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-work-dark">
          Suggested Next
        </p>
        <p className="font-serif text-[1.05rem] leading-snug text-paper-ink">
          {recommendation ? recommendation.text : "You're all caught up. Nothing urgent right now."}
        </p>
      </button>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          This Week So Far
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-serif text-lg text-paper-ink">
              {recap.tasksDone}/{recap.tasksTotal}
            </div>
            <div className="mt-0.5 text-[0.62rem] uppercase tracking-wide text-paper-muted">
              Tasks Done
            </div>
          </div>
          <div>
            <div className="font-serif text-lg text-paper-ink">
              {recap.workoutsLogged}/{recap.workoutGoal}
            </div>
            <div className="mt-0.5 text-[0.62rem] uppercase tracking-wide text-paper-muted">
              Workouts
            </div>
          </div>
          <div>
            <div className="font-serif text-lg text-paper-ink">{recap.avgHabitPct}%</div>
            <div className="mt-0.5 text-[0.62rem] uppercase tracking-wide text-paper-muted">
              Habits Avg
            </div>
          </div>
        </div>
        {recap.winOfWeek && (
          <div className="mt-3 border-t border-paper-border pt-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-paper-muted">
              Win of the Week
            </p>
            <p className="mt-0.5 font-serif text-[0.95rem] italic text-paper-ink">
              {recap.winOfWeek.text}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
