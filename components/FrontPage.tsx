"use client";

import { useEffect, useRef, useState } from "react";
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
import { vocabForDate, factForDate } from "@/lib/welcome";
import { QuestData, isQuestDone, markQuestDone, questForDate } from "@/lib/quest";
import { CelebrationTier } from "@/lib/celebration";
import { burstConfettiMedium } from "@/lib/confetti";
import Greeting from "./Greeting";
import OneThing from "./OneThing";
import LifeScoreRing from "./LifeScoreRing";
import LifeScoreSheet from "./LifeScoreSheet";
import RhythmStrip from "./RhythmStrip";
import ProgressRing from "./ProgressRing";
import CheckCircle from "./CheckCircle";

const FOLDERS: { icon: string; label: string; target: FrontPageNavTarget }[] = [
  { icon: "📌", label: "Money", target: { world: "life", lifeView: "money" } },
  { icon: "🕯️", label: "Rituals", target: { world: "life", lifeView: "rituals" } },
  { icon: "🕓", label: "Glow Up", target: { world: "life", lifeView: "glowUp" } },
];

export default function FrontPage({
  data,
  oneThingText,
  onOneThingChange,
  onNavigate,
  onChangeLifeScore,
  onChangeRhythm,
  onOpenQuickDump,
  onOpenFocus,
  onToggleFocusTask,
  onChangeHomeZones,
  onChangeQuest,
  onCelebrate,
}: {
  data: DashboardData;
  oneThingText: string;
  onOneThingChange: (text: string) => void;
  onNavigate: (target: FrontPageNavTarget) => void;
  onChangeLifeScore: (updater: (l: LifeScoreData) => LifeScoreData) => void;
  onChangeRhythm: (updater: (r: RhythmData) => RhythmData) => void;
  onOpenQuickDump: () => void;
  onOpenFocus: () => void;
  onToggleFocusTask: (item: TodayFocusItem) => void;
  onChangeHomeZones: (updater: (h: HomeZonesData) => HomeZonesData) => void;
  onChangeQuest: (updater: (q: QuestData) => QuestData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="scroll-quiet flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <Greeting />
        {now && (
          <p className="-mt-2 text-[0.8rem] italic leading-snug text-paper-muted">
            {quoteForToday(now)}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => onNavigate(f.target)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-paper-border bg-paper-surface px-3 py-1.5 text-[11px] text-paper-muted active:scale-95"
            >
              <span>{f.icon}</span>
              <span className="font-medium text-paper-ink">{f.label}</span>
            </button>
          ))}
        </div>

        <OneThing value={oneThingText} onChange={onOneThingChange} suggestion={focusTasks[0]?.title} />

        {now && (
          <FrontPageBody
            data={data}
            now={now}
            focusTasks={focusTasks}
            onNavigate={onNavigate}
            onChangeLifeScore={onChangeLifeScore}
            onChangeRhythm={onChangeRhythm}
            onToggleFocusTask={onToggleFocusTask}
            onChangeHomeZones={onChangeHomeZones}
            onChangeQuest={onChangeQuest}
            onCelebrate={onCelebrate}
          />
        )}
      </div>

      {/* Below the scroll area, not overlaid on it - same pattern as
          DailyReviewBar, so it never covers content underneath. */}
      <div className="flex shrink-0 gap-1.5 rounded-full border border-paper-border bg-paper-surface p-1.5 shadow-paper">
        <DockButton icon="🧠" label="Dump" onClick={onOpenQuickDump} />
        <DockButton icon="🕯️" label="Focus" onClick={onOpenFocus} />
        <DockButton
          icon="🛒"
          label="Grocery"
          onClick={() => onNavigate({ world: "life", lifeView: "lists" })}
        />
      </div>
    </div>
  );
}

function DockButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-medium text-paper-ink active:scale-95"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FrontPageBody({
  data,
  now,
  focusTasks,
  onNavigate,
  onChangeLifeScore,
  onChangeRhythm,
  onToggleFocusTask,
  onChangeHomeZones,
  onChangeQuest,
  onCelebrate,
}: {
  data: DashboardData;
  now: Date;
  focusTasks: TodayFocusItem[];
  onNavigate: (target: FrontPageNavTarget) => void;
  onChangeLifeScore: (updater: (l: LifeScoreData) => LifeScoreData) => void;
  onChangeRhythm: (updater: (r: RhythmData) => RhythmData) => void;
  onToggleFocusTask: (item: TodayFocusItem) => void;
  onChangeHomeZones: (updater: (h: HomeZonesData) => HomeZonesData) => void;
  onChangeQuest: (updater: (q: QuestData) => QuestData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const atRisk = habitsAtRisk(data.habits, now);
  const recommendation = computeRecommendation(data, now);
  const recap = computeWeekRecap(data, now);
  const breakdown = computeLifeScoreBreakdown(data, now);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [timelineTab, setTimelineTab] = useState<"focus" | "rhythm">("focus");

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

  const vocab = vocabForDate(now);
  const fact = factForDate(now);

  const quest = questForDate(now);
  const questDone = isQuestDone(data.quest, now);
  const questCardRef = useRef<HTMLDivElement>(null);

  function completeQuest() {
    if (questDone) return;
    onChangeQuest((q) => markQuestDone(q, now));
    if (questCardRef.current) burstConfettiMedium(questCardRef.current);
    onCelebrate("medium", `Quest complete: ${quest.title}`);
  }

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

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3">
          <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold">
            ✦ Vocab of the Day
          </p>
          <p className="font-serif text-[1.05rem] leading-snug text-paper-ink">{vocab.word}</p>
          <p className="text-[10px] italic text-paper-faint">{vocab.partOfSpeech}</p>
          <p className="mt-1 text-[12px] leading-snug text-paper-muted">{vocab.definition}</p>
        </div>
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3">
          <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold">
            ✦ Fact of the Day
          </p>
          <p className="text-[12px] leading-snug text-paper-ink">{fact.fact}</p>
        </div>
      </div>

      <div
        ref={questCardRef}
        className={`flex items-center gap-3 rounded-xl2 border p-3 transition ${
          questDone
            ? "border-sage/40 bg-sage/10"
            : "border-dashed border-paper-border bg-paper-surface2"
        }`}
      >
        <span className="shrink-0 text-xl">🗺️</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-paper-ink">{quest.title}</p>
          <p className="text-[11px] leading-snug text-paper-muted">{quest.description}</p>
        </div>
        <button
          type="button"
          onClick={completeQuest}
          disabled={questDone}
          aria-label={questDone ? "Quest complete" : "Complete quest"}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
            questDone
              ? "border-sage/40 text-sage"
              : "border-paper-border text-paper-muted active:scale-95"
          }`}
        >
          {questDone ? "Done" : "Complete"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Today at a Glance
        </p>
        <div className="flex items-center justify-around">
          <RingStat pct={morning.pct ?? 0} color="#B08B4F" label="Morning" />
          <RingStat pct={dayRoutine.pct ?? 0} color="#5B2333" label="Day" />
          <RingStat pct={night.pct ?? 0} color="#3D1622" label="Night" />
          <RingStat pct={recap.avgHabitPct} color="#8A9B7C" label="Habits" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-[48px] w-[48px] flex-col items-center justify-center rounded-full border-2 border-work">
              <span className="font-serif text-sm leading-none text-paper-ink">
                {daysUntilDecember8(now)}
              </span>
              <span className="text-[7px] uppercase tracking-wide text-paper-faint">days</span>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-paper-muted">Dec 8</span>
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
        <div className="mb-3 flex gap-1 rounded-full bg-paper-surface2 p-1">
          <button
            type="button"
            onClick={() => setTimelineTab("focus")}
            className={`flex-1 rounded-full py-1.5 text-[11.5px] font-medium transition ${
              timelineTab === "focus"
                ? "bg-paper-surface text-paper-ink shadow-paper"
                : "text-paper-muted"
            }`}
          >
            Today&apos;s Focus
          </button>
          <button
            type="button"
            onClick={() => setTimelineTab("rhythm")}
            className={`flex-1 rounded-full py-1.5 text-[11.5px] font-medium transition ${
              timelineTab === "rhythm"
                ? "bg-paper-surface text-paper-ink shadow-paper"
                : "text-paper-muted"
            }`}
          >
            Rhythm
          </button>
        </div>

        {timelineTab === "focus" ? (
          focusTasks.length === 0 ? (
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
          )
        ) : (
          <RhythmStrip
            rhythmData={data.rhythm}
            paydayAnchorDate={data.lifeQuarterly.paydayChecklist.anchorDate}
            now={now}
            onChange={onChangeRhythm}
            bare
          />
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
      <ProgressRing pct={pct} size={48} strokeWidth={4.5} color={color} label={`${pct}%`} />
      <span className="text-[10px] uppercase tracking-wide text-paper-muted">{label}</span>
    </div>
  );
}
