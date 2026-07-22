"use client";

import { useMemo, useState } from "react";
import { DashboardData, quarterDataFor } from "@/lib/types";
import { quarterKeyFor } from "@/lib/quarter";
import {
  TabUsageRow,
  buildUsageReport,
  hideTab,
  unhideTab,
  isTabHidden,
  addSystemCheckLog,
} from "@/lib/systemcheck";

// Approximates "items added" as "items currently there" - see the note in
// lib/systemcheck.ts. One entry per tracked tab key; Verses has no data
// model of its own, so it's hardcoded to 0.
function computeItemCounts(data: DashboardData, now: Date): Record<string, number> {
  const quarterKey = quarterKeyFor(now);
  const quarter = quarterDataFor(data.lifeQuarterly, quarterKey);
  const warRoomSnapshots = Object.values(data.year.warRoom.categories).reduce(
    (sum, c) => sum + c.snapshots.length,
    0
  );
  const rhythmItems = Object.values(data.rhythm.days).reduce((sum, day) => sum + day.length, 0);

  return {
    "work:dashboard": data.work.tasks.length,
    "work:cadence": data.cadence.items.length,
    "work:backbeat":
      data.backBeat.sites.length +
      data.backBeat.translations.length +
      data.backBeat.edcAccess.length +
      data.backBeat.uberHealth.length,
    "work:ops": data.waitingOn.items.length,
    "work:reference":
      data.reference.contacts.length +
      data.reference.approvalChains.length +
      data.reference.sops.length +
      data.reference.meetingNotes.length,
    "life:tasks": data.life.tasks.length,
    "life:week": Object.keys(data.lifeWeekly.weeks).length,
    "life:rituals": data.habits.habits.length,
    "life:money":
      data.budget.config.bills.length +
      data.budget.config.debtPayments.length +
      data.budget.config.vaultTransfers.length +
      data.budget.config.spendingTargets.length,
    "life:quarter": quarter.goals.length + quarter.achievements.length + quarter.parkingLot.length,
    "life:lists": data.lists.grocery.items.length + data.lists.dump.items.length,
    "life:rhythm": rhythmItems,
    "life:glowUp":
      data.glowUp.dailyItems.length +
      data.glowUp.weeklyItems.length +
      data.glowUp.monthlyItems.length +
      data.glowUp.diyItems.length,
    "life:home": data.homeZones.zones.length,
    "life:books": (data.books.currentlyReading ? 1 : 0) + data.books.read.length,
    "life:bucketList": data.bucketList.items.length,
    "life:year": data.year.buckets.length + data.year.goals.length,
    "life:dec8": warRoomSnapshots,
    "life:verses": 0,
    "life:memos": Object.keys(data.memos.entries).length,
    "life:health": data.health.appointments.length + data.health.medications.length + data.health.notes.length,
    "life:wedding":
      data.wedding.checklist.length +
      data.wedding.vendors.length +
      data.wedding.guests.length +
      data.wedding.budget.length +
      data.wedding.timeline.length,
    "life:trips": data.trips.trips.length + data.trips.savedIdeas.length,
  };
}

function formatLastUsed(row: TabUsageRow): string {
  if (row.daysSinceUsed === null) return "Never opened";
  if (row.daysSinceUsed === 0) return "Opened today";
  if (row.daysSinceUsed === 1) return "Opened yesterday";
  return `Opened ${row.daysSinceUsed} days ago`;
}

