"use client";

import { useState } from "react";
import { ParkingLotItem } from "@/lib/types";

export default function ParkingLotSection({
  items,
  onChange,
}: {
  items: ParkingLotItem[];
  onChange: (updater: (items: ParkingLotItem[]) => ParkingLotItem[]) => void;
}) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    onChange((items) => [{ id: crypto.randomUUID(), text: text.trim() }, ...items]);
    setText("");
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Parking Lot
      </p>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="An idea for later…"
          className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none focus:border-life"
        />
        <button
          onClick={submit}
          aria-label="Add idea"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-life text-xl font-light text-paper-surface transition active:scale-90"
        >
          +
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">
          Nothing parked yet.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 rounded-lg bg-paper-surface2 px-3 py-2">
              <span className="min-w-0 flex-1 text-[13.5px] text-paper-ink">{item.text}</span>
              <button
                type="button"
                aria-label="Delete idea"
                onClick={() => onChange((arr) => arr.filter((x) => x.id !== item.id))}
                className="shrink-0 text-paper-faint"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
