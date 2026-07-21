"use client";

import { useState } from "react";
import { DashboardData } from "@/lib/types";
import {
  AssistantData,
  ASSISTANT_SYSTEM_PROMPT,
  addMessage,
  buildContextSnapshot,
  clearMessages,
  newMessage,
} from "@/lib/assistant";
import ChatThread from "./ChatThread";

export default function AssistantView({
  data,
  assistant,
  onChange,
}: {
  data: DashboardData;
  assistant: AssistantData;
  onChange: (updater: (a: AssistantData) => AssistantData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(text: string) {
    const now = new Date();
    const userMsg = newMessage("user", text, now);
    const history = [...assistant.messages, userMsg];
    onChange((a) => addMessage(a, userMsg));
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `${ASSISTANT_SYSTEM_PROMPT}\n\nToday's context:\n${buildContextSnapshot(data, now)}`,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "The Assistant couldn't respond just now.");
        return;
      }
      onChange((a) => addMessage(a, newMessage("assistant", json.reply || "…", new Date())));
    } catch {
      setError("Couldn't reach the Assistant - check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-[1.15rem] text-paper-ink">Assistant</h2>
          <p className="mt-0.5 text-[0.8rem] text-paper-muted">
            Talk through your day, work, or anything else on your mind.
          </p>
        </div>
        {assistant.messages.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(clearMessages)}
            className="shrink-0 text-[11px] text-paper-faint"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">
          {error}
        </div>
      )}

      <ChatThread
        messages={assistant.messages}
        onSend={handleSend}
        loading={loading}
        placeholder="Ask me anything…"
        emptyState="Nothing here yet. Ask about your day, a task, or just think out loud."
      />
    </div>
  );
}
