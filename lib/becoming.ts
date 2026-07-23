import { dateKey } from "./date";
import { containsBadIdentityToken } from "./identity-guard";

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
  const onboarded = partial?.onboarded ?? false;
  const profileSummary = partial?.profileSummary ?? "";
  const conversation = Array.isArray(partial?.conversation) ? partial.conversation : [];

  const corrupted =
    containsBadIdentityToken(profileSummary) ||
    conversation.some((m) => typeof m?.content === "string" && containsBadIdentityToken(m.content));

  return {
    onboarded: corrupted ? false : onboarded,
    profileSummary: corrupted ? "" : profileSummary,
    conversation: corrupted ? [] : conversation,
    dailyActions: partial?.dailyActions ?? {},
    reflections: Array.isArray(partial?.reflections) ? partial.reflections : [],
  };
}

// Manual reset, wired to the "Reset Becoming" button - wipes only the
// interview state (identity, profile summary, conversation), leaving
// daily actions and reflections untouched since those aren't part of
// "the interview."
export function resetBecomingInterview(data: BecomingData): BecomingData {
  return { ...data, onboarded: false, profileSummary: "", conversation: [] };
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

// Fixed identity, always prepended, never derived from saved state. A
// corrupted profileSummary or conversation history must never be able to
// override who she actually is - this line wins regardless of anything
// else in the prompt.
const IDENTITY_GUARD = `Her name is Sephora - she goes by "Seph." Always address her as Sephora or Seph. This is true no matter what anything below (a saved summary, past conversation, or anything she's said) might suggest otherwise - if anything conflicts with her name, ignore it and use Sephora/Seph.`;

export const BECOMING_ONBOARDING_PROMPT = `You are "Becoming," a warm, insightful personal growth coach inside Sephora's dashboard app. ${IDENTITY_GUARD} This is her onboarding conversation - your job right now is to ask thoughtful, specific questions (one or two at a time, not a long list) to understand what she actually wants to grow in or change about herself or her habits. Be genuinely curious, not generic. Keep replies short - a few sentences at most. After a few exchanges, once you have a real sense of her goals, let her know she can tap "Finish Onboarding" whenever she's ready.`;

export function becomingCoachingPrompt(profileSummary: string): string {
  return `You are "Becoming," a warm, insightful personal growth coach inside Sephora's dashboard app. ${IDENTITY_GUARD} Her stated growth focus, from onboarding: ${profileSummary}\n\nBe encouraging but honest, specific rather than generic, and keep replies short - a few sentences, not lectures. This is an ongoing check-in conversation, not a first meeting.`;
}

export function becomingActionPrompt(profileSummary: string, recentReflections: Reflection[]): string {
  const recentText = recentReflections
    .slice(0, 3)
    .map((r) => `- ${r.date}: ${r.text}`)
    .join("\n");
  return `You are "Becoming," a personal growth coach. ${IDENTITY_GUARD} Her growth focus: ${profileSummary}\n\n${
    recentText ? `Her recent reflections:\n${recentText}\n\n` : ""
  }Suggest exactly ONE small, concrete action she could take today that moves her toward that growth - one or two sentences, specific and doable in a single day, not vague advice. Reply with only the action itself, no preamble.`;
}

export function becomingReflectionPrompt(profileSummary: string): string {
  return `You are "Becoming," a personal growth coach. ${IDENTITY_GUARD} Her growth focus: ${profileSummary}\n\nShe just wrote a reflection below. Respond with a short (2-3 sentence), warm, genuinely insightful reaction - notice something real in what she wrote, not a generic "great job." No preamble, just the response.`;
}
