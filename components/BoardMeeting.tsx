"use client";

import { useState } from "react";
import {
  DashboardData,
  TransformationCategoryKey,
  TRANSFORMATION_CATEGORIES,
  quarterDataFor,
  weekDataFor,
} from "@/lib/types";
import { dateKey, todayKey } from "@/lib/date";
import { shiftWeekKey, formatWeekRange } from "@/lib/week";
import { quarterKeyFor } from "@/lib/quarter";
import {
  BoardMeetingRecord,
  emptyWarRoomMoves,
  avgLifeScoreForWeek,
  avgRoutineConsistencyForWeek,
  moneyTotals,
  previousMeeting,
  recordMeeting,
  weekKeyBeingReviewed,
} from "@/lib/boardmeeting";

type Draft = {
  wins: string[];
  whatSlipped: string;
  weeklyFocus: [string, string, string];
  goals: [string, string, string];
  warRoomMoves: Record<TransformationCategoryKey, string>;
};

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDelta(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatMoney(n)}`;
}

export default function BoardMeeting({
  data,
  onChangeData,
  onClose,
}: {
  data: DashboardData;
  onChangeData: (updater: (d: DashboardData) => DashboardData) => void;
  onClose: () => void;
}) {
  const now = useState(() => new Date())[0];
  const weekKey = weekKeyBeingReviewed(now);
  const nextWeekKey = shiftWeekKey(weekKey, 1);
  const nextWeekData = weekDataFor(data.lifeWeekly, nextWeekKey);

  const lifeScoreAvg = avgLifeScoreForWeek(data.lifeScore.history, weekKey);
  const routineConsistencyAvg = avgRoutineConsistencyForWeek(data, weekKey);
  const { vaultTotal, debtTotal } = moneyTotals(data.lifeQuarterly.money);
  const prevMeeting = previousMeeting(data.boardMeetings, todayKey(now));

  const [screen, setScreen] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => ({
    wins: [""],
    whatSlipped: "",
    weeklyFocus: [
      nextWeekData.weeklyFocus[0] ?? "",
      nextWeekData.weeklyFocus[1] ?? "",
      nextWeekData.weeklyFocus[2] ?? "",
    ],
    goals: ["", "", ""],
    warRoomMoves: TRANSFORMATION_CATEGORIES.reduce(
      (acc, key) => ({ ...acc, [key]: data.year.warRoom.categories[key].thisWeeksMove }),
      emptyWarRoomMoves()
    ),
  }));
  const [finished, setFinished] = useState(false);

  const TOTAL_SCREENS = 9;

  function finish() {
    const cleanWins = draft.wins.map((w) => w.trim()).filter(Boolean);
    const cleanGoals = draft.goals.map((g) => g.trim()).filter(Boolean) as string[];
    const record: BoardMeetingRecord = {
      date: todayKey(now),
      weekKeyReviewed: weekKey,
      lifeScoreAvg,
      routineConsistencyAvg,
      wins: cleanWins,
      whatSlipped: draft.whatSlipped,
      vaultTotal,
      debtTotal,
      vaultDelta: prevMeeting ? vaultTotal - prevMeeting.vaultTotal : null,
      debtDelta: prevMeeting ? debtTotal - prevMeeting.debtTotal : null,
      weeklyFocus: draft.weeklyFocus,
      goals: cleanGoals,
      warRoomMoves: draft.warRoomMoves,
    };

    onChangeData((d) => {
      const quarterKey = quarterKeyFor(now);
      const quarterData = quarterDataFor(d.lifeQuarterly, quarterKey);
      const newAchievements = cleanWins.map((text) => ({
        id: crypto.randomUUID(),
        date: dateKey(now),
        text,
      }));
      const newGoals = cleanGoals.map((text) => ({
        id: crypto.randomUUID(),
        category: "Personal" as const,
        text,
        done: false,
      }));

      return {
        ...d,
        boardMeetings: recordMeeting(d.boardMeetings, record),
        lifeQuarterly: {
          ...d.lifeQuarterly,
          quarters: {
            ...d.lifeQuarterly.quarters,
            [quarterKey]: {
              ...quarterData,
              achievements: [...quarterData.achievements, ...newAchievements],
              goals: [...quarterData.goals, ...newGoals],
            },
          },
        },
        lifeWeekly: {
          ...d.lifeWeekly,
          weeks: {
            ...d.lifeWeekly.weeks,
            [nextWeekKey]: { ...nextWeekData, weeklyFocus: draft.weeklyFocus },
          },
        },
        year: {
          ...d.year,
          warRoom: {
            ...d.year.warRoom,
            categories: TRANSFORMATION_CATEGORIES.reduce(
              (acc, key) => ({
                ...acc,
                [key]: {
                  ...d.year.warRoom.categories[key],
                  thisWeeksMove: draft.warRoomMoves[key],
                  thisWeeksMoveSetDate: dateKey(now),
                },
              }),
              { ...d.year.warRoom.categories }
            ),
          },
        },
      };
    });

    setFinished(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-paper-muted">
          Weekly Board Meeting
        </p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-paper-muted">
          ✕
        </button>
      </div>

      <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-4">
        {!finished ? (
          <>
            <div className="mb-4 flex gap-1">
              {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{ backgroundColor: i <= screen ? "#4B5A24" : "#E7DFCF" }}
                />
              ))}
            </div>

            {screen === 0 && (
              <Screen title="Weekly Board Meeting">
                <p className="mb-2 font-serif text-[1.15rem] leading-relaxed text-paper-ink">
                  You&apos;re the CEO of your own life. This is your ten-minute review of the
                  week of {formatWeekRange(weekKey)}.
                </p>
                <p className="text-[13px] text-paper-muted">
                  One screen at a time. Take your time - there&apos;s no rush.
                </p>
              </Screen>
            )}

            {screen === 1 && (
              <Screen title="Last Week's Numbers">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Life Score Avg" value={lifeScoreAvg === null ? "—" : String(lifeScoreAvg)} />
                  <Stat
                    label="Routine Consistency"
                    value={routineConsistencyAvg === null ? "—" : `${routineConsistencyAvg}%`}
                  />
                </div>
              </Screen>
            )}

            {screen === 2 && (
              <Screen title="Wins to Log">
                <p className="mb-3 text-[13px] text-paper-muted">
                  What went right this week? Even small wins count.
                </p>
                <div className="flex flex-col gap-2">
                  {draft.wins.map((win, i) => (
                    <input
                      key={i}
                      value={win}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          wins: d.wins.map((w, wi) => (wi === i ? e.target.value : w)),
                        }))
                      }
                      placeholder="A win this week…"
                      className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[14px] text-paper-ink outline-none"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, wins: [...d.wins, ""] }))}
                  className="mt-2 text-xs font-medium text-work"
                >
                  + Add another win
                </button>
              </Screen>
            )}

            {screen === 3 && (
              <Screen title="What Slipped">
                <p className="mb-3 text-[13px] text-paper-muted">
                  What didn&apos;t go as planned? No judgment - just noticing.
                </p>
                <textarea
                  value={draft.whatSlipped}
                  onChange={(e) => setDraft((d) => ({ ...d, whatSlipped: e.target.value }))}
                  rows={6}
                  placeholder="Write freely…"
                  className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 p-3 text-[14px] leading-relaxed text-paper-ink outline-none"
                />
              </Screen>
            )}

            {screen === 4 && (
              <Screen title="Vault & Debt Movement">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Total Saved" value={formatMoney(vaultTotal)} />
                  <Stat label="Total Debt" value={formatMoney(debtTotal)} />
                </div>
                {prevMeeting && (
                  <div className="mt-3 rounded-xl border border-paper-border bg-paper-surface2 p-3 text-[13px] text-paper-ink">
                    <p>Vaults since last meeting: {formatDelta(vaultTotal - prevMeeting.vaultTotal)}</p>
                    <p>Debt since last meeting: {formatDelta(debtTotal - prevMeeting.debtTotal)}</p>
                  </div>
                )}
                {!prevMeeting && (
                  <p className="mt-3 text-[12px] italic text-paper-muted">
                    This is your first meeting - future ones will show what moved since this one.
                  </p>
                )}
              </Screen>
            )}

            {screen === 5 && (
              <Screen title="Next Week's Focus">
                <p className="mb-3 text-[13px] text-paper-muted">
                  Three things that matter most next week.
                </p>
                <div className="flex flex-col gap-2">
                  {draft.weeklyFocus.map((f, i) => (
                    <input
                      key={i}
                      value={f}
                      onChange={(e) =>
                        setDraft((d) => {
                          const next = [...d.weeklyFocus] as [string, string, string];
                          next[i] = e.target.value;
                          return { ...d, weeklyFocus: next };
                        })
                      }
                      placeholder={`Focus ${i + 1}…`}
                      className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[14px] text-paper-ink outline-none"
                    />
                  ))}
                </div>
              </Screen>
            )}

            {screen === 6 && (
              <Screen title="Set 3 Goals">
                <p className="mb-3 text-[13px] text-paper-muted">
                  Three concrete goals for this quarter, added to your Quarterly Goals.
                </p>
                <div className="flex flex-col gap-2">
                  {draft.goals.map((g, i) => (
                    <input
                      key={i}
                      value={g}
                      onChange={(e) =>
                        setDraft((d) => {
                          const next = [...d.goals] as [string, string, string];
                          next[i] = e.target.value;
                          return { ...d, goals: next };
                        })
                      }
                      placeholder={`Goal ${i + 1}…`}
                      className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[14px] text-paper-ink outline-none"
                    />
                  ))}
                </div>
              </Screen>
            )}

            {screen === 7 && (
              <Screen title="This Week's Move">
                <p className="mb-3 text-[13px] text-paper-muted">
                  One action for each December 8 category.
                </p>
                <div className="flex flex-col gap-2.5">
                  {TRANSFORMATION_CATEGORIES.map((key) => (
                    <div key={key}>
                      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                        {key}
                      </p>
                      <input
                        value={draft.warRoomMoves[key]}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            warRoomMoves: { ...d.warRoomMoves, [key]: e.target.value },
                          }))
                        }
                        placeholder="One action…"
                        className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[14px] text-paper-ink outline-none"
                      />
                    </div>
                  ))}
                </div>
              </Screen>
            )}

            {screen === 8 && (
              <SummaryPreview
                weekKey={weekKey}
                lifeScoreAvg={lifeScoreAvg}
                routineConsistencyAvg={routineConsistencyAvg}
                wins={draft.wins.map((w) => w.trim()).filter(Boolean)}
                whatSlipped={draft.whatSlipped}
                vaultTotal={vaultTotal}
                debtTotal={debtTotal}
                weeklyFocus={draft.weeklyFocus}
                goals={draft.goals.map((g) => g.trim()).filter(Boolean)}
                warRoomMoves={draft.warRoomMoves}
              />
            )}

            <div className="mt-5 flex gap-2">
              {screen > 0 && (
                <button
                  type="button"
                  onClick={() => setScreen((s) => s - 1)}
                  className="flex-1 rounded-xl border border-paper-border bg-paper-surface py-3 text-sm font-medium text-paper-muted"
                >
                  Back
                </button>
              )}
              {screen < TOTAL_SCREENS - 1 ? (
                <button
                  type="button"
                  onClick={() => setScreen((s) => s + 1)}
                  className="flex-1 rounded-xl bg-work py-3 text-sm font-medium text-paper-surface"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="flex-1 rounded-xl bg-life py-3 text-sm font-medium text-paper-surface"
                >
                  Finish the Meeting
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <SummaryPreview
              weekKey={weekKey}
              lifeScoreAvg={lifeScoreAvg}
              routineConsistencyAvg={routineConsistencyAvg}
              wins={draft.wins.map((w) => w.trim()).filter(Boolean)}
              whatSlipped={draft.whatSlipped}
              vaultTotal={vaultTotal}
              debtTotal={debtTotal}
              weeklyFocus={draft.weeklyFocus}
              goals={draft.goals.map((g) => g.trim()).filter(Boolean)}
              warRoomMoves={draft.warRoomMoves}
            />
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-work py-3 text-sm font-medium text-paper-surface"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-serif text-[1.2rem] text-paper-ink">{title}</p>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface2 p-3 text-center">
      <p className="font-serif text-2xl text-paper-ink">{value}</p>
      <p className="mt-0.5 text-[0.62rem] uppercase tracking-wide text-paper-muted">{label}</p>
    </div>
  );
}

export function SummaryPreview({
  weekKey,
  lifeScoreAvg,
  routineConsistencyAvg,
  wins,
  whatSlipped,
  vaultTotal,
  debtTotal,
  weeklyFocus,
  goals,
  warRoomMoves,
}: {
  weekKey: string;
  lifeScoreAvg: number | null;
  routineConsistencyAvg: number | null;
  wins: string[];
  whatSlipped: string;
  vaultTotal: number;
  debtTotal: number;
  weeklyFocus: string[];
  goals: string[];
  warRoomMoves: Record<TransformationCategoryKey, string>;
}) {
  return (
    <div className="rounded-xl2 border border-life bg-paper-surface p-5 shadow-paper-lg">
      <p className="mb-1 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-life">
        Board Meeting Summary
      </p>
      <p className="mb-4 text-center font-serif text-[1.1rem] text-paper-ink">
        Week of {formatWeekRange(weekKey)}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="Life Score Avg" value={lifeScoreAvg === null ? "—" : String(lifeScoreAvg)} />
        <Stat
          label="Routine Consistency"
          value={routineConsistencyAvg === null ? "—" : `${routineConsistencyAvg}%`}
        />
      </div>

      {wins.length > 0 && (
        <SummarySection title="Wins">
          <ul className="list-disc pl-4 text-[13.5px] text-paper-ink">
            {wins.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </SummarySection>
      )}

      {whatSlipped && (
        <SummarySection title="What Slipped">
          <p className="whitespace-pre-wrap text-[13.5px] text-paper-ink">{whatSlipped}</p>
        </SummarySection>
      )}

      <SummarySection title="Money">
        <p className="text-[13.5px] text-paper-ink">
          {formatMoney(vaultTotal)} saved · {formatMoney(debtTotal)} debt
        </p>
      </SummarySection>

      {weeklyFocus.some(Boolean) && (
        <SummarySection title="Next Week's Focus">
          <ul className="list-disc pl-4 text-[13.5px] text-paper-ink">
            {weeklyFocus.filter(Boolean).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </SummarySection>
      )}

      {goals.length > 0 && (
        <SummarySection title="New Goals">
          <ul className="list-disc pl-4 text-[13.5px] text-paper-ink">
            {goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </SummarySection>
      )}

      {TRANSFORMATION_CATEGORIES.some((k) => warRoomMoves[k]) && (
        <SummarySection title="This Week's Moves">
          <ul className="text-[13.5px] text-paper-ink">
            {TRANSFORMATION_CATEGORIES.filter((k) => warRoomMoves[k]).map((k) => (
              <li key={k}>
                <span className="font-medium">{k}:</span> {warRoomMoves[k]}
              </li>
            ))}
          </ul>
        </SummarySection>
      )}
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 border-t border-paper-border pt-3">
      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-paper-muted">
        {title}
      </p>
      {children}
    </div>
  );
}
