"use client";

import { useState } from "react";
import {
  BecomingData,
  BECOMING_ONBOARDING_PROMPT,
  addConversationMessage,
  addReflection,
  becomingActionPrompt,
  becomingCoachingPrompt,
  becomingReflectionPrompt,
  completeOnboarding,
  newBecomingMessage,
  setTodaysAction,
  todaysAction,
  toggleTodaysActionDone,
} from "@/lib/becoming";
import ChatThread from "../../ChatThread";
import CheckCircle from "../../CheckCircle";

async function callAssistant(system: string, messages: { role: "user" | "assistant"; content: string }[]) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Becoming couldn't respond just now.");
  return json.reply as string;
}

export default function BecomingSection({
  becoming,
  onChange,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
}) {
  if (!becoming.onboarded) {
    return <OnboardingFlow becoming={becoming} onChange={onChange} />;
  }
  return <CoachHome becoming={becoming} onChange={onChange} />;
}

function OnboardingFlow({
  becoming,
  onChange,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  async function handleSend(text: string) {
    const userMsg = newBecomingMessage("user", text);
    const history = [...becoming.conversation, userMsg];
    onChange((b) => addConversationMessage(b, userMsg));
    setError(null);
    setLoading(true);
    try {
      const reply = await callAssistant(
        BECOMING_ONBOARDING_PROMPT,
        history.map((m) => ({ role: m.role, content: m.content }))
      );
      onChange((b) => addConversationMessage(b, newBecomingMessage("assistant", reply || "…")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    setFinishing(true);
    setError(null);
    try {
      const history = becoming.conversation.map((m) => ({ role: m.role, content: m.content }));
      const summary = await callAssistant(BECOMING_ONBOARDING_PROMPT, [
        ...history,
        { role: "user", content: "Please summarize my growth goals in 2-3 sentences, for your own future reference as my coach. Reply with only the summary." },
      ]);
      onChange((b) => completeOnboarding(b, summary || "Growth goals not yet clearly captured."));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't finish onboarding just now.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-serif text-[1.05rem] text-paper-ink">Becoming</h3>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          A few questions to get started - what do you want to grow into?
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">
          {error}
        </div>
      )}

      <ChatThread
        messages={becoming.conversation}
        onSend={handleSend}
        loading={loading}
        accentClass="bg-glow"
        emptyState="Say hello to start - what's on your mind about growth right now?"
      />

      {becoming.conversation.length >= 2 && (
        <button
          type="button"
          onClick={finishOnboarding}
          disabled={finishing}
          className="shrink-0 rounded-xl2 bg-glow py-3 text-[14px] font-medium text-paper-surface active:scale-[0.98] disabled:opacity-50"
        >
          {finishing ? "Finishing…" : "Finish Onboarding"}
        </button>
      )}
    </div>
  );
}

function CoachHome({
  becoming,
  onChange,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
}) {
  const now = new Date();
  const action = todaysAction(becoming, now);
  const [loadingAction, setLoadingAction] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getTodaysSuggestion() {
    setLoadingAction(true);
    setError(null);
    try {
      const reply = await callAssistant(becomingActionPrompt(becoming.profileSummary, becoming.reflections), [
        { role: "user", content: "What should I focus on today?" },
      ]);
      onChange((b) => setTodaysAction(b, reply.trim() || "Take one small step toward your goal.", now));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get a suggestion just now.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function shareReflection() {
    if (!reflectionText.trim()) return;
    setLoadingReflection(true);
    setError(null);
    try {
      const text = reflectionText.trim();
      const reply = await callAssistant(becomingReflectionPrompt(becoming.profileSummary), [
        { role: "user", content: text },
      ]);
      onChange((b) =>
        addReflection(b, {
          id: crypto.randomUUID(),
          date: now.toISOString().slice(0, 10),
          text,
          aiResponse: reply || "",
        })
      );
      setReflectionText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that reflection just now.");
    } finally {
      setLoadingReflection(false);
    }
  }

  async function handleChatSend(text: string) {
    const userMsg = newBecomingMessage("user", text);
    const history = [...becoming.conversation, userMsg];
    onChange((b) => addConversationMessage(b, userMsg));
    setError(null);
    setChatLoading(true);
    try {
      const reply = await callAssistant(
        becomingCoachingPrompt(becoming.profileSummary),
        history.map((m) => ({ role: m.role, content: m.content }))
      );
      onChange((b) => addConversationMessage(b, newBecomingMessage("assistant", reply || "…")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div>
        <h3 className="font-serif text-[1.05rem] text-paper-ink">Becoming</h3>
        <p className="mt-0.5 text-[0.8rem] italic text-paper-muted">{becoming.profileSummary}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">
          {error}
        </div>
      )}

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Today&apos;s Action
        </p>
        {action ? (
          <div className="flex items-center gap-2.5">
            <CheckCircle
              done={action.done}
              onToggle={() => onChange((b) => toggleTodaysActionDone(b, now))}
              accentClass="bg-glow"
              size="sm"
              ariaLabel={action.done ? "Mark not done" : "Mark done"}
            />
            <span className={`text-[14px] ${action.done ? "text-paper-faint line-through" : "text-paper-ink"}`}>
              {action.action}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={getTodaysSuggestion}
            disabled={loadingAction}
            className="rounded-xl bg-glow px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95 disabled:opacity-50"
          >
            {loadingAction ? "Thinking…" : "Get Today's Suggestion"}
          </button>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Reflect</p>
        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="How did today go, in relation to what you're working on?"
          rows={3}
          className="mb-2 w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-glow"
        />
        <button
          type="button"
          onClick={shareReflection}
          disabled={loadingReflection || !reflectionText.trim()}
          className="rounded-xl bg-glow px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95 disabled:opacity-40"
        >
          {loadingReflection ? "Thinking…" : "Share Reflection"}
        </button>

        {becoming.reflections.length > 0 && (
          <div className="mt-3 flex flex-col gap-2.5 border-t border-paper-border pt-3">
            {becoming.reflections.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg bg-paper-surface2 p-2.5">
                <p className="text-[10px] text-paper-faint">{r.date}</p>
                <p className="mt-0.5 text-[12.5px] text-paper-ink">{r.text}</p>
                {r.aiResponse && (
                  <p className="mt-1.5 border-t border-paper-border pt-1.5 text-[12px] italic text-paper-muted">
                    {r.aiResponse}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-[300px] flex-col rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Coaching Chat
        </p>
        <ChatThread
          messages={becoming.conversation}
          onSend={handleChatSend}
          loading={chatLoading}
          accentClass="bg-glow"
          emptyState="Check in anytime - weekly, or whenever something's on your mind."
        />
      </div>
    </div>
  );
}
