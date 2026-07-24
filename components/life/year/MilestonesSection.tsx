"use client";

import { useState } from "react";
import { CelebrationTier } from "@/lib/celebration";
import {
  MilestoneData,
  MilestoneTracker,
  addTracker,
  updateTracker,
  deleteTracker,
  setEntryValue,
  entriesFor,
  MILESTONE_ICON_OPTIONS,
  MILESTONE_COLOR_OPTIONS,
} from "@/lib/milestones";
import MilestoneTrackerCard from "./MilestoneTrackerCard";

export default function MilestonesSection({
  milestones,
  onChange,
  onCelebrate,
}: {
  milestones: MilestoneData;
  onChange: (updater: (m: MilestoneData) => MilestoneData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const now = new Date();

  function logDay(trackerId: string, dateKey: string, value: number) {
    onChange((m) => {
      const tracker = m.trackers.find((t) => t.id === trackerId);
      const { data, newlyEarnedThresholds } = setEntryValue(m, trackerId, dateKey, value, now);
      if (tracker && newlyEarnedThresholds.length > 0) {
        const best = Math.max(...newlyEarnedThresholds);
        onCelebrate("big", `${tracker.icon} ${best}-day streak on ${tracker.name}!`);
      }
      return data;
    });
  }

  function createTracker(name: string, icon: string, color: string, type: MilestoneTracker["type"]) {
    onChange((m) => addTracker(m, name, icon, color, type));
    setAdding(false);
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="mb-1 flex w-full items-center justify-between"
      >
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Milestones
        </span>
        <span className={`text-paper-muted transition-transform ${collapsed ? "" : "rotate-90"}`}>›</span>
      </button>

      {!collapsed && (
        <div className="animate-fade-in">
          <p className="mb-3 text-[12px] text-paper-muted">
            Habits tracked over months and years - a broken streak just means a new one starts today.
          </p>

          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="rounded-full bg-life px-3 py-1 text-xs font-medium text-paper-surface"
            >
              {adding ? "Cancel" : "+ Add Tracker"}
            </button>
          </div>

          {adding && <AddTrackerForm onCreate={createTracker} />}

          {milestones.trackers.length === 0 ? (
            <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
              No trackers yet - add one to start building a record.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {milestones.trackers.map((tracker) => (
                <MilestoneTrackerCard
                  key={tracker.id}
                  tracker={tracker}
                  entries={entriesFor(milestones, tracker.id)}
                  now={now}
                  onLogDay={(dateKey, value) => logDay(tracker.id, dateKey, value)}
                  onUpdateTracker={(updater) => onChange((m) => updateTracker(m, tracker.id, updater))}
                  onDeleteTracker={() => onChange((m) => deleteTracker(m, tracker.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddTrackerForm({
  onCreate,
}: {
  onCreate: (name: string, icon: string, color: string, type: MilestoneTracker["type"]) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(MILESTONE_ICON_OPTIONS[0]);
  const [color, setColor] = useState(MILESTONE_COLOR_OPTIONS[0]);
  const [type, setType] = useState<MilestoneTracker["type"]>("daily");

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-paper-border bg-paper-surface2 p-3 animate-fade-in">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tracker name (e.g. Meditation minutes)"
        className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[14px] text-paper-ink outline-none placeholder:text-paper-faint"
      />

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {MILESTONE_ICON_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setIcon(opt)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{
                backgroundColor: icon === opt ? "#EEE0E3" : "transparent",
                border: `1px solid ${icon === opt ? "#5B2333" : "#E8DFD0"}`,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {MILESTONE_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              aria-label={`Choose color ${opt}`}
              onClick={() => setColor(opt)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: opt, outline: color === opt ? "2px solid #2B2620" : "none", outlineOffset: 2 }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Type</p>
        <div className="flex gap-1.5">
          {(["daily", "count"] as MilestoneTracker["type"][]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setType(opt)}
              className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium transition ${
                type === opt ? "bg-life text-paper-surface" : "border border-paper-border text-paper-muted"
              }`}
            >
              {opt === "daily" ? "Yes / No" : "A Count"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => onCreate(name.trim(), icon, color, type)}
        className="rounded-full bg-life px-3 py-1.5 text-xs font-medium text-paper-surface disabled:opacity-40"
      >
        Create Tracker
      </button>
    </div>
  );
}