export default function SystemCheckFlow({
  data,
  onChangeData,
  onClose,
}: {
  data: DashboardData;
  onChangeData: (updater: (d: DashboardData) => DashboardData) => void;
  onClose: () => void;
}) {
  const now = useState(() => new Date())[0];
  const itemCounts = useMemo(() => computeItemCounts(data, now), [data, now]);
  const report = useMemo(
    () => buildUsageReport(data.tabUsage, itemCounts, now),
    [data.tabUsage, itemCounts, now]
  );

  const [screen, setScreen] = useState(0);
  const [hiddenThisSession, setHiddenThisSession] = useState<string[]>([]);
  const [notUsing, setNotUsing] = useState("");
  const [annoying, setAnnoying] = useState("");
  const [finished, setFinished] = useState(false);

  const TOTAL_SCREENS = 3;

  function toggleHide(key: string) {
    const hidden = isTabHidden(data.tabUsage, key);
    onChangeData((d) => ({
      ...d,
      tabUsage: hidden ? unhideTab(d.tabUsage, key) : hideTab(d.tabUsage, key),
    }));
    setHiddenThisSession((keys) =>
      hidden ? keys.filter((k) => k !== key) : [...keys, key]
    );
  }

  function finish() {
    onChangeData((d) => ({
      ...d,
      systemCheck: addSystemCheckLog(d.systemCheck, notUsing.trim(), annoying.trim(), hiddenThisSession, now),
    }));
    setFinished(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-paper-muted">System Check</p>
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
              <Screen title="What's Getting Used">
                <p className="mb-3 text-[13px] text-paper-muted">
                  Least-used tabs first. Anything you don&apos;t need anymore can be hidden here -
                  it&apos;s never deleted, and you can bring it back any time from Settings.
                </p>
                <div className="flex flex-col gap-2">
                  {report.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-paper-ink">{row.label}</p>
                        <p className="text-[11.5px] text-paper-muted">
                          {formatLastUsed(row)} · {row.itemCount} item{row.itemCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleHide(row.key)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium ${
                          isTabHidden(data.tabUsage, row.key)
                            ? "border-life bg-life/10 text-life"
                            : "border-paper-border text-paper-muted"
                        }`}
                      >
                        {isTabHidden(data.tabUsage, row.key) ? "Hidden" : "Hide"}
                      </button>
                    </div>
                  ))}
                </div>
              </Screen>
            )}

            {screen === 1 && (
              <Screen title="What Am I Not Using?">
                <p className="mb-3 text-[13px] text-paper-muted">
                  Beyond what you just hid - anything else feel like dead weight?
                </p>
                <textarea
                  value={notUsing}
                  onChange={(e) => setNotUsing(e.target.value)}
                  rows={6}
                  placeholder="Write freely…"
                  className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 p-3 text-[14px] leading-relaxed text-paper-ink outline-none"
                />
              </Screen>
            )}

            {screen === 2 && (
              <Screen title="What's Annoying Me?">
                <p className="mb-3 text-[13px] text-paper-muted">
                  Friction, extra taps, anything that bugs you about the app itself.
                </p>
                <textarea
                  value={annoying}
                  onChange={(e) => setAnnoying(e.target.value)}
                  rows={6}
                  placeholder="Write freely…"
                  className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 p-3 text-[14px] leading-relaxed text-paper-ink outline-none"
                />
              </Screen>
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
                  className="flex-1 rounded-xl bg-life py-3 text-sm font-medium text-paper-surface"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="flex-1 rounded-xl bg-life py-3 text-sm font-medium text-paper-surface"
                >
                  Finish System Check
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl2 border border-life bg-paper-surface p-5 shadow-paper-lg">
              <p className="mb-1 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-life">
                System Check Complete
              </p>
              <p className="mb-4 text-center font-serif text-[1.1rem] text-paper-ink">
                {hiddenThisSession.length > 0
                  ? `${hiddenThisSession.length} tab${hiddenThisSession.length === 1 ? "" : "s"} hidden`
                  : "No tabs hidden this time"}
              </p>
              {notUsing && (
                <div className="mb-3 border-t border-paper-border pt-3">
                  <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-paper-muted">
                    Not Using
                  </p>
                  <p className="whitespace-pre-wrap text-[13.5px] text-paper-ink">{notUsing}</p>
                </div>
              )}
              {annoying && (
                <div className="mb-3 border-t border-paper-border pt-3">
                  <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-paper-muted">
                    Annoying
                  </p>
                  <p className="whitespace-pre-wrap text-[13.5px] text-paper-ink">{annoying}</p>
                </div>
              )}
              <p className="border-t border-paper-border pt-3 text-[12px] italic text-paper-muted">
                Logged - hand these answers to Claude Code any time as a fix list.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-life py-3 text-sm font-medium text-paper-surface"
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
