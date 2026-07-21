"use client";

import { useState } from "react";
import { LifeScoreData, LABEL_COLORS, labelForScore } from "@/lib/lifescore";
import { yearPixelsFor, PixelDay } from "@/lib/yearpixels";

const NO_DATA_COLOR = "#E8DFD0";

export default function YearPixelsView({ lifeScore }: { lifeScore: LifeScoreData }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const months = yearPixelsFor(lifeScore.history, year, now);
  const [hovered, setHovered] = useState<PixelDay | null>(null);

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <div>
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Year in Pixels</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Every day this year, colored by that day&apos;s Life Score.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl2 border border-paper-border bg-paper-surface px-3 py-2 shadow-paper">
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
          aria-label="Next year"
          disabled={year >= now.getFullYear()}
          className="px-2 text-paper-muted disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {(["Aligned", "Steady", "Drifting", "Off Track"] as const).map((label) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-paper-muted">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: LABEL_COLORS[label] }} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[10px] text-paper-muted">
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: NO_DATA_COLOR }} />
            No data
          </span>
        </div>
      </div>

      {hovered && (
        <div className="rounded-xl2 border border-paper-border bg-paper-surface2 px-3.5 py-2 text-[12px] text-paper-ink">
          <b>{hovered.date}</b>
          {hovered.score !== null ? ` — ${hovered.score} (${labelForScore(hovered.score)})` : " — no score recorded"}
        </div>
      )}

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="flex flex-col gap-[3px]">
          {months.map((month) => (
            <div key={month.month} className="flex items-center gap-2">
              <span className="w-7 shrink-0 text-[9.5px] uppercase tracking-wide text-paper-muted">
                {month.label}
              </span>
              <div className="flex gap-[2px]">
                {month.days.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onMouseEnter={() => setHovered(day)}
                    onFocus={() => setHovered(day)}
                    onClick={() => setHovered(day)}
                    aria-label={`${day.date}${day.score !== null ? `, score ${day.score}` : ""}`}
                    className="h-[9px] w-[9px] shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: day.isFuture
                        ? "transparent"
                        : day.score !== null
                          ? LABEL_COLORS[labelForScore(day.score)]
                          : NO_DATA_COLOR,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
