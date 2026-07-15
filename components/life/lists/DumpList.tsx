"use client";

import { useState } from "react";
import { DumpData, DumpItem } from "@/lib/lists";

export default function DumpList({
  data,
  onChange,
  onSendToWork,
  onSendToLife,
}: {
  data: DumpData;
  onChange: (updater: (d: DumpData) => DumpData) => void;
  onSendToWork: (text: string) => void;
  onSendToLife: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [choosingId, setChoosingId] = useState<string | null>(null);

  function add() {
    if (!text.trim()) return;
    const item: DumpItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    onChange((d) => ({ ...d, items: [item, ...d.items] }));
    setText("");
  }

  function remove(id: string) {
    onChange((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  }

  function sendTo(item: DumpItem, target: "work" | "life") {
    if (target === "work") onSendToWork(item.text);
    else onSendToLife(item.text);
    remove(item.id);
    setChoosingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Dump
        </p>
        <div className="flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Type a thought and hit enter…"
            className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-3 text-[15px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={add}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-work text-2xl font-light text-paper-surface active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
          Nothing dumped yet. Get it out of your head.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3 shadow-paper"
            >
              <p className="mb-2 text-[14.5px] text-paper-ink">{item.text}</p>
              {choosingId === item.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-paper-muted">Add to:</span>
                  <button
                    type="button"
                    onClick={() => sendTo(item, "work")}
                    className="rounded-full bg-work px-3 py-1.5 text-xs font-medium text-paper-surface"
                  >
                    Work
                  </button>
                  <button
                    type="button"
                    onClick={() => sendTo(item, "life")}
                    className="rounded-full bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
                  >
                    Life
                  </button>
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
                    → Make it a task
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
