"use client";

import { useState } from "react";
import {
  VisionData,
  addVisionImage,
  deleteVisionImage,
  toggleVisionCover,
  updateVisionImage,
} from "@/lib/vision";

export default function VisionView({
  data,
  onChange,
}: {
  data: VisionData;
  onChange: (updater: (v: VisionData) => VisionData) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  function addImage() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    onChange((v) => addVisionImage(v, trimmedUrl, caption.trim()));
    setUrl("");
    setCaption("");
    setAdding(false);
  }

  const coverCount = data.images.filter((i) => i.isCover).length;

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <div>
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">Vision</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">
          Pictures of the life you&apos;re building toward.
        </p>
      </div>

      {adding ? (
        <div className="flex flex-col gap-2 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an image link…"
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13.5px] text-paper-ink outline-none focus:border-life"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13.5px] text-paper-ink outline-none focus:border-life"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setUrl("");
                setCaption("");
              }}
              className="text-[12px] text-paper-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addImage}
              disabled={!url.trim()}
              className="rounded-full bg-life px-4 py-1.5 text-[12.5px] font-medium text-paper-surface disabled:opacity-40"
            >
              Add to Vision
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-life bg-paper-surface px-3.5 py-1.5 text-[12.5px] font-medium text-life"
        >
          + Add Image
        </button>
      )}

      {data.images.length > 0 && (
        <p className="text-[11.5px] text-paper-muted">
          {coverCount === 0
            ? "Tap the star on any image to include it in the Front Page cover rotation."
            : `${coverCount} image${coverCount === 1 ? "" : "s"} rotating as your Front Page cover.`}
        </p>
      )}

      {data.images.length === 0 ? (
        <p className="mt-4 text-center text-[13px] italic text-paper-muted">
          Nothing here yet - add a picture of a place, a feeling, a future you&apos;re working toward.
        </p>
      ) : (
        <div className="columns-2 gap-3">
          {data.images.map((image) => (
            <VisionCard
              key={image.id}
              image={image}
              onToggleCover={() => onChange((v) => toggleVisionCover(v, image.id))}
              onDelete={() => onChange((v) => deleteVisionImage(v, image.id))}
              onCaptionChange={(caption) =>
                onChange((v) => updateVisionImage(v, image.id, (i) => ({ ...i, caption })))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VisionCard({
  image,
  onToggleCover,
  onDelete,
  onCaptionChange,
}: {
  image: { id: string; url: string; caption: string; isCover: boolean };
  onToggleCover: () => void;
  onDelete: () => void;
  onCaptionChange: (caption: string) => void;
}) {
  const [broken, setBroken] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [draft, setDraft] = useState(image.caption);

  return (
    <div className="hover-lift relative mb-3 break-inside-avoid overflow-hidden rounded-xl2 border border-paper-border bg-paper-surface shadow-paper">
      {broken || !image.url ? (
        <div className="flex h-40 items-center justify-center bg-paper-surface2 text-paper-faint">
          <span className="text-[11px]">Image unavailable</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.caption || "Vision board image"}
          onError={() => setBroken(true)}
          className="w-full object-cover"
        />
      )}

      <div className="absolute right-1.5 top-1.5 flex gap-1">
        <button
          type="button"
          onClick={onToggleCover}
          aria-label={image.isCover ? "Remove from cover rotation" : "Add to cover rotation"}
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] shadow-sm transition ${
            image.isCover ? "bg-gold text-paper-surface" : "bg-paper-surface/80 text-paper-muted"
          }`}
        >
          {image.isCover ? "★" : "☆"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete image"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-surface/80 text-[12px] text-paper-muted shadow-sm"
        >
          ✕
        </button>
      </div>

      <div className="p-2">
        {editingCaption ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onCaptionChange(draft.trim());
              setEditingCaption(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onCaptionChange(draft.trim());
                setEditingCaption(false);
              }
            }}
            className="w-full rounded border border-paper-border bg-paper-surface2 px-1.5 py-1 text-[11.5px] text-paper-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(image.caption);
              setEditingCaption(true);
            }}
            className="w-full truncate text-left text-[11.5px] italic text-paper-muted"
          >
            {image.caption || "Add a caption…"}
          </button>
        )}
      </div>
    </div>
  );
}
