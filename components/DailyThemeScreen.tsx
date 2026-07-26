"use client";

import { useEffect, useRef, useState } from "react";
import localFont from "next/font/local";
import { DailyTheme, DailyThemeImage } from "@/lib/dailytheme";
import { resizeImageToDataUrl } from "@/lib/imageUpload";
import { ChecklistFocusItem, TodayFocusItem } from "@/lib/frontpage";
import { ChecklistPrepTask, MealDay, MealRecipe } from "@/lib/mealcalendar";
import { Habit } from "@/lib/types";
import CheckCircle from "./CheckCircle";

// Same self-hosted pair the Welcome screen uses - the italic serif reads as
// the "script" line, the display serif as the big magazine wordmark, so the
// two together give the script-over-serif masthead treatment without
// depending on a webfont this sandbox can't fetch.
const displaySerif = localFont({ src: "../app/fonts/Italiana-Regular.ttf", display: "swap" });
const italicSerif = localFont({ src: "../app/fonts/Lora-Italic.ttf", display: "swap" });

const ACCENT_ROTATIONS = ["-4deg", "3deg", "-2deg", "5deg", "-3deg", "2deg"];

export default function DailyThemeScreen({
  theme,
  completedPromptIds,
  onTogglePrompt,
  onSkip,
  onEdit,
  onChangeImage,
  cherGreeting,
  dashStreak,
  doneCount,
  totalCount,
  focusTasks,
  onToggleFocusTask,
  habits,
  habitDoneToday,
  onToggleHabit,
  prepTasks,
  onTogglePrepTask,
  dinner,
}: {
  theme: DailyTheme;
  completedPromptIds: string[];
  onTogglePrompt: (promptId: string, promptTitle: string) => void;
  onSkip: () => void;
  onEdit: () => void;
  onChangeImage: (updater: (img: DailyThemeImage) => DailyThemeImage) => void;
  cherGreeting: string;
  dashStreak: number;
  doneCount: number;
  totalCount: number;
  focusTasks: ChecklistFocusItem[];
  onToggleFocusTask: (item: TodayFocusItem) => void;
  habits: Habit[];
  habitDoneToday: (habitId: string) => boolean;
  onToggleHabit: (habitId: string) => void;
  prepTasks: ChecklistPrepTask[];
  onTogglePrepTask: (weekendId: string, taskId: string) => void;
  dinner: { day: MealDay; recipe: MealRecipe } | null;
}) {
  const [leaving, setLeaving] = useState(false);
  const [imageState, setImageState] = useState<"idle" | "loading" | "unavailable">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guards against re-fetching every render - only fetch once per query,
  // and only when neither a cached API image nor a custom upload exists.
  const fetchedForQuery = useRef<string>("");

  const hasImage = Boolean(theme.image.customUrl || theme.image.url);

  useEffect(() => {
    if (theme.image.customUrl || theme.image.url) return;
    if (fetchedForQuery.current === theme.imageQuery) return;
    fetchedForQuery.current = theme.imageQuery;
    fetchImage(theme.imageQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.imageQuery, theme.image.customUrl, theme.image.url]);

  async function fetchImage(query: string) {
    setImageState("loading");
    try {
      const res = await fetch(`/api/images/daily-theme?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!json.ok) {
        setImageState("unavailable");
        return;
      }
      onChangeImage((img) => ({
        ...img,
        url: json.url,
        thumbUrl: json.thumbUrl,
        photographer: json.photographer,
        photographerUrl: json.photographerUrl,
        sourceUrl: json.sourceUrl,
        fetchedAt: new Date().toISOString(),
      }));
      setImageState("idle");
    } catch {
      setImageState("unavailable");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      onChangeImage((img) => ({ ...img, customUrl: dataUrl }));
    } catch {
      // A failed upload just leaves the photo as it was - nothing else
      // about the screen depends on it.
    }
  }

  function handleRemoveCustom() {
    onChangeImage((img) => ({ ...img, customUrl: "" }));
  }

  function handleSkip() {
    setLeaving(true);
    setTimeout(onSkip, 450);
  }

  const displayImage = theme.image.customUrl || theme.image.url;
  const showCredit = displayImage && !theme.image.customUrl && theme.image.photographer;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto scroll-quiet transition-all duration-500 ease-out ${
        leaving ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ background: "var(--paper-bg)" }}
    >
      {/* Hero: full magazine-cover treatment - image fills the top of the
          page, masthead sits directly on top of it with a scrim for
          legibility, exactly like a cover title over a photo. */}
      <div className="relative min-h-[64vh] w-full shrink-0 overflow-hidden">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #5B2333 0%, #7A3B4D 55%, #B08B4F 135%)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,10,14,0.35) 0%, rgba(20,10,14,0.08) 30%, rgba(20,10,14,0.55) 78%, rgba(20,10,14,0.82) 100%)",
          }}
        />

        <div className="safe-top absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            Edit
          </button>
        </div>
        <div className="safe-top absolute left-4 top-4 flex flex-wrap gap-2 pr-16">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm"
          >
            Add my photo
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={() => fetchImage(theme.imageQuery)}
              disabled={imageState === "loading"}
              className="rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm disabled:opacity-50"
            >
              {imageState === "loading" ? "Finding..." : "Shuffle photo"}
            </button>
          )}
          {theme.image.customUrl && (
            <button
              type="button"
              onClick={handleRemoveCustom}
              className="rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm"
            >
              Use suggested
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {/* Masthead, overlaid on the photo like a cover title. */}
        <div className="absolute inset-x-0 bottom-0 px-7 pb-8 pt-16 text-center">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold">{theme.colorMood}</p>
          <p className={`${italicSerif.className} text-[17px] italic text-white/85`} style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
            Today&rsquo;s theme
          </p>
          <h1
            className={`${displaySerif.className} -mt-1 text-[44px] leading-[1.04] text-white`}
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}
          >
            {theme.name}
          </h1>
        </div>
      </div>

      {/* Cher's greeting + the unified progress indicator spanning both
          today's theme prompts and the checklist below. */}
      <div className="mx-5 -mt-6 flex items-center justify-between gap-3 rounded-xl2 border border-gold-soft bg-paper-surface px-4 py-3 shadow-paper">
        <div className="min-w-0">
          {cherGreeting ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Cher</p>
              <p className={`${italicSerif.className} mt-0.5 truncate text-[15px] italic text-paper-ink`}>
                {cherGreeting}
              </p>
            </>
          ) : (
            <p className="text-[13px] font-medium text-paper-ink">Today&rsquo;s dash</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold text-paper-ink">
            {doneCount} of {totalCount} done
          </p>
          {dashStreak > 0 && <p className="text-[10px] text-paper-muted">🔥 {dashStreak}-day streak</p>}
        </div>
      </div>

      {showCredit && (
        <p className="px-7 pt-2 text-[10px] text-paper-faint">
          Photo by{" "}
          <a href={theme.image.photographerUrl} target="_blank" rel="noreferrer" className="underline">
            {theme.image.photographer}
          </a>{" "}
          on{" "}
          <a href={theme.image.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            Unsplash
          </a>
        </p>
      )}

      {/* Intro - a real paragraph, not a one-liner. */}
      <div className="px-7 pb-2 pt-7">
        <div className="mx-auto mb-4 h-px w-10 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <p className={`${italicSerif.className} mx-auto max-w-[320px] text-center text-[16px] italic leading-[1.75] text-backdrop-ink`}>
          {theme.intro}
        </p>
      </div>

      {theme.accentImages.length > 0 && (
        <div className="scroll-quiet flex gap-3 overflow-x-auto px-7 py-7">
          {theme.accentImages.map((a, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={a.url}
              alt=""
              className="h-24 w-20 shrink-0 rounded-lg object-cover shadow-paper"
              style={{ transform: `rotate(${ACCENT_ROTATIONS[i % ACCENT_ROTATIONS.length]})` }}
            />
          ))}
        </div>
      )}

      {/* Today's checklist - focus tasks, habits, prep due today, and a
          read-only dinner line, folded into the same dash as the theme
          prompts above so there's one screen and one progress count. */}
      <div className="px-5 pb-2 pt-1">
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-paper-faint">
          Today&rsquo;s checklist
        </p>
        <div className="flex flex-col gap-2">
          {dinner && (
            <div className="flex items-center gap-2.5 rounded-xl border border-paper-border/60 bg-paper-surface/85 px-3.5 py-3">
              <span className="text-base">🍽️</span>
              <p className="min-w-0 flex-1 truncate text-[13px] text-paper-ink">
                Tonight: {dinner.recipe.name}
                {dinner.day.isLeftover ? " (leftovers)" : ""}
              </p>
            </div>
          )}
          {focusTasks.map((item) => (
            <div
              key={`focus-${item.id}`}
              className="flex items-center gap-2.5 rounded-xl border border-paper-border/60 bg-paper-surface/85 px-3.5 py-3"
            >
              <CheckCircle
                done={item.done}
                onToggle={() => onToggleFocusTask(item)}
                accentClass="bg-gold"
                size="sm"
                ariaLabel={item.done ? "Mark not done" : "Mark done"}
              />
              <p className={`min-w-0 flex-1 truncate text-[13px] ${item.done ? "text-paper-muted line-through" : "text-paper-ink"}`}>
                {item.title}
              </p>
              <span className="shrink-0 text-[9px] uppercase tracking-wide text-paper-faint">{item.side}</span>
            </div>
          ))}
          {habits.map((h) => {
            const done = habitDoneToday(h.id);
            return (
              <div
                key={`habit-${h.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-paper-border/60 bg-paper-surface/85 px-3.5 py-3"
              >
                <CheckCircle
                  done={done}
                  onToggle={() => onToggleHabit(h.id)}
                  accentClass="bg-gold"
                  size="sm"
                  ariaLabel={done ? "Mark not done" : "Mark done"}
                />
                <span className="shrink-0 text-base">{h.icon}</span>
                <p className={`min-w-0 flex-1 truncate text-[13px] ${done ? "text-paper-muted line-through" : "text-paper-ink"}`}>
                  {h.label}
                </p>
              </div>
            );
          })}
          {prepTasks.map(({ weekendId, weekendTitle, task }) => (
            <div
              key={`prep-${task.id}`}
              className="flex items-center gap-2.5 rounded-xl border border-paper-border/60 bg-paper-surface/85 px-3.5 py-3"
            >
              <CheckCircle
                done={task.done}
                onToggle={() => onTogglePrepTask(weekendId, task.id)}
                accentClass="bg-gold"
                size="sm"
                ariaLabel={task.done ? "Mark not done" : "Mark done"}
              />
              <p className={`min-w-0 flex-1 truncate text-[13px] ${task.done ? "text-paper-muted line-through" : "text-paper-ink"}`}>
                {task.text}
              </p>
              <span className="shrink-0 max-w-[35%] truncate text-[9px] uppercase tracking-wide text-paper-faint">
                {weekendTitle}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Prompts, as full editorial blocks - alternating image side. */}
      <div className="flex flex-col gap-4 px-5 pb-8 pt-3">
        {theme.prompts.map((p, i) => {
          const done = completedPromptIds.includes(p.id);
          const imageOnRight = i % 2 === 1;
          return (
            <div
              key={p.id}
              className={`flex items-stretch gap-3.5 rounded-xl2 border p-3.5 transition ${
                done ? "border-gold-soft bg-paper-surface" : "border-paper-border/60 bg-paper-surface/85"
              } ${imageOnRight ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-paper-surface2 sm:h-32 sm:w-32">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        i % 2 === 0
                          ? "linear-gradient(150deg, #EEE0E3 0%, #E4D3B4 100%)"
                          : "linear-gradient(150deg, #E4D3B4 0%, #EEE0E3 100%)",
                    }}
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <div className="flex items-start gap-2.5">
                  <CheckCircle
                    done={done}
                    onToggle={() => onTogglePrompt(p.id, p.title)}
                    accentClass="bg-gold"
                    size="sm"
                    ariaLabel={done ? "Mark not done" : "Mark done"}
                  />
                  <p
                    className={`${displaySerif.className} text-[19px] leading-[1.15] ${
                      done ? "text-paper-muted line-through" : "text-paper-ink"
                    }`}
                  >
                    {p.title}
                  </p>
                </div>
                {p.description && (
                  <p className="pl-[30px] text-[12.5px] leading-relaxed text-paper-muted">{p.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pb-10">
        <button
          type="button"
          onClick={handleSkip}
          className="safe-bottom text-[11px] uppercase tracking-[0.2em] text-paper-faint underline underline-offset-4"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
