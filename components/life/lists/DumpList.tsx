"use client";

import { useState } from "react";
import { DumpData, DumpItem } from "@/lib/lists";
import {
  TRIAGE_DESTINATIONS,
  TRIAGE_DESTINATION_LABELS,
  TriageDestination,
  TriagedItem,
  triageBrainDump,
} from "@/lib/dump-triage";

export default function DumpList({
  data,
  onChange,
  onSendToWork,
  onSendToLife,
  onSendToGrocery,
  onSendToParkingLot,
}: {
  data: DumpData;
  onChange: (updater: (d: DumpData) => DumpData) => void;
  onSendToWork: (text: string) => void;
  onSendToLife: (text: string) => void;
  onSendToGrocery: (text: string) => void;
  onSendToParkingLot: (text: string) => void;
}) {
  const [rawText, setRawText] = useState("");
  const [triaging, setTriaging] = useState(false);
  const [reviewItems, setReviewItems] = useState<TriagedItem[]>([]);
  const [choosingId, setChoosingId] = useState<string | null>(null);

  const mode: "compose" | "review" = reviewItems.length > 0 ? "review" : "compose";

  async function sortItOut() {
    const text = rawText.trim();
    if (!text) return;
    setTriaging(true);
    const items = await triageBrainDump(text);
    setTriaging(false);
    setReviewItems(items);
  }

  function setItemDestination(id: string, destination: TriageDestination) {
    setReviewItems((items) => items.map((i) => (i.id === id ? { ...i, destination } : i)));
  }

  function removeReviewItem(id: string) {
    setReviewItems((items) => items.filter((i) => i.id !== id));
  }

  function discardReview() {
    setReviewItems([]);
    setRawText("");
  }

  function fileTo(text: string, destination: TriageDestination) {
    if (destination === "work") onSendToWork(text);
    else if (destination === "life") onSendToLife(text);
    else if (destination === "grocery") onSendToGrocery(text);
    else if (destination === "parkingLot") onSendToParkingLot(text);
    else {
      onChange((d) => ({
        ...d,
        items: [{ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }, ...d.items],
      }));
    }
  }

  function fileAll() {
    for (const item of reviewItems) fileTo(item.text, item.destination);
    setReviewItems([]);
    setRawText("");
  }

  function remove(id: string) {
    onChange((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  }

  function sendExistingTo(item: DumpItem, destination: Exclude<TriageDestination, "dump">) {
    fileTo(item.text, destination);
    remove(item.id);
    setChoosingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {mode === "compose" ? (
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Dump
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Pour it all out — thoughts, tasks, groceries, ideas. Type or dictate. Messy is fine, don't stop to organize."
            rows={8}
            className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-3 text-[15px] leading-relaxed text-paper-ink outline-none"
          />
          <button
            type="button"
            disabled={!rawText.trim() || triaging}
            onClick={sortItOut}
            className="mt-3 w-full rounded-xl bg-work py-3 text-sm font-medium text-paper-surface transition disabled:opacity-40"
          >
            {triaging ? "Sorting it out…" : "Sort it out"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              {reviewItems.length} thing{reviewItems.length === 1 ? "" : "s"} to file
            </p>
            <button
              type="button"
              onClick={discardReview}
              className="text-xs text-paper-faint underline underline-offset-2"
            >
              Start over
            </button>
          </div>

          {reviewItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3 shadow-paper"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-[14px] leading-snug text-paper-ink">{item.text}</p>
                <button
                  type="button"
                  aria-label="Drop this item"
                  onClick={() => removeReviewItem(item.id)}
                  className="shrink-0 px-0.5 text-lg leading-none text-paper-faint"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRIAGE_DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setItemDestination(item.id, dest)}
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition ${
                      item.destination === dest
                        ? "border-work bg-work text-paper-surface"
                        : "border-paper-border text-paper-muted"
                    }`}
                  >
                    {TRIAGE_DESTINATION_LABELS[dest]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={fileAll}
            disabled={reviewItems.length === 0}
            className="rounded-xl bg-life py-3 text-sm font-medium text-paper-surface disabled:opacity-40"
          >
            File All
          </button>
        </div>
      )}

      {data.items.length === 0 ? (
        mode === "compose" && (
          <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
            Nothing kept in the Dump. Get it out of your head above.
          </p>
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3 shadow-paper"
            >
              <p className="mb-2 text-[14.5px] text-paper-ink">{item.text}</p>
              {choosingId === item.id ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-paper-muted">Send to:</span>
                  {(["work", "life", "grocery", "parkingLot"] as const).map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => sendExistingTo(item, dest)}
                      className="rounded-full bg-work px-3 py-1.5 text-xs font-medium text-paper-surface"
                    >
                      {TRIAGE_DESTINATION_LABELS[dest]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setChoosingId(null)}
                    className="text-xs text-paper-faint underline underline-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChoosingId(item.id)}
                    className="text-xs font-medium text-work underline underline-offset-2"
                  >
                    → File it
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="text-xs text-paper-faint underline underline-offset-2"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
