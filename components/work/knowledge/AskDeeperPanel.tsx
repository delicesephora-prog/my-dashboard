"use client";

import { useEffect, useRef, useState } from "react";
import {
  KnowledgeData,
  Subject,
  AskDeeperMessage,
  AskDeeperCitation,
  newAskDeeperMessage,
  addAskDeeperMessage,
  saveAskDeeperAnswerToSubject,
  buildGoDeeperPrompt,
} from "@/lib/knowledge";
import ChatThread from "../../ChatThread";

type GoDeeperKind = "simpler" | "deeper" | "commercial" | "meeting" | "quiz";

async function callAsk(
  subject: Subject,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<{ text: string; citations: AskDeeperCitation[] }> {
  const res = await fetch("/api/knowledge/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: { name: subject.name, pitch: subject.pitch, blocks: subject.blocks },
      messages,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Ask Deeper couldn't respond just now (${res.status}).`);
  return { text: json.text as string, citations: (json.citations ?? []) as AskDeeperCitation[] };
}

const GO_DEEPER_OPTIONS: { key: GoDeeperKind; label: string }[] = [
  { key: "simpler", label: "Explain simpler" },
  { key: "deeper", label: "Explain deeper" },
  { key: "commercial", label: "Why does this matter commercially?" },
  { key: "meeting", label: "How would I say this in a meeting?" },
  { key: "quiz", label: "Quiz me on this" },
];

export default function AskDeeperPanel({
  subject,
  knowledge,
  onChange,
  onSaved,
  seedText,
  onSeedConsumed,
}: {
  subject: Subject;
  knowledge: KnowledgeData;
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  onSaved: () => void;
  seedText?: string | null;
  onSeedConsumed?: () => void;
}) {
  const messages = knowledge.askDeeperChats[subject.id] ?? [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const seedConsumedRef = useRef(false);

  async function send(text: string, history: AskDeeperMessage[]) {
    const userMsg = newAskDeeperMessage("user", text);
    onChange((k) => addAskDeeperMessage(k, subject.id, userMsg));
    setError(null);
    setLoading(true);
    try {
      const apiHistory = [...history, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const { text: reply, citations } = await callAsk(subject, apiHistory);
      onChange((k) => addAskDeeperMessage(k, subject.id, newAskDeeperMessage("assistant", reply, citations)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (seedText && !seedConsumedRef.current) {
      seedConsumedRef.current = true;
      send(seedText, messages);
      onSeedConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedText]);

  function saveToSubject(message: AskDeeperMessage) {
    onChange((k) => saveAskDeeperAnswerToSubject(k, subject.id, "From Ask Deeper", message.content));
    setSavedIds((s) => new Set(s).add(message.id));
    onSaved();
  }

  const last = messages[messages.length - 1];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] leading-relaxed text-paper-muted">
        Ask anything about {subject.name} - grounded in what&apos;s already stored, with live web search for anything
        public and current.
      </p>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">{error}</div>
      )}

      <div className="flex min-h-[280px] flex-col rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <ChatThread
          messages={messages}
          onSend={(text) => send(text, messages)}
          loading={loading}
          accentClass="bg-work"
          emptyState="Ask a follow-up - 'what's preload vs afterload?', 'why does this beat the alternative?'"
        />
      </div>

      {last && last.role === "assistant" && !loading && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {GO_DEEPER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => send(buildGoDeeperPrompt(opt.key), messages)}
                className="rounded-full border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[11.5px] text-paper-ink active:scale-95"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => saveToSubject(last)}
            disabled={savedIds.has(last.id)}
            className="self-start rounded-full border border-work px-3 py-1.5 text-[11.5px] font-medium text-work active:scale-95 disabled:opacity-50"
          >
            {savedIds.has(last.id) ? "Saved to subject ✓" : "💾 Save to Subject"}
          </button>
          {last.citations.length > 0 && (
            <div className="rounded-lg bg-paper-surface2 p-2.5">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-wide text-paper-muted">Sources</p>
              <div className="flex flex-col gap-1">
                {last.citations.map((c, i) => (
                  <a
                    key={i}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[11px] text-work underline"
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
