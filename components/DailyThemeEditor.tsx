"use client";

import { useState } from "react";
import {
  DAILY_THEME_DAY_KEYS,
  DailyTheme,
  DailyThemeData,
  DailyThemeDayKey,
} from "@/lib/dailytheme";

const DAY_LABELS: Record<DailyThemeDayKey, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

export default function DailyThemeEditor({
  data,
  initialDayKey,
  onChange,
  onClose,
}: {
  data: DailyThemeData;
  initialDayKey: DailyThemeDayKey;
  onChange: (updater: (d: DailyThemeData) => DailyThemeData) => void;
  onClose: () => void;
}) {
  const [dayKey, setDayKey] = useState<DailyThemeDayKey>(initialDayKey);
  const theme = data.themes[dayKey];

  function updateTheme(updater: (t: DailyTheme) => DailyTheme) {
    onChange((d) => ({ ...d, themes: { ...d.themes, [dayKey]: updater(d.themes[dayKey]) } }));
  }

  function addPrompt() {
    updateTheme((t) => ({ ...t, prompts: [...t.prompts, { id: crypto.randomUUID(), text: "" }] }));
  }

  function updatePromptText(promptId: string, text: string) {
    updateTheme((t) => ({
      ...t,
      prompts: t.prompts.map((p) => (p.id === promptId ? { ...p, text } : p)),
    }));
  }

  function removePrompt(promptId: string) {
    updateTheme((t) => ({ ...t, prompts: t.prompts.filter((p) => p.id !== promptId) }));
  }

  return (
    <div className="fixed inset-0 z-[110] flex flex-col justify-end bg-black/30 animate-fade-in" onClick={onClose}>
      <div
        className="scroll-quiet safe-bottom max-h-[88vh] overflow-y-auto rounded-t-xl3 bg-paper-surface p-5 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-serif text-[1.1rem] text-paper-ink">Edit Daily Theme</p>
          <button type="button" onClick={onClose} className="text-sm text-paper-muted">
            Done
          </button>
        </div>

        <div className="mb-4 flex gap-1.5 overflow-x-auto">
          {DAILY_THEME_DAY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setDayKey(key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                dayKey === key
                  ? "border-transparent bg-work text-white"
                  : "border-paper-border text-paper-muted"
              }`}
            >
              {DAY_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Theme name
            </p>
            <input
              value={theme.name}
              onChange={(e) => updateTheme((t) => ({ ...t, name: e.target.value }))}
              placeholder="e.g. Thoughtful Thursday"
              className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Color mood
            </p>
            <input
              value={theme.colorMood}
              onChange={(e) => updateTheme((t) => ({ ...t, colorMood: e.target.value }))}
              placeholder="e.g. Rose plum & warm gold"
              className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Intro line
            </p>
            <textarea
              value={theme.intro}
              onChange={(e) => updateTheme((t) => ({ ...t, intro: e.target.value }))}
              rows={2}
              placeholder="A short line that sets the mood"
              className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Photo search keyword
            </p>
            <input
              value={theme.imageQuery}
              onChange={(e) =>
                updateTheme((t) => ({
                  ...t,
                  imageQuery: e.target.value,
                  image: { ...t.image, url: "", thumbUrl: "" },
                }))
              }
              placeholder="e.g. calm morning tea"
              className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
            />
            <p className="mt-1 text-[11px] leading-snug text-paper-faint">
              Changing this clears the cached photo so the next open fetches a new one for this
              keyword - shuffle on the theme screen to try more without changing the keyword.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Prompts
              </p>
              <button type="button" onClick={addPrompt} className="text-[11px] font-medium text-work underline underline-offset-2">
                Add prompt
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {theme.prompts.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input
                    value={p.text}
                    onChange={(e) => updatePromptText(p.id, e.target.value)}
                    placeholder="A gentle prompt for this day"
                    className="w-full rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[13.5px] text-paper-ink outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removePrompt(p.id)}
                    aria-label="Remove prompt"
                    className="shrink-0 text-[13px] text-paper-faint"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {theme.prompts.length === 0 && (
                <p className="text-[12.5px] text-paper-faint">No prompts yet for {DAY_LABELS[dayKey]}.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
