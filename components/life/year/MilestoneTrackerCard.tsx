"use client";

import { useState } from "react";
import {
  MilestoneTracker,
  MilestoneTrackerType,
  MilestoneMonth,
  computeStreaks,
  milestoneYearGrid,
  monthlyTotalsForYear,
  totalForMonth,
  totalForYear,
  yearsWithData,
  earnedBadgesFor,
  MILESTONE_BADGE_THRESHOLDS,
  MILESTONE_ICON_OPTIONS,
  MILESTONE_COLOR_OPTIONS,
} from "@/lib/milestones";

export default function MilestoneTrackerCard({
  tracker,
  entries,
  now,
  onLogDay,
  onUpdateTracker,
  onDeleteTracker,
}: {
  tracker: MilestoneTracker;
  entries: Record<string, number>;
  now: Date;
  onLogDay: (dateKey: string, newValue: number) => void;
  onUpdateTracker: (updater: (t: MilestoneTracker) => MilestoneTracker) => void;
  onDeleteTracker: () => void;
}) {
  const [year, setYear] = useState(now.getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const { current, longest } = computeStreaks(entries, now);
  const months = milestoneYearGrid(entries, year, now);
  const monthlyTotals = monthlyTotalsForYear(entries, year);
  const maxMonthly = Math.max(1, ...monthlyTotals);
  const thisMonthTotal = totalForMonth(entries, now.getFullYear(), now.getMonth() + 1);
  const thisYearTotal = totalForYear(entries, now.getFullYear());
  const priorYearTotal = totalForYear(entries, year - 1);
  const years = yearsWithData(entries, now.getFullYear());
  const earned = earnedBadgesFor(longest);

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: tracker.color }}
        >
          {tracker.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-paper-ink">{tracker.name}</p>
          <p className="text-[11px] text-paper-muted">{tracker.type === "daily" ? "Daily yes / no" : "Daily count"}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-label="Edit tracker"
          className="shrink-0 rounded-full border border-paper-border px-2.5 py-1 text-[11px] text-paper-muted"
        >
          Edit
        </button>
      </div>

      {editing && (
        <TrackerEditor
          tracker={tracker}
          onUpdate={onUpdateTracker}
          onDelete={onDeleteTracker}
          onClose={() => setEditing(false)}
        />
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-paper-surface2 p-3 text-center">
          <p className="font-serif text-[1.8rem] leading-none" style={{ color: tracker.color }}>
            {current}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-paper-muted">
            {current === 0 ? "New streak starts today" : "Day Streak"}
          </p>
        </div>
        <div className="rounded-xl bg-paper-surface2 p-3 text-center">
          <p className="font-serif text-[1.8rem] leading-none text-gold">{longest}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-paper-muted">Longest Ever</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-around rounded-xl border border-paper-border py-2 text-center text-[12px] text-paper-muted">
        <span>
          <b className="text-paper-ink">{thisMonthTotal}</b> this month
        </span>
        <span>
          <b className="text-paper-ink">{thisYearTotal}</b> this year
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between gap-1">
        {MILESTONE_BADGE_THRESHOLDS.map((t) => {
          const isEarned = earned.includes(t);
          return (
            <div key={t} className="flex flex-1 flex-col items-center gap-1">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition"
                style={{
                  backgroundColor: isEarned ? tracker.color : "#E8DFD0",
                  color: isEarned ? "#FFF8F0" : "#B5AE9E",
                }}
                title={`${t}-day milestone${isEarned ? " - earned" : ""}`}
              >
                {isEarned ? "✓" : ""}
              </span>
              <span className="text-[9px] text-paper-faint">{t}d</span>
            </div>
          );
        })}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
          className="px-2 text-paper-muted"
        >
          ‹
        </button>
        <span className="text-[13px] font-medium text-paper-ink">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= now.getFullYear()}
          aria-label="Next year"
          className="px-2 text-paper-muted disabled:opacity-30"
        >
          ›
        </button>
      </div>
      {years.length > 1 && (
        <p className="mb-2 text-center text-[11px] text-paper-muted">
          {year}: <b className="text-paper-ink">{totalForYear(entries, year)}</b>
          {" · "}
          {year - 1}: <b className="text-paper-ink">{priorYearTotal}</b>
        </p>
      )}

      <div className="flex flex-col gap-[3px]">
        {months.map((month) => (
          <div key={month.month}>
            <button
              type="button"
              onClick={() => setExpandedMonth((m) => (m === month.month ? null : month.month))}
              className="flex w-full items-center gap-2 py-[1px]"
            >
              <span className="w-7 shrink-0 text-left text-[9.5px] uppercase tracking-wide text-paper-muted">
                {month.label}
              </span>
              <div className="flex gap-[2px]">
                {month.days.map((day) => (
                  <span
                    key={day.date}
                    className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: day.isFuture ? "transparent" : day.value > 0 ? tracker.color : "#E8DFD0",
                    }}
                  />
                ))}
              </div>
            </button>
            {expandedMonth === month.month && (
              <ExpandedMonth
                tracker={tracker}
                month={month}
                onLogDay={onLogDay}
                onClose={() => setExpandedMonth(null)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
          Month by Month
        </p>
        <div className="flex items-end justify-between gap-1">
          {months.map((month, i) => (
            <div key={month.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  role="img"
                  aria-label={`${month.label}: ${monthlyTotals[i]}`}
                  title={`${month.label}: ${monthlyTotals[i]}`}
                  className="w-2.5 rounded-t-sm"
                  style={{
                    height: `${Math.max((monthlyTotals[i] / maxMonthly) * 100, monthlyTotals[i] > 0 ? 4 : 0)}%`,
                    backgroundColor: tracker.color,
                  }}
                />
              </div>
              <span className="text-[8px] uppercase text-paper-faint">{month.label[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpandedMonth({
  tracker,
  month,
  onLogDay,
  onClose,
}: {
  tracker: MilestoneTracker;
  month: MilestoneMonth;
  onLogDay: (dateKey: string, newValue: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="mb-1.5 mt-2 rounded-xl border border-paper-border bg-paper-surface2 p-3 animate-fade-in">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-medium text-paper-ink">{month.label}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-paper-muted">
          ×
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {month.days.map((day) => (
          <DayCell key={day.date} tracker={tracker} day={day} onLogDay={onLogDay} />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  tracker,
  day,
  onLogDay,
}: {
  tracker: MilestoneTracker;
  day: { date: string; day: number; value: number; isFuture: boolean };
  onLogDay: (dateKey: string, newValue: number) => void;
}) {
  if (day.isFuture) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-paper-border text-[10px] text-paper-faint">
        {day.day}
      </div>
    );
  }

  if (tracker.type === "daily") {
    const hit = day.value > 0;
    return (
      <button
        type="button"
        onClick={() => onLogDay(day.date, hit ? 0 : 1)}
        aria-label={`${day.date}${hit ? ", logged" : ", not logged"}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-medium transition"
        style={{
          backgroundColor: hit ? tracker.color : "transparent",
          color: hit ? "#FFF8F0" : "#5A5347",
          border: `1px solid ${hit ? tracker.color : "#E8DFD0"}`,
        }}
      >
        {day.day}
      </button>
    );
  }

  return (
    <div
      className="flex h-12 w-9 flex-col items-center justify-between rounded-lg border border-paper-border py-1"
      style={{ backgroundColor: day.value > 0 ? `${tracker.color}22` : "transparent" }}
    >
      <span className="text-[9px] text-paper-faint">{day.day}</span>
      <span className="text-[12px] font-medium text-paper-ink">{day.value}</span>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => onLogDay(day.date, Math.max(0, day.value - 1))}
          className="flex h-3.5 w-3.5 items-center justify-center text-[10px] leading-none text-paper-muted"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => onLogDay(day.date, day.value + 1)}
          className="flex h-3.5 w-3.5 items-center justify-center text-[10px] leading-none text-paper-muted"
        >
          +
        </button>
      </div>
    </div>
  );
}

function TrackerEditor({
  tracker,
  onUpdate,
  onDelete,
  onClose,
}: {
  tracker: MilestoneTracker;
  onUpdate: (updater: (t: MilestoneTracker) => MilestoneTracker) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-paper-border bg-paper-surface2 p-3 animate-fade-in">
      <input
        value={tracker.name}
        onChange={(e) => onUpdate((t) => ({ ...t, name: e.target.value }))}
        className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[14px] text-paper-ink outline-none"
      />

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {MILESTONE_ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => onUpdate((t) => ({ ...t, icon }))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{
                backgroundColor: tracker.icon === icon ? "#EEE0E3" : "transparent",
                border: `1px solid ${tracker.icon === icon ? "#5B2333" : "#E8DFD0"}`,
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {MILESTONE_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Choose color ${color}`}
              onClick={() => onUpdate((t) => ({ ...t, color }))}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: color,
                outline: tracker.color === color ? "2px solid #2B2620" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Type</p>
        <div className="flex gap-1.5">
          {(["daily", "count"] as MilestoneTrackerType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onUpdate((t) => ({ ...t, type }))}
              className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium transition ${
                tracker.type === type ? "bg-life text-paper-surface" : "border border-paper-border text-paper-muted"
              }`}
            >
              {type === "daily" ? "Yes / No" : "A Count"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-paper-muted">Delete for good?</span>
            <button type="button" onClick={onDelete} className="text-xs font-medium text-paper-ink underline underline-offset-2">
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-paper-faint">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete tracker
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded-full bg-life px-3 py-1 text-xs font-medium text-paper-surface">
          Done
        </button>
      </div>
    </div>
  );
}
