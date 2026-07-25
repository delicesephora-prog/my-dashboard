"use client";

import { useEffect, useRef, useState } from "react";
import localFont from "next/font/local";
import { DailyTheme, DailyThemeImage } from "@/lib/dailytheme";
import CheckCircle from "./CheckCircle";

// Same self-hosted pair the Welcome screen uses - the italic serif reads as
// the "script" line, the display serif as the big magazine wordmark, so the
// two together give the script-over-serif masthead treatment without
// depending on a webfont this sandbox can't fetch.
const displaySerif = localFont({ src: "../app/fonts/Italiana-Regular.ttf", display: "swap" });
const italicSerif = localFont({ src: "../app/fonts/Lora-Italic.ttf", display: "swap" });

const MAX_UPLOAD_DIM = 900;

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_UPLOAD_DIM / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Couldn't process that image"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function DailyThemeScreen({
  theme,
  completedPromptIds,
  onTogglePrompt,
  onDismiss,
  onEdit,
  onChangeImage,
}: {
  theme: DailyTheme;
  completedPromptIds: string[];
  onTogglePrompt: (promptId: string, text: string) => void;
  onDismiss: () => void;
  onEdit: () => void;
  onChangeImage: (updater: (img: DailyThemeImage) => DailyThemeImage) => void;
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
    setTimeout(onDismiss, 450);
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
      <div className="relative h-[42vh] min-h-[260px] w-full shrink-0 overflow-hidden">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: "linear-gradient(160deg, #5B2333 0%, #7A3B4D 55%, #B08B4F 135%)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(43,27,34,0.18) 0%, rgba(43,27,34,0.04) 42%, var(--paper-bg) 97%)",
          }}
        />

        <div className="safe-top absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full bg-black/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            Edit
          </button>
        </div>

        <div className="absolute bottom-3 left-4 flex flex-wrap gap-2 pr-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-black/25 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm"
          >
            Add my photo
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={() => fetchImage(theme.imageQuery)}
              disabled={imageState === "loading"}
              className="rounded-full bg-black/25 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm disabled:opacity-50"
            >
              {imageState === "loading" ? "Finding..." : "Shuffle photo"}
            </button>
          )}
          {theme.image.customUrl && (
            <button
              type="button"
              onClick={handleRemoveCustom}
              className="rounded-full bg-black/25 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm"
            >
              Use suggested photo
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      <div className="flex flex-1 flex-col items-center px-7 pb-10 pt-1 text-center">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold">{theme.colorMood}</p>
        <p className={`${italicSerif.className} text-[18px] italic text-backdrop-muted`}>Today&rsquo;s theme</p>
        <h1 className={`${displaySerif.className} -mt-1 text-[42px] leading-[1.05] text-backdrop-ink`}>
          {theme.name}
        </h1>
        <div className="my-4 h-px w-10 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <p className={`${italicSerif.className} max-w-xs text-[15px] italic leading-[1.6] text-backdrop-muted`}>
          {theme.intro}
        </p>

        {theme.prompts.length > 0 && (
          <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5 text-left">
            {theme.prompts.map((p) => {
              const done = completedPromptIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl2 border px-3.5 py-3 transition ${
                    done ? "border-gold-soft bg-paper-surface" : "border-paper-border/60 bg-paper-surface/60"
                  }`}
                >
                  <CheckCircle
                    done={done}
                    onToggle={() => onTogglePrompt(p.id, p.text)}
                    accentClass="bg-gold"
                    size="sm"
                    ariaLabel={done ? "Mark not done" : "Mark done"}
                  />
                  <span className={`text-[13.5px] leading-snug ${done ? "text-paper-muted line-through" : "text-paper-ink"}`}>
                    {p.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showCredit && (
          <p className="mt-6 text-[10px] text-paper-faint">
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

        <button
          type="button"
          onClick={handleSkip}
          className="safe-bottom mt-10 text-[11px] uppercase tracking-[0.2em] text-paper-faint underline underline-offset-4"
        >
          Continue to Front Page
        </button>
      </div>
    </div>
  );
}
