"use client";

import { AnchorState, RhythmData, todayRhythm, toggleAnchorDone } from "@/lib/rhythm";

export default function RhythmStrip({
  rhythmData,
  paydayAnchorDate,
  now,
  onChange,
}: {
  rhythmData: RhythmData;
  paydayAnchorDate: string;
  now: Date;
  onChange: (updater: (r: RhythmData) => RhythmData) => void;
}) {
  const { anchors, done, total } = todayRhythm(rhythmData, paydayAnchorDate, now);

  if (total === 0) return null;

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Today&apos;s Rhythm
        </p>
        <span className="text-[11px] text-paper-muted">
          {done}/{total}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {anchors.map(({ anchor, state }) => (
          <li key={anchor.id}>
            <button
              type="button"
              onClick={() => onChange((r) => toggleAnchorDone(r, anchor.id, now))}
              className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left active:bg-paper-surface2"
            >
              <Dot state={state} />
              <span
                className={`min-w-0 flex-1 truncate text-[14px] ${
                  state === "done"
                    ? "text-paper-faint line-through"
                    : state === "current"
                      ? "font-medium text-paper-ink"
                      : "text-paper-muted"
                }`}
              >
                {anchor.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dot({ state }: { state: AnchorState }) {
  if (state === "done") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-life">
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-paper-surface" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === "current") {
    return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-life" />;
  }
  return <span className="h-4 w-4 shrink-0 rounded-full border border-paper-faint" />;
}
