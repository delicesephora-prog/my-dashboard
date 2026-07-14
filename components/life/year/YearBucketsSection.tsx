"use client";

import { useState } from "react";
import { YearBucket } from "@/lib/types";

export default function YearBucketsSection({
  buckets,
  onChange,
}: {
  buckets: YearBucket[];
  onChange: (updater: (b: YearBucket[]) => YearBucket[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  function addBucket() {
    const bucket: YearBucket = { id: crypto.randomUUID(), theme: "New Theme", description: "" };
    onChange((b) => [...b, bucket]);
  }

  function updateBucket(id: string, updater: (b: YearBucket) => YearBucket) {
    onChange((bs) => bs.map((b) => (b.id === id ? updater(b) : b)));
  }

  function deleteBucket(id: string) {
    onChange((bs) => bs.filter((b) => b.id !== id));
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="mb-1 flex w-full items-center justify-between"
      >
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Themes for the Year
        </span>
        <span className={`text-paper-muted transition-transform ${collapsed ? "" : "rotate-90"}`}>
          ›
        </span>
      </button>

      {!collapsed && (
        <div className="animate-fade-in">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={addBucket}
              className="rounded-full bg-life px-3 py-1 text-xs font-medium text-paper-surface"
            >
              + Add Theme
            </button>
          </div>

          {buckets.length === 0 ? (
            <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">
              No themes set yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {buckets.map((bucket) => (
                <div key={bucket.id} className="rounded-xl border-l-4 border-life bg-paper-surface2 p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <input
                      value={bucket.theme}
                      onChange={(e) =>
                        updateBucket(bucket.id, (b) => ({ ...b, theme: e.target.value }))
                      }
                      className="min-w-0 flex-1 bg-transparent font-serif text-[1rem] text-paper-ink outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Delete theme"
                      onClick={() => deleteBucket(bucket.id)}
                      className="shrink-0 text-paper-faint"
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    value={bucket.description}
                    onChange={(e) =>
                      updateBucket(bucket.id, (b) => ({ ...b, description: e.target.value }))
                    }
                    placeholder="What this theme means…"
                    rows={2}
                    className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-paper-muted outline-none placeholder:text-paper-faint"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
