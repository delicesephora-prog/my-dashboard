import { DashboardData } from "./types";
import { todayKey } from "./date";
import { openItems } from "./waitingon";
import { completionForDate } from "./routines";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AssistantData = {
  messages: AssistantMessage[];
};

const MAX_MESSAGES = 80;

export function emptyAssistantData(): AssistantData {
  return { messages: [] };
}

export function normalizeAssistantData(
  partial: Partial<AssistantData> | null | undefined
): AssistantData {
  return { messages: Array.isArray(partial?.messages) ? partial.messages : [] };
}

export function newMessage(role: "user" | "assistant", content: string, now: Date = new Date()): AssistantMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: now.toISOString() };
}

export function addMessage(data: AssistantData, message: AssistantMessage): AssistantData {
  const messages = [...data.messages, message];
  return { messages: messages.length > MAX_MESSAGES ? messages.slice(messages.length - MAX_MESSAGES) : messages };
}

export function clearMessages(data: AssistantData): AssistantData {
  return { messages: [] };
}

// A short, real snapshot of what's actually going on today - not the full
// data blob - so the assistant's answers can be grounded without needing
// any read/write tool access into the dashboard itself.
export function buildContextSnapshot(data: DashboardData, now: Date = new Date()): string {
  const lines: string[] = [];

  const oneThing = data.oneThing.date === todayKey(now) ? data.oneThing.text : "";
  if (oneThing) lines.push(`Today's One Thing: ${oneThing}`);

  const topWork = data.workOps.tasks.filter((t) => t.topPriority && t.status !== "completed");
  if (topWork.length > 0) {
    lines.push(`Top work priorities: ${topWork.map((t) => t.title).join("; ")}`);
  }

  const waiting = openItems(data.waitingOn);
  if (waiting.length > 0) {
    lines.push(
      `Waiting on ${waiting.length} thing${waiting.length === 1 ? "" : "s"}: ${waiting
        .slice(0, 5)
        .map((w) => `${w.who} (${w.what})`)
        .join("; ")}`
    );
  }

  const morning = completionForDate(data.routines.config, data.routines, "morning", now);
  const day = completionForDate(data.routines.config, data.routines, "day", now);
  const night = completionForDate(data.routines.config, data.routines, "night", now);
  const routineParts: string[] = [];
  if (morning.total > 0) routineParts.push(`morning ${morning.done}/${morning.total}`);
  if (day.total > 0) routineParts.push(`day ${day.done}/${day.total}`);
  if (night.total > 0) routineParts.push(`night ${night.done}/${night.total}`);
  if (routineParts.length > 0) lines.push(`Today's routines: ${routineParts.join(", ")}`);

  return lines.length > 0 ? lines.join("\n") : "No specific context recorded for today yet.";
}

export const ASSISTANT_SYSTEM_PROMPT = `You are a warm, practical personal assistant inside Sephora's personal productivity dashboard app. Help her think through her day, work, and life planning - be concise, direct, and genuinely useful rather than generic. You have a short snapshot of what's happening today (below); use it when relevant, but don't force it into every reply. You cannot see or change anything else in her dashboard, and you cannot take actions - only talk through things with her.`;
