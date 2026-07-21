import { dateKey } from "./date";

export type BecomingMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type DailyAction = {
  date: string; // YYYY-MM-DD
  action: string;
  done: boolean;
};

export type Reflection = {
  id: string;
  date: string;
  text: string;
  aiResponse: string;
};

export type BecomingData = {
  onboarded: boolean;
  profileSummary: string;
  conversation: BecomingMessage[];
  dailyActions: Record<string, DailyAction>;
  reflections: Reflection[];
};

const MAX_CONVERSATION = 100;

export function emptyBecomingData(): BecomingData {
  return { onboarded: false, profileSummary: "", conversation: [], dailyActions: {}, reflections: [] };
}

export function normalizeBecomingData(
  partial: Partial<BecomingData> | null | undefined
): BecomingData {
  return {
    onboarded: partial?.onboarded ?? false,
    profileSummary: partial?.profileSummary ?? "",
    conversation: Array.isArray(partial?.conversation) ? partial.conversation : [],
    dailyActions: partial?.dailyActions ?? {},
    reflections: Array.isArray(partial?.reflections) ? partial.reflections : [],
  };
}

export function newBecomingMessage(
  role: "user" | "assistant",
  content: string,
  now: Date = new Date()
): BecomingMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: now.toISOString() };
}

export function addConversationMessage(data: BecomingData, message: BecomingMessage): BecomingData {
  const conversation = [...data.conversation, message];
  return {
    ...data,
    conversation:
      conversation.length > MAX_CONVERSATION
        ? conversation.slice(conversation.length - MAX_CONVERSATION)
        : conversation,
  };
}

export function completeOnboarding(data: BecomingData, summary: string): BecomingData {
  return { ...data, onboarded: true, profileSummary: summary };
}

export function todaysAction(data: BecomingData, now: Date = new Date()): DailyAction | null {
  return data.dailyActions[dateKey(now)] ?? null;
}

export function setTodaysAction(data: BecomingData, action: string, now: Date = new Date()): BecomingData {
  const today = dateKey(now);
  return { ...data, dailyActions: { ...data.dailyActions, [today]: { date: today, action, done: false } } };
}

export function toggleTodaysActionDone(data: BecomingData, now: Date = new Date()): BecomingData {
  const today = dateKey(now);
  const current = data.dailyActions[today];
  if (!current) return data;
  return { ...data, dailyActions: { ...data.dailyActions, [today]: { ...current, done: !current.done } } };
}

export function addReflection(data: BecomingData, reflection: Reflection): BecomingData {
  return { ...data, reflections: [reflection, ...data.reflections] };
}

export const BECOMING_ONBOARDING_PROMPT = `You are "Becoming," a warm, insightful personal growth coach inside Sephora's dashboard app. This is her onboarding conversation - your job right now is to ask thoughtful, specific questions (one or two at a time, not a long list) to understand what she actually wants to grow in or change about herself or her habits. Be genuinely curious, not generic. Keep replies short - a few sentences at most. After a few exchanges, once you have a real sense of her goals, let her know she can tap "Finish Onboarding" whenever she's ready.`;

export function becomingCoachingPrompt(profileSummary: string): string {
  return `You are "Becoming," a warm, insightful personal growth coach inside Sephora's dashboard app. Her stated growth focus, from onboarding: ${profileSummary}\n\nBe encouraging but honest, specific rather than generic, and keep replies short - a few sentences, not lectures. This is an ongoing check-in conversation, not a first meeting.`;
}

export function becomingActionPrompt(profileSummary: string, recentReflections: Reflection[]): string {
  const recentText = recentReflections
    .slice(0, 3)
    .map((r) => `- ${r.date}: ${r.text}`)
    .join("\n");
  return `You are "Becoming," a personal growth coach. Her growth focus: ${profileSummary}\n\n${
    recentText ? `Her recent reflections:\n${recentText}\n\n` : ""
  }Suggest exactly ONE small, concrete action she could take today that moves her toward that growth - one or two sentences, specific and doable in a single day, not vague advice. Reply with only the action itself, no preamble.`;
}

export function becomingReflectionPrompt(profileSummary: string): string {
  return `You are "Becoming," a personal growth coach. Her growth focus: ${profileSummary}\n\nShe just wrote a reflection below. Respond with a short (2-3 sentence), warm, genuinely insightful reaction - notice something real in what she wrote, not a generic "great job." No preamble, just the response.`;
}
