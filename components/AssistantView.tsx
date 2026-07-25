"use client";

import { useRef, useState } from "react";
import { DashboardData } from "@/lib/types";
import {
  AssistantData,
  addConversationSummary,
  addMessage,
  assistantDisplayName,
  buildSystemPrompt,
  clearMessages,
  currentMonthUsage,
  greetingLine,
  isOverMonthlySpendCap,
  newMessage,
  recordUsage,
} from "@/lib/assistant";
import { AssistantTool, findAssistantTool } from "@/lib/assistant-tools";
import ChatThread from "./ChatThread";
import MemoryScreen from "./MemoryScreen";

type AnthropicBlock = { type: string; [key: string]: unknown };
type ApiMessage = { role: "user" | "assistant"; content: string | AnthropicBlock[] };

type PendingAction = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  describeText: string;
};

type ResolvedResult = { id: string; text: string };

export default function AssistantView({
  data,
  onChangeData,
}: {
  data: DashboardData;
  onChangeData: (updater: (d: DashboardData) => DashboardData) => void;
}) {
  const assistant = data.assistant;
  const name = assistantDisplayName(assistant);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [showMemory, setShowMemory] = useState(false);

  const historyRef = useRef<ApiMessage[]>([]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const autoResultsRef = useRef<ResolvedResult[]>([]);
  const resolvedRef = useRef<ResolvedResult[]>([]);

  function updateAssistantData(updater: (a: AssistantData) => AssistantData) {
    onChangeData((d) => ({ ...d, assistant: updater(d.assistant) }));
  }

  async function callApi(messages: ApiMessage[], useTools: boolean): Promise<
    { content: AnthropicBlock[]; usage: { inputTokens: number; outputTokens: number }; stopReason: string | null } | null
  > {
    const now = new Date();
    const monthUsage = currentMonthUsage(dataRef.current.assistant, now);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: buildSystemPrompt(dataRef.current, now),
        messages,
        useTools,
        monthSpendUsd: monthUsage.costUsd,
        monthCapUsd: dataRef.current.assistant.usage.monthlySpendCapUsd,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      setError(json?.error ?? "The Assistant couldn't respond just now.");
      return null;
    }
    updateAssistantData((a) => recordUsage(a, json.usage.inputTokens ?? 0, json.usage.outputTokens ?? 0, now));
    return {
      content: json.content ?? [],
      usage: json.usage ?? { inputTokens: 0, outputTokens: 0 },
      stopReason: json.stopReason ?? null,
    };
  }

  // A crash anywhere in this turn (a bad tool call, an unexpected shape
  // from the API) must never leave her stuck mid-"Thinking..." with no
  // explanation - the outer try/catch is the last line of defense so
  // there's always a plain-English message and loading always clears.
  async function runTurn() {
    setLoading(true);
    setError(null);
    try {
      const result = await callApi(historyRef.current, true);
      if (!result) {
        setLoading(false);
        return;
      }
      historyRef.current = [...historyRef.current, { role: "assistant", content: result.content }];

      const textBlock = result.content
        .filter((b) => b.type === "text")
        .map((b) => String(b.text ?? ""))
        .join("\n\n")
        .trim();
      if (textBlock) {
        updateAssistantData((a) => addMessage(a, newMessage("assistant", textBlock, new Date())));
      }

      const toolUses = result.content.filter((b) => b.type === "tool_use") as (AnthropicBlock & {
        id: string;
        name: string;
        input: Record<string, unknown>;
      })[];

      if (toolUses.length === 0) {
        // No text and no tool calls means nothing visible happened this
        // turn - that must never pass silently, regardless of why (cut
        // off by the token limit, or just an empty reply).
        if (!textBlock) {
          setError(
            result.stopReason === "max_tokens"
              ? "That was a lot to take in at once and her reply got cut off. Try asking again, maybe in a couple of smaller messages."
              : "She didn't come back with anything that time - try sending that again."
          );
        }
        setLoading(false);
        return;
      }

      const autoResults: ResolvedResult[] = [];
      const newPending: PendingAction[] = [];
      for (const block of toolUses) {
        const tool = findAssistantTool(block.name);
        if (!tool) {
          autoResults.push({ id: block.id, text: `Unknown tool "${block.name}".` });
          continue;
        }
        try {
          if (tool.kind === "write") {
            newPending.push({
              id: block.id,
              name: block.name,
              input: block.input,
              describeText: tool.describe(block.input, dataRef.current),
            });
          } else {
            const { data: nextData, resultText } = tool.apply(dataRef.current, block.input, new Date());
            dataRef.current = nextData;
            onChangeData(() => nextData);
            autoResults.push({ id: block.id, text: resultText });
          }
        } catch (err) {
          // One malformed tool call shouldn't take the whole turn down -
          // tell her plainly and let the rest still go through.
          autoResults.push({
            id: block.id,
            text: `Couldn't complete that one ("${block.name}"): ${err instanceof Error ? err.message : "something went wrong"}.`,
          });
        }
      }

      if (result.stopReason === "max_tokens") {
        setError(
          "Her reply got cut off partway through - there was a lot in that one message. What went through is shown below; ask again for anything that's missing."
        );
      }

      if (newPending.length > 0) {
        autoResultsRef.current = autoResults;
        resolvedRef.current = [];
        setPending(newPending);
        setLoading(false);
        return;
      }

      await finishToolTurn(autoResults);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Something went wrong and she didn't finish responding: ${err.message}`
          : "Something went wrong and she didn't finish responding - try again."
      );
      setLoading(false);
    }
  }

  async function finishToolTurn(allResults: ResolvedResult[]) {
    historyRef.current = [
      ...historyRef.current,
      {
        role: "user",
        content: allResults.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: r.text })),
      },
    ];
    await runTurn();
  }

  function applyTool(tool: AssistantTool, action: PendingAction, baseData: DashboardData): { data: DashboardData; result: ResolvedResult } {
    // A confirmed action failing should never wedge the confirm button or
    // silently drop the change - fall back to the data as it was, and say
    // plainly what happened instead of throwing through the click handler.
    try {
      const { data: nextData, resultText } = tool.apply(baseData, action.input, new Date());
      return { data: nextData, result: { id: action.id, text: resultText } };
    } catch (err) {
      return {
        data: baseData,
        result: { id: action.id, text: `Couldn't complete that: ${err instanceof Error ? err.message : "something went wrong"}.` },
      };
    }
  }

  function resolveAction(action: PendingAction, confirmed: boolean) {
    let result: ResolvedResult;
    if (confirmed) {
      const tool = findAssistantTool(action.name);
      if (!tool) {
        result = { id: action.id, text: "Tool not found." };
      } else {
        const applied = applyTool(tool, action, dataRef.current);
        dataRef.current = applied.data;
        onChangeData(() => applied.data);
        result = applied.result;
      }
    } else {
      result = { id: action.id, text: "Declined by the user - do not retry this without asking again." };
    }

    const nextResolved = [...resolvedRef.current, result];
    const remaining = pending.filter((p) => p.id !== action.id);
    resolvedRef.current = nextResolved;
    setPending(remaining);

    if (remaining.length === 0) {
      const all = [...autoResultsRef.current, ...nextResolved];
      autoResultsRef.current = [];
      resolvedRef.current = [];
      setLoading(true);
      finishToolTurn(all);
    }
  }

  function confirmAll() {
    let currentData = dataRef.current;
    const results: ResolvedResult[] = [];
    for (const action of pending) {
      const tool = findAssistantTool(action.name);
      if (!tool) {
        results.push({ id: action.id, text: "Tool not found." });
        continue;
      }
      const applied = applyTool(tool, action, currentData);
      currentData = applied.data;
      results.push(applied.result);
    }
    dataRef.current = currentData;
    onChangeData(() => currentData);
    const all = [...autoResultsRef.current, ...results];
    autoResultsRef.current = [];
    resolvedRef.current = [];
    setPending([]);
    setLoading(true);
    finishToolTurn(all);
  }

  async function handleSend(text: string) {
    if (isOverMonthlySpendCap(dataRef.current.assistant)) {
      setError("You've hit your monthly Assistant budget - raise the cap in Settings to keep going this month.");
      return;
    }
    const now = new Date();
    updateAssistantData((a) => addMessage(a, newMessage("user", text, now)));
    historyRef.current = [...historyRef.current, { role: "user", content: text }];
    await runTurn();
  }

  async function handleNewConversation() {
    if (assistant.messages.length > 0) {
      setLoading(true);
      try {
        const summaryMessages: ApiMessage[] = [
          ...historyRef.current,
          {
            role: "user",
            content:
              'Summarize this conversation in one or two sentences, written for your own future reference (e.g. "We discussed X and decided Y"). Reply with only the summary, nothing else.',
          },
        ];
        const result = await callApi(summaryMessages, false);
        const summary = result?.content.find((b) => b.type === "text")?.text;
        updateAssistantData((a) => {
          const withSummary = typeof summary === "string" && summary.trim() ? addConversationSummary(a, summary) : a;
          return clearMessages(withSummary);
        });
      } catch {
        // Losing the summary isn't worth blocking a fresh start over - the
        // conversation still clears below either way.
        updateAssistantData((a) => clearMessages(a));
      } finally {
        setLoading(false);
      }
    }
    historyRef.current = [];
    autoResultsRef.current = [];
    resolvedRef.current = [];
    setPending([]);
    setError(null);
  }

  return (
    <div className="scroll-quiet safe-bottom flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-[1.15rem] text-backdrop-ink">{name}</h2>
          <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">
            Talk through your day, work, or anything else - and ask her to add or change things for you.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={() => setShowMemory(true)} className="text-[11px] text-life underline underline-offset-2">
            What she knows
          </button>
          {assistant.messages.length > 0 && (
            <button type="button" onClick={handleNewConversation} className="text-[11px] text-paper-faint">
              New Conversation
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border border-paper-border bg-paper-surface px-3 py-2 text-[12px] text-paper-ink shadow-paper"
          style={{ borderLeft: "3px solid #B5574A" }}
        >
          {error}
        </div>
      )}

      <ChatThread
        messages={assistant.messages}
        onSend={handleSend}
        loading={loading}
        placeholder={`Ask ${name} anything…`}
        emptyState={greetingLine(assistant)}
        accentClass="bg-life"
      />

      {pending.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl2 border border-life/40 bg-life-soft p-3.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-life">
            {name} wants to make {pending.length} change{pending.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-col gap-2">
            {pending.map((action) => (
              <div
                key={action.id}
                className="flex flex-col gap-2 rounded-xl border border-paper-border bg-paper-surface px-3 py-2.5 shadow-paper"
              >
                <span className="min-w-0 whitespace-pre-line text-[13px] text-paper-ink">{action.describeText}</span>
                <div className="flex shrink-0 items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => resolveAction(action, false)}
                    aria-label="Decline"
                    className="rounded-full border border-paper-border px-2.5 py-1 text-[11px] text-paper-muted"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveAction(action, true)}
                    aria-label="Confirm"
                    className="rounded-full bg-life px-2.5 py-1 text-[11px] font-medium text-paper-surface"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pending.length > 1 && (
            <button
              type="button"
              onClick={confirmAll}
              className="self-end rounded-full bg-life px-3.5 py-1.5 text-[12px] font-medium text-paper-surface"
            >
              Add all {pending.length}
            </button>
          )}
        </div>
      )}

      {showMemory && (
        <MemoryScreen assistant={assistant} onChange={updateAssistantData} onClose={() => setShowMemory(false)} />
      )}
    </div>
  );
}
