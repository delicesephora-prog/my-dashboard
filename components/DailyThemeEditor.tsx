"use client";

import { useRef, useState } from "react";
import {
  DAILY_THEME_DAY_KEYS,
  DailyTheme,
  DailyThemeData,
  DailyThemeDayKey,
} from "@/lib/dailytheme";
import { resizeImageToDataUrl } from "@/lib/imageUpload";

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
  const promptFileInputRef = useRef<HTMLInputElement>(null);
  const accentFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetPromptId, setUploadTargetPromptId] = useState<string | null>(null);

  function updateTheme(updater: (t: DailyTheme) => DailyTheme) {
    onChange((d) => ({ ...d, themes: { ...d.themes, [dayKey]: updater(d.themes[dayKey]) } }));
  }

  function addPrompt() {
    updateTheme((t) => ({
      ...t,
      prompts: [...t.prompts, { id: crypto.randomUUID(), title: "", description: "", imageUrl: "" }],
    }));
  }

  function updatePrompt(promptId: string, patch: Partial<{ title: string; description: string }>) {
    updateTheme((t) => ({
      ...t,
      prompts: t.prompts.map((p) => (p.id === promptId ? { ...p, ...patch } : p)),
    }));
  }

  function removePrompt(promptId: string) {
    updateTheme((t) => ({ ...t, prompts: t.prompts.filter((p) => p.id !== promptId) }));
  }

  function removePromptImage(promptId: string) {
    updateTheme((t) => ({
      ...t,
      prompts: t.prompts.map((p) => (p.id === promptId ? { ...p, imageUrl: "" } : p)),
    }));
  }

  function openPromptImagePicker(promptId: string) {
    setUploadTargetPromptId(promptId);
    promptFileInputRef.current?.click();
  }

  async function handlePromptImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const promptId = uploadTargetPromptId;
    setUploadTargetPromptId(null);
    if (!file || !promptId) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      updateTheme((t) => ({
        ...t,
        prompts: t.prompts.map((p) => (p.id === promptId ? { ...p, imageUrl: dataUrl } : p)),
      }));
    } catch {
      // Leave the prompt's image as it was.
    }
  }

  async function handleAccentImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 500, 0.7);
      updateTheme((t) => ({
        ...t,
        accentImages: [...t.accentImages, { id: crypto.randomUUID(), url: dataUrl }],
      }));
    } catch {
      // Leave the mood board as it was.
    }
  }

  function removeAccentImage(id: string) {
    updateTheme((t) => ({ ...t, accentImages: t.accentImages.filter((a) => a.id !== id) }));
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
              Intro paragraph
            </p>
            <textarea
              value={theme.intro}
              onChange={(e) => updateTheme((t) => ({ ...t, intro: e.target.value }))}
              rows={4}
              placeholder="A few sentences that set the mood for the day"
              className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] leading-relaxed text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Hero photo search keyword
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
              Used when you don&rsquo;t upload your own hero photo. Changing it clears the cached
              photo so the next open fetches a fresh one - shuffle on the theme screen to try more
              without changing the keyword.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Mood board
              </p>
              <button
                type="button"
                onClick={() => accentFileInputRef.current?.click()}
                className="text-[11px] font-medium text-work underline underline-offset-2"
              >
                Add image
              </button>
            </div>
            {theme.accentImages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {theme.accentImages.map((a) => (
                  <div key={a.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAccentImage(a.id)}
                      aria-label="Remove mood board image"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-paper-ink text-[10px] text-paper-surface"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-paper-faint">
                A few scattered photos for a mood-board feel between sections - optional.
              </p>
            )}
            <input
              ref={accentFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAccentImageSelected}
              className="hidden"
            />
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
            <div className="flex flex-col gap-3">
              {theme.prompts.map((p) => (
                <div key={p.id} className="rounded-xl border border-paper-border bg-paper-surface2 p-3">
                  <div className="mb-2 flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => (p.imageUrl ? removePromptImage(p.id) : openPromptImagePicker(p.id))}
                      className="shrink-0 overflow-hidden rounded-lg"
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-14 w-14 object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-paper-border text-[9px] text-paper-faint">
                          Add photo
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <input
                        value={p.title}
                        onChange={(e) => updatePrompt(p.id, { title: e.target.value })}
                        placeholder="Prompt title"
                        className="mb-1.5 w-full rounded-lg border border-paper-border bg-paper-surface px-2.5 py-2 text-[13.5px] font-medium text-paper-ink outline-none"
                      />
                      <textarea
                        value={p.description}
                        onChange={(e) => updatePrompt(p.id, { description: e.target.value })}
                        rows={2}
                        placeholder="A sentence or two describing this prompt"
                        className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface px-2.5 py-2 text-[12.5px] leading-relaxed text-paper-ink outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrompt(p.id)}
                      aria-label="Remove prompt"
                      className="shrink-0 text-[13px] text-paper-faint"
                    >
                      ✕
                    </button>
                  </div>
                  {p.imageUrl && (
                    <button
                      type="button"
                      onClick={() => openPromptImagePicker(p.id)}
                      className="text-[11px] font-medium text-work underline underline-offset-2"
                    >
                      Replace photo
                    </button>
                  )}
                </div>
              ))}
              {theme.prompts.length === 0 && (
                <p className="text-[12.5px] text-paper-faint">No prompts yet for {DAY_LABELS[dayKey]}.</p>
              )}
            </div>
            <input
              ref={promptFileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePromptImageSelected}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
