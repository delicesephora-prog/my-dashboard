"use client";

import { useState } from "react";

type World = "work" | "life";

export default function QuickAdd({
  world,
  onAdd,
}: {
  world: World;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const accent = world === "work" ? "focus:border-work" : "focus:border-life";
  const button = world === "work" ? "bg-work" : "bg-life";

  function submit() {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  }

  return (
    <div className="mb-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={world === "work" ? "Add a work task…" : "Add a life task…"}
        className={`flex-1 rounded-xl2 border border-paper-border bg-paper-surface2 px-4 py-3 text-[15px] text-paper-ink outline-none transition-colors ${accent}`}
      />
      <button
        onClick={submit}
        aria-label="Add task"
        className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl2 text-xl font-light text-paper-surface transition active:scale-90 ${button}`}
      >
        +
      </button>
    </div>
  );
}
