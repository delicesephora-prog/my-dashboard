"use client";

import { useEffect, useRef, useState } from "react";
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
  resetBecomingInterview,
  setTodaysAction,
  todaysAction,
  toggleTodaysActionDone,
} from "@/lib/becoming";
import ChatThread from "../../ChatThread";
import CheckCircle from "../../CheckCircle";

type AnthropicBlock = { type: string; [key: string]: unknown };

// The /api/assistant route replies with Anthropic content blocks (it was
// rewritten for the main Assistant's tool-use loop), not a plain
// `{ reply: string }` shape. Becoming doesn't need any dashboard-editing
// tools, so it asks for useTools:false and pulls the text blocks back out
// itself - and throws a real, visible error instead of silently falling
// back to a placeholder when something doesn't come back as expected.
async function callAssistant(system: string, messages: { role: "user" | "assistant"; content: string }[]) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, useTools: false }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `Becoming couldn't respond just now (${res.status}).`);
  }
  const blocks: AnthropicBlock[] = Array.isArray(json.content) ? json.content : [];
  const text = blocks
    .filter((b) => b.type === "text")
    .map((b) => String(b.text ?? ""))
    .join("\n\n")
    .trim();
  if (!text) {
    throw new Error("Becoming responded without any text - that's a bug, not a network hiccup. Try again?");
  }
  return text;
}

export default function BecomingSection({
  becoming,
  onChange,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      {!becoming.onboarded ? (
        <OnboardingFlow becoming={becoming} onChange={onChange} onOpenReset={() => setResetOpen(true)} />
      ) : (
        <CoachHome becoming={becoming} onChange={onChange} onOpenReset={() => setResetOpen(true)} />
      )}
      {resetOpen && (
        <ResetBecomingSheet becoming={becoming} onChange={onChange} onClose={() => setResetOpen(false)} />
      )}
    </>
  );
}

// Wipes only the interview state (profile summary + conversation) -
// today's action and past reflections aren't part of "the interview" and
// are left alone. Shows exactly what's stored first, so nothing gets
// wiped as a surprise, and requires a second tap to confirm.
function ResetBecomingSheet({
  becoming,
  onChange,
  onClose,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  function doReset() {
    onChange((b) => resetBecomingInterview(b));
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="font-serif text-[1.1rem] text-paper-ink">Reset Becoming</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper-surface2 px-3.5 py-1.5 text-sm font-medium text-paper-muted"
        >
          Done
        </button>
      </div>

      <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-4">
        {done ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="font-serif text-[1.05rem] text-paper-ink">Reset complete.</p>
            <p className="max-w-xs text-[13px] text-paper-muted">
              Her profile and conversation are cleared - the Dream Self interview starts fresh from question
              one next time she opens Becoming.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] leading-relaxed text-paper-muted">
              This wipes only Becoming&apos;s memory: her stored growth-focus summary and the full onboarding /
              coaching conversation below. Today&apos;s action and past reflections aren&apos;t touched, and
              nothing else in the app is affected.
            </p>

            <div className="rounded-xl2 border border-paper-border bg-paper-surface2 p-3">
              <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
                Currently stored - profile summary
              </p>
              <p className="text-[12.5px] leading-relaxed text-paper-ink">
                {becoming.profileSummary.trim() || "(empty)"}
              </p>
            </div>

            <div className="rounded-xl2 border border-paper-border bg-paper-surface2 p-3">
              <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
                Currently stored - conversation
              </p>
              {becoming.conversation.length === 0 ? (
                <p className="text-[12.5px] text-paper-muted">(empty)</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {becoming.conversation.map((m) => (
                    <p key={m.id} className="text-[12px] leading-snug text-paper-ink">
                      <span className="font-medium text-paper-muted">{m.role === "user" ? "You: " : "Becoming: "}</span>
                      {m.content}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-1 rounded-xl2 border border-[#B5574A] py-3 text-[14px] font-medium text-[#B5574A] active:scale-[0.98]"
              >
                Reset Becoming
              </button>
            ) : (
              <div className="mt-1 flex flex-col gap-2 rounded-xl2 border border-[#B5574A] bg-[#B5574A]/5 p-3">
                <p className="text-[12.5px] text-paper-ink">
                  Are you sure? This can&apos;t be undone - her profile summary and conversation will be gone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="flex-1 rounded-xl border border-paper-border bg-paper-surface py-2 text-[13px] font-medium text-paper-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={doReset}
                    className="flex-1 rounded-xl bg-[#B5574A] py-2 text-[13px] font-medium text-paper-surface active:scale-95"
                  >
                    Yes, reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingFlow({
  becoming,
  onChange,
  onOpenReset,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
  onOpenReset: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const startedRef = useRef(false);

  // A fresh (or just-reset) interview should open with the coach greeting
  // her by name and asking its first question - not sit blank waiting for
  // her to speak first.
  useEffect(() => {
    if (becoming.conversation.length > 0 || startedRef.current) return;
    startedRef.current = true;
    setError(null);
    setLoading(true);
    callAssistant(BECOMING_ONBOARDING_PROMPT, [
      {
        role: "user",
        content: "Start our first conversation - greet me by name and ask your first question about what I want to grow into.",
      },
    ])
      .then((reply) => onChange((b) => addConversationMessage(b, newBecomingMessage("assistant", reply))))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [becoming.conversation.length]);

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
      onChange((b) => addConversationMessage(b, newBecomingMessage("assistant", reply)));
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-[1.05rem] text-backdrop-ink">Becoming</h3>
          <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">
            A few questions to get started - what do you want to grow into?
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenReset}
          aria-label="Becoming settings"
          className="shrink-0 rounded-full bg-paper-surface/80 px-2.5 py-1.5 text-[13px] text-backdrop-muted"
        >
          ⚙
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-backdrop-ink">
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
  onOpenReset,
}: {
  becoming: BecomingData;
  onChange: (updater: (b: BecomingData) => BecomingData) => void;
  onOpenReset: () => void;
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
      onChange((b) => addConversationMessage(b, newBecomingMessage("assistant", reply)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-[1.05rem] text-backdrop-ink">Becoming</h3>
          <p className="mt-0.5 text-[0.8rem] italic text-backdrop-muted">{becoming.profileSummary}</p>
        </div>
        <button
          type="button"
          onClick={onOpenReset}
          aria-label="Becoming settings"
          className="shrink-0 rounded-full bg-paper-surface/80 px-2.5 py-1.5 text-[13px] text-backdrop-muted"
        >
          ⚙
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-backdrop-ink">
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
