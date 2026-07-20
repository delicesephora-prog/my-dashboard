"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types";
import { quoteForToday } from "@/lib/quotes";
import {
  FrontPageNavTarget,
  TodayFocusItem,
  computeRecommendation,
  computeWeekRecap,
  habitsAtRisk,
  pinnedFocusTasks,
} from "@/lib/frontpage";
import {
  LifeScoreData,
  computeLifeScoreBreakdown,
  last30DaysScoreHistory,
  recordTodayScore,
} from "@/lib/lifescore";
import { RhythmData } from "@/lib/rhythm";
import { HomeZonesData, completedTaskIds, toggleZoneTask, zoneForDate } from "@/lib/home";
import { completionForDate } from "@/lib/routines";
import { daysUntilDecember8 } from "@/lib/warroom";
import { dateKey } from "@/lib/date";
import Greeting from "./Greeting";
import OneThing from "./OneThing";
import LifeScoreRing from "./LifeScoreRing";
import LifeScoreSheet from "./LifeScoreSheet";
import RhythmStrip from "./RhythmStrip";
import ProgressRing from "./ProgressRing";
import CheckCircle from "./CheckCircle";

export default function FrontPage({
  data,
  oneThingText,
  onOneThingChange,
  counts,
  onNavigate,
  onChangeLifeScore,
  onChangeRhythm,
  onOpenQuickDump,
  onToggleFocusTask,
  onChangeHomeZones,
}: {
  data: DashboardData;
  oneThingText: string;
  onOneThingChange: (text: string) => void;
  counts: { work: number; life: number };
  onNavigate: (target: FrontPageNavTarget) => void;
  onChangeLifeScore: (updater: (l: LifeScoreData) => LifeScoreData) => void;
  onChangeRhythm: (updater: (r: RhythmData) => RhythmData) => void;
  onOpenQuickDump: () => void;
  onToggleFocusTask: (item: TodayFocusItem) => void;
  onChangeHomeZones: (updater: (h: HomeZonesData) => HomeZonesData) => void;
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
          onChangeRhythm={onChangeRhythm}
          onToggleFocusTask={onToggleFocusTask}
          onChangeHomeZones={onChangeHomeZones}
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
  onChangeRhythm,
  onToggleFocusTask,
  onChangeHomeZones,
}: {
  data: DashboardData;
  now: Date;
  counts: { work: number; life: number };
  focusTasks: TodayFocusItem[];
  onNavigate: (target: FrontPageNavTarget) => void;
  onChangeLifeScore: (updater: (l: LifeScoreData) => LifeScoreData) => void;
  onChangeRhythm: (updater: (r: RhythmData) => RhythmData) => void;
  onToggleFocusTask: (item: TodayFocusItem) => void;
  onChangeHomeZones: (updater: (h: HomeZonesData) => HomeZonesData) => void;
}) {
  const atRisk = habitsAtRisk(data.habits, now);
  const recommendation = computeRecommendation(data, now);
  const recap = computeWeekRecap(data, now);
  const breakdown = computeLifeScoreBreakdown(data, now);
  const [scoreOpen, setScoreOpen] = useState(false);

  useEffect(() => {
    onChangeLifeScore((l) => recordTodayScore(l, breakdown.score, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdown.score]);

  const morning = completionForDate(data.routines.config, data.routines, "morning", now);
  const dayRoutine = completionForDate(data.routines.config, data.routines, "day", now);
  const night = completionForDate(data.routines.config, data.routines, "night", now);

  const zone = zoneForDate(data.homeZones, now);
  const zoneDoneIds = zone
    ? new Set(completedTaskIds(data.homeZones, dateKey(now), zone.id))
    : new Set<string>();

  return (
    <>
      <button
        type="button"
        onClick={() => recommendation.target && onNavigate(recommendation.target)}
        disabled={!recommendation.target}
        className="rounded-xl2 border-l-4 border-gold bg-paper-surface p-4 text-left shadow-paper transition active:scale-[0.99] disabled:active:scale-100"
      >
        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold">
          Suggested Next
        </p>
        <p className="font-serif text-[1.05rem] leading-snug text-paper-ink">{recommendation.text}</p>
      </button>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Today at a Glance
        </p>

        <div className="mb-4 flex items-center justify-around">
          <RingStat pct={morning.pct ?? 0} color="#B08B4F" label="Morning" />
          <RingStat pct={dayRoutine.pct ?? 0} color="#5B2333" label="Day" />
          <RingStat pct={night.pct ?? 0} color="#3D1622" label="Night" />
          <RingStat pct={recap.avgHabitPct} color="#8A9B7C" label="Habits" />
        </div>

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
          <div className="rounded-xl border border-paper-border bg-paper-surface2 px-2 py-2.5 text-center">
            <div className="font-serif text-xl text-work">{daysUntilDecember8(now)}</div>
            <div className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-paper-muted">
              Days to Dec 8
            </div>
          </div>
        </div>

        {atRisk.length > 0 && (
          <div className="mt-3 rounded-xl border border-gold/40 bg-gold-soft px-3 py-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-paper-ink">
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

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Today&apos;s Focus
        </p>
        {focusTasks.length === 0 ? (
          <p className="text-[13px] italic text-paper-muted">
            Nothing pinned yet. Star a task on Work or Life to see it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {focusTasks.map((item) => (
              <li key={`${item.side}-${item.id}`} className="flex items-center gap-2.5">
                <CheckCircle
                  done={false}
                  onToggle={() => onToggleFocusTask(item)}
                  accentClass="bg-work"
                  size="sm"
                  ariaLabel="Mark done"
                />
                <span className="min-w-0 flex-1 truncate text-[14px] text-paper-ink">{item.title}</span>
                <span className="shrink-0 rounded-full border border-paper-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-paper-muted">
                  {item.side}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {zone && (
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Today&apos;s Home Zone — {zone.label}
          </p>
          <ul className="flex flex-col gap-2">
            {zone.tasks.map((t) => {
              const done = zoneDoneIds.has(t.id);
              return (
                <li key={t.id} className="flex items-center gap-2.5">
                  <CheckCircle
                    done={done}
                    onToggle={() => onChangeHomeZones((h) => toggleZoneTask(h, zone.id, t.id, now))}
                    accentClass="bg-sage"
                    size="sm"
                    ariaLabel={done ? "Mark not done" : "Mark done"}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-[14px] ${
                      done ? "text-paper-faint line-through" : "text-paper-ink"
                    }`}
                  >
                    {t.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <LifeScoreRing score={breakdown.score} label={breakdown.label} onTap={() => setScoreOpen(true)} />
      {scoreOpen && (
        <LifeScoreSheet
          breakdown={breakdown}
          history={last30DaysScoreHistory(data.lifeScore, now)}
          onClose={() => setScoreOpen(false)}
        />
      )}

      <RhythmStrip
        rhythmData={data.rhythm}
        paydayAnchorDate={data.lifeQuarterly.paydayChecklist.anchorDate}
        now={now}
        onChange={onChangeRhythm}
      />

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

function RingStat({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ProgressRing pct={pct} size={52} strokeWidth={5} color={color} label={`${pct}%`} />
      <span className="text-[10px] uppercase tracking-wide text-paper-muted">{label}</span>
    </div>
  );
}
