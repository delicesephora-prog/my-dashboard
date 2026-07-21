import { dateKey } from "./date";

// Curated bank, not generated - same pattern as verses/vocab/facts/tips.
// One quest per day, deterministic, picked by day-of-year so it's stable
// across devices without needing to store which one was shown.

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export type QuestCategory = "self-care" | "connection" | "growth" | "fun" | "work" | "faith";

export type Quest = {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
};

export const QUEST_BANK: Quest[] = [
  { id: "q1", title: "Phone-Free Meal", description: "Eat one meal today without your phone anywhere near the table.", category: "self-care" },
  { id: "q2", title: "Say the Thing", description: "Tell one person something you appreciate about them - specifically, not just \"thanks.\"", category: "connection" },
  { id: "q3", title: "Ten-Minute Tidy", description: "Set a timer for ten minutes and reset one space that's been bothering you.", category: "self-care" },
  { id: "q4", title: "Learn One Thing", description: "Look up something you've always wondered about and actually read the answer.", category: "growth" },
  { id: "q5", title: "Send the Text", description: "Reach out to someone you've been meaning to check in on.", category: "connection" },
  { id: "q6", title: "Walk Without a Destination", description: "Take a walk with no purpose except being outside for a few minutes.", category: "self-care" },
  { id: "q7", title: "Compliment a Stranger", description: "Give a genuine compliment to someone you don't know well.", category: "connection" },
  { id: "q8", title: "Sit With the Hard Thing", description: "Spend five quiet minutes actually thinking through something you've been avoiding.", category: "growth" },
  { id: "q9", title: "Water Break", description: "Drink a full glass of water right now, before you do anything else.", category: "self-care" },
  { id: "q10", title: "Try the New Thing", description: "Order, cook, or try something you've never had before today.", category: "fun" },
  { id: "q11", title: "Close One Loop", description: "Finish the one small task you've been putting off for a week.", category: "work" },
  { id: "q12", title: "Gratitude Out Loud", description: "Say three things you're grateful for, out loud, even if no one's listening.", category: "faith" },
  { id: "q13", title: "Ask a Real Question", description: "In your next conversation, ask a question you actually want the answer to.", category: "connection" },
  { id: "q14", title: "No-Scroll Hour", description: "Pick one hour today with zero social media, on purpose.", category: "self-care" },
  { id: "q15", title: "Write It Down", description: "Put one worry on paper instead of carrying it around in your head all day.", category: "growth" },
  { id: "q16", title: "Music Break", description: "Play a song that makes you feel something and actually listen to it.", category: "fun" },
  { id: "q17", title: "Ask for Help", description: "Ask someone for help with something you've been trying to do alone.", category: "growth" },
  { id: "q18", title: "Prayer Walk", description: "Take a short walk and use it as quiet time to pray or reflect.", category: "faith" },
  { id: "q19", title: "Praise in Public", description: "Give a colleague credit for something, where others can see it.", category: "work" },
  { id: "q20", title: "Stretch Break", description: "Stop and stretch for two full minutes, wherever you are.", category: "self-care" },
  { id: "q21", title: "Handwrite a Note", description: "Write a short note to someone by hand instead of texting it.", category: "connection" },
  { id: "q22", title: "Ten Extra Minutes", description: "Give one task ten extra minutes of real focus instead of rushing it.", category: "work" },
  { id: "q23", title: "Try Silence", description: "Spend five minutes in genuine silence - no music, no scrolling, nothing.", category: "faith" },
  { id: "q24", title: "Plan Something Fun", description: "Pick a date and actually plan one fun thing to look forward to.", category: "fun" },
  { id: "q25", title: "Name the Feeling", description: "Notice how you're actually feeling right now and name it honestly.", category: "growth" },
  { id: "q26", title: "Fresh Air Reset", description: "Step outside for two minutes between tasks today, even briefly.", category: "self-care" },
  { id: "q27", title: "Ask, Don't Assume", description: "Replace one assumption today with an actual question to the person involved.", category: "work" },
  { id: "q28", title: "Read a Verse Slowly", description: "Read today's verse twice - once fast, once slow enough to actually sit with it.", category: "faith" },
  { id: "q29", title: "Laugh on Purpose", description: "Watch, read, or listen to something that reliably makes you laugh.", category: "fun" },
  { id: "q30", title: "One Kind Word", description: "Say one kind thing to yourself today the way you'd say it to a friend.", category: "self-care" },
];

export function questForDate(d: Date): Quest {
  const index = ((dayOfYear(d) % QUEST_BANK.length) + QUEST_BANK.length) % QUEST_BANK.length;
  return QUEST_BANK[index];
}

export type QuestData = {
  // Keyed by YYYY-MM-DD -> quest id completed that day.
  completedDates: Record<string, string>;
};

export function emptyQuestData(): QuestData {
  return { completedDates: {} };
}

export function normalizeQuestData(partial: Partial<QuestData> | null | undefined): QuestData {
  return { completedDates: partial?.completedDates ?? {} };
}

export function isQuestDone(data: QuestData, now: Date = new Date()): boolean {
  return Boolean(data.completedDates[dateKey(now)]);
}

export function markQuestDone(data: QuestData, now: Date = new Date()): QuestData {
  const today = dateKey(now);
  const quest = questForDate(now);
  return { ...data, completedDates: { ...data.completedDates, [today]: quest.id } };
}

// Consecutive days (ending today or yesterday) with a quest completed.
export function questStreak(data: QuestData, now: Date = new Date()): number {
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // If today isn't done yet, the streak is still whatever was built through
  // yesterday - start counting from today only if it's already done.
  if (!data.completedDates[dateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (data.completedDates[dateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
