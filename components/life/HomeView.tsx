"use client";

import { useState } from "react";
import {
  Assignee,
  HomeZonesData,
  completedDailyResetIds,
  completedTaskIds,
  daysSinceLastDone,
  homeDayKeyForDate,
  isMonthlyOverdue,
  markMonthlyDone,
  toggleDailyResetItem,
  toggleZoneTask,
} from "@/lib/home";
import { dateKey } from "@/lib/date";
import CheckCircle from "../CheckCircle";

const DAY_LABELS: Record<string, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const ASSIGNEE_CYCLE: (Assignee | undefined)[] = [undefined, "me", "O", "both"];

function AssigneeChip({
  value,
  onChange,
}: {
  value: Assignee | undefined;
  onChange: (next: Assignee | undefined) => void;
}) {
  function cycle() {
    const idx = ASSIGNEE_CYCLE.indexOf(value);
    onChange(ASSIGNEE_CYCLE[(idx + 1) % ASSIGNEE_CYCLE.length]);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Who's on it"
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        value ? "bg-life-soft text-life-dark" : "border border-dashed border-paper-border text-paper-faint"
      }`}
    >
      {value ?? "who?"}
    </button>
  );
}

function formatLastDone(dateStr: string, daysSince: number | null): string {
  if (!dateStr || daysSince === null) return "Never logged";
  if (daysSince === 0) return "Done today";
  if (daysSince === 1) return "Done yesterday";
  return `Done ${daysSince} days ago`;
}

export default function HomeView({
  data,
  onChange,
}: {
  data: HomeZonesData;
  onChange: (updater: (h: HomeZonesData) => HomeZonesData) => void;
}) {
  const [text, setText] = useState("");
  const now = new Date();
  const today = dateKey(now);
  const todayDayKey = homeDayKeyForDate(now);

  const dailyDoneIds = new Set(completedDailyResetIds(data, today));

  function setTaskAssignee(zoneId: string, taskId: string, assignee: Assignee | undefined) {
    onChange((h) => ({
      ...h,
      zones: h.zones.map((z) =>
        z.id !== zoneId
          ? z
          : { ...z, tasks: z.tasks.map((t) => (t.id === taskId ? { ...t, assignee } : t)) }
      ),
    }));
  }

  function setDailyAssignee(itemId: string, assignee: Assignee | undefined) {
    onChange((h) => ({
      ...h,
      dailyReset: {
        ...h.dailyReset,
        items: h.dailyReset.items.map((i) => (i.id === itemId ? { ...i, assignee } : i)),
      },
    }));
  }

  function setMonthlyAssignee(itemId: string, assignee: Assignee | undefined) {
    onChange((h) => ({
      ...h,
      monthly: h.monthly.map((m) => (m.id === itemId ? { ...m, assignee } : m)),
    }));
  }

  function addMonthlyItem() {
    if (!text.trim()) return;
    onChange((h) => ({
      ...h,
      monthly: [
        ...h.monthly,
        { id: crypto.randomUUID(), text: text.trim(), lastDoneDate: "", expectedIntervalDays: 30 },
      ],
    }));
    setText("");
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-backdrop-muted">
          Home
        </p>
        <p className="font-serif text-[1.05rem] text-backdrop-ink">Daily Reset, Zones &amp; Monthly</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Daily Reset */}
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Daily Reset
          </p>
          <div className="flex flex-col gap-2.5">
            {data.dailyReset.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <CheckCircle
                  done={dailyDoneIds.has(item.id)}
                  onToggle={() => onChange((h) => toggleDailyResetItem(h, item.id, now))}
                  accentClass="bg-life"
                  size="sm"
                  ariaLabel={dailyDoneIds.has(item.id) ? "Mark not done" : "Mark done"}
                />
                <span
                  className={`min-w-0 flex-1 text-[14px] ${
                    dailyDoneIds.has(item.id) ? "text-paper-faint line-through" : "text-paper-ink"
                  }`}
                >
                  {item.text}
                </span>
                <AssigneeChip
                  value={item.assignee}
                  onChange={(a) => setDailyAssignee(item.id, a)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* This Week's Zones */}
        <div>
          <p className="mb-1.5 mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            This Week&apos;s Zones
          </p>
          <div className="flex flex-col gap-3">
            {data.zones.map((zone) => {
              const isToday = zone.day === todayDayKey;
              const doneIds = new Set(completedTaskIds(data, today, zone.id));
              return (
                <div
                  key={zone.id}
                  className={`rounded-xl2 border bg-paper-surface p-4 shadow-paper ${
                    isToday ? "border-gold" : "border-paper-border"
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-serif text-[1rem] text-paper-ink">{zone.label}</p>
                      <p className="text-[11px] text-paper-muted">{DAY_LABELS[zone.day]}</p>
                    </div>
                    {isToday && (
                      <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-paper-ink">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {zone.tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2.5">
                        <CheckCircle
                          done={doneIds.has(t.id)}
                          onToggle={() => onChange((h) => toggleZoneTask(h, zone.id, t.id, now))}
                          accentClass="bg-life"
                          size="sm"
                          ariaLabel={doneIds.has(t.id) ? "Mark not done" : "Mark done"}
                        />
                        <span
                          className={`min-w-0 flex-1 text-[13.5px] ${
                            doneIds.has(t.id) ? "text-paper-faint line-through" : "text-paper-ink"
                          }`}
                        >
                          {t.text}
                        </span>
                        <AssigneeChip
                          value={t.assignee}
                          onChange={(a) => setTaskAssignee(zone.id, t.id, a)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly */}
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Monthly
          </p>
          <div className="flex flex-col gap-3">
            {data.monthly.map((item) => {
              const daysSince = daysSinceLastDone(item, now);
              const overdue = isMonthlyOverdue(item, now);
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  {overdue && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: "#C99A4B" }}
                      aria-label="Overdue"
                      title="Overdue"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onChange((h) => markMonthlyDone(h, item.id, now))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-[14px] text-paper-ink">{item.text}</span>
                    <span className="mt-0.5 block text-[11.5px] text-paper-muted">
                      {formatLastDone(item.lastDoneDate, daysSince)}
                    </span>
                  </button>
                  <AssigneeChip
                    value={item.assignee}
                    onChange={(a) => setMonthlyAssignee(item.id, a)}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 border-t border-paper-border pt-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addMonthlyItem();
              }}
              placeholder="Add a monthly task…"
              className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
            />
            <button
              type="button"
              onClick={addMonthlyItem}
              className="rounded-xl bg-life px-4 text-sm font-medium text-paper-surface"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
