"use client";

import { useEffect, useRef, useState } from "react";

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatThread({
  messages,
  onSend,
  loading,
  placeholder,
  emptyState,
  accentClass = "bg-work",
}: {
  messages: ChatMsg[];
  onSend: (text: string) => void;
  loading: boolean;
  placeholder?: string;
  emptyState?: string;
  accentClass?: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, loading]);

  function send() {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="scroll-quiet flex max-h-[48vh] flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-6 text-center font-serif text-[0.95rem] italic text-paper-muted">
            {emptyState ?? "Say something to start."}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] whitespace-pre-wrap rounded-xl2 px-3.5 py-2.5 text-[13.5px] leading-snug shadow-paper ${
              m.role === "user"
                ? `self-end ${accentClass} text-paper-surface`
                : "self-start border border-paper-border bg-paper-surface text-paper-ink"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-xl2 border border-paper-border bg-paper-surface px-3.5 py-2.5 text-[13px] italic text-paper-muted">
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex shrink-0 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={placeholder ?? "Type a message…"}
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none focus:border-work disabled:opacity-60"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !text.trim()}
          className="shrink-0 rounded-xl bg-work px-4 py-2.5 text-[13px] font-medium text-paper-surface active:scale-95 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
