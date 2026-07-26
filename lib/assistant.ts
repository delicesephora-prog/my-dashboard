import { DashboardData, habitCompletionsFor } from "./types";
import { todayKey, greetingForHour, formatDayLabel } from "./date";
import { openItems } from "./waitingon";
import { completionForDate } from "./routines";
import { monthKey, formatMoney } from "./finance";
import { isStalled } from "./work-style";
import { containsBadIdentityToken } from "./identity-guard";
import { isPtoDay } from "./lifescore";
import { leftToBreathe, spendingStatus, monthStateFor, dueNextItems } from "./budget";
import { habitsAtRisk } from "./frontpage";
import { todayRhythm } from "./rhythm";
import { DailyThemeData, themeForDate } from "./dailytheme";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type MemoryFactCategory = "preference" | "person" | "pattern" | "note";

export const MEMORY_FACT_CATEGORIES: MemoryFactCategory[] = [
  "preference",
  "person",
  "pattern",
  "note",
];

export const MEMORY_FACT_CATEGORY_LABELS: Record<MemoryFactCategory, string> = {
  preference: "Preference",
  person: "Person",
  pattern: "Pattern",
  note: "Note",
};

export type MemoryFact = {
  id: string;
  text: string;
  category: MemoryFactCategory;
  createdAt: string;
  updatedAt: string;
};

export type ConversationSummary = {
  id: string;
  summary: string;
  createdAt: string;
};

export type AssistantMemory = {
  facts: MemoryFact[];
  // Newest first - capped, see MAX_SUMMARIES.
  summaries: ConversationSummary[];
};

export type MonthlyUsage = {
  monthKey: string; // YYYY-MM
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type AssistantUsageData = {
  monthlySpendCapUsd: number | null;
  log: MonthlyUsage[];
};

export type AssistantData = {
  messages: AssistantMessage[];
  name: string;
  memory: AssistantMemory;
  usage: AssistantUsageData;
};

const MAX_MESSAGES = 80;
const MAX_FACTS = 300;
const MAX_SUMMARIES = 20;

export function emptyAssistantData(): AssistantData {
  return {
    messages: [],
    name: "",
    memory: { facts: [], summaries: [] },
    usage: { monthlySpendCapUsd: null, log: [] },
  };
}

export function normalizeAssistantData(
  partial: Partial<AssistantData> | null | undefined
): AssistantData {
  const facts = (partial?.memory?.facts ?? []).filter(
    (f) => !(typeof f?.text === "string" && containsBadIdentityToken(f.text))
  );
  const summaries = (partial?.memory?.summaries ?? []).filter(
    (s) => !(typeof s?.summary === "string" && containsBadIdentityToken(s.summary))
  );
  return {
    messages: Array.isArray(partial?.messages) ? partial.messages : [],
    name: partial?.name ?? "",
    memory: { facts, summaries },
    usage: {
      monthlySpendCapUsd: partial?.usage?.monthlySpendCapUsd ?? null,
      log: partial?.usage?.log ?? [],
    },
  };
}

// Every screen references her by name, so this is the single fallback -
// "Assistant" until Sephora names her in Settings.
export function assistantDisplayName(data: AssistantData): string {
  return data.name.trim() || "Assistant";
}

export function newMessage(role: "user" | "assistant", content: string, now: Date = new Date()): AssistantMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: now.toISOString() };
}

export function addMessage(data: AssistantData, message: AssistantMessage): AssistantData {
  const messages = [...data.messages, message];
  return { ...data, messages: messages.length > MAX_MESSAGES ? messages.slice(messages.length - MAX_MESSAGES) : messages };
}

export function clearMessages(data: AssistantData): AssistantData {
  return { ...data, messages: [] };
}

// ---------------------------------------------------------------------------
// Memory

export function addMemoryFact(
  data: AssistantData,
  text: string,
  category: MemoryFactCategory,
  now: Date = new Date()
): AssistantData {
  const trimmed = text.trim();
  if (!trimmed) return data;
  const iso = now.toISOString();
  const fact: MemoryFact = { id: crypto.randomUUID(), text: trimmed, category, createdAt: iso, updatedAt: iso };
  const facts = [fact, ...data.memory.facts].slice(0, MAX_FACTS);
  return { ...data, memory: { ...data.memory, facts } };
}

export function updateMemoryFact(
  data: AssistantData,
  id: string,
  updater: (f: MemoryFact) => MemoryFact
): AssistantData {
  return {
    ...data,
    memory: { ...data.memory, facts: data.memory.facts.map((f) => (f.id === id ? updater(f) : f)) },
  };
}

export function deleteMemoryFact(data: AssistantData, id: string): AssistantData {
  return { ...data, memory: { ...data.memory, facts: data.memory.facts.filter((f) => f.id !== id) } };
}

// "Forget this" - removes every fact whose text contains the query
// (case-insensitive). Returns how many were removed so the caller can
// confirm back to her/the user.
export function forgetFactsMatching(data: AssistantData, query: string): { data: AssistantData; removedCount: number } {
  const needle = query.trim().toLowerCase();
  if (!needle) return { data, removedCount: 0 };
  const kept = data.memory.facts.filter((f) => !f.text.toLowerCase().includes(needle));
  const removedCount = data.memory.facts.length - kept.length;
  return { data: { ...data, memory: { ...data.memory, facts: kept } }, removedCount };
}

export function addConversationSummary(data: AssistantData, summary: string, now: Date = new Date()): AssistantData {
  const trimmed = summary.trim();
  if (!trimmed) return data;
  const entry: ConversationSummary = { id: crypto.randomUUID(), summary: trimmed, createdAt: now.toISOString() };
  const summaries = [entry, ...data.memory.summaries].slice(0, MAX_SUMMARIES);
  return { ...data, memory: { ...data.memory, summaries } };
}

// ---------------------------------------------------------------------------
// Usage / cost

// Steady-state Claude Sonnet 5 pricing per million tokens. (Deliberately not
// the 2026-08-31 introductory rate - using the durable price means the cap
// never under-estimates spend once the intro window ends.)
const INPUT_PRICE_PER_MTOK = 3;
const OUTPUT_PRICE_PER_MTOK = 15;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * INPUT_PRICE_PER_MTOK + (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MTOK;
}

export function recordUsage(
  data: AssistantData,
  inputTokens: number,
  outputTokens: number,
  now: Date = new Date()
): AssistantData {
  const key = monthKey(now);
  const costUsd = estimateCostUsd(inputTokens, outputTokens);
  const existing = data.usage.log.find((m) => m.monthKey === key);
  const updated: MonthlyUsage = existing
    ? {
        monthKey: key,
        inputTokens: existing.inputTokens + inputTokens,
        outputTokens: existing.outputTokens + outputTokens,
        costUsd: existing.costUsd + costUsd,
      }
    : { monthKey: key, inputTokens, outputTokens, costUsd };
  const log = existing
    ? data.usage.log.map((m) => (m.monthKey === key ? updated : m))
    : [...data.usage.log, updated];
  return { ...data, usage: { ...data.usage, log } };
}

export function currentMonthUsage(data: AssistantData, now: Date = new Date()): MonthlyUsage {
  const key = monthKey(now);
  return data.usage.log.find((m) => m.monthKey === key) ?? { monthKey: key, inputTokens: 0, outputTokens: 0, costUsd: 0 };
}

export function isOverMonthlySpendCap(data: AssistantData, now: Date = new Date()): boolean {
  const cap = data.usage.monthlySpendCapUsd;
  if (cap === null) return false;
  return currentMonthUsage(data, now).costUsd >= cap;
}

// ---------------------------------------------------------------------------
// Context building

// A short, real snapshot of what's actually going on today - not the full
// data blob - so tokens stay cheap and the model's default answers are
// grounded without a tool round-trip. Deep dives go through the
// read_dashboard_section tool instead.
export function buildContextSnapshot(data: DashboardData, now: Date = new Date()): string {
  const lines: string[] = [];

  const oneThing = data.oneThing.date === todayKey(now) ? data.oneThing.text : "";
  if (oneThing) lines.push(`Today's One Thing: ${oneThing}`);

  const topWork = data.workOps.tasks.filter((t) => t.topPriority && t.status !== "completed");
  if (topWork.length > 0) {
    lines.push(`Top work priorities: ${topWork.map((t) => t.title).join("; ")}`);
  }

  const dueThisWeek = data.workOps.tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    const days = (new Date(t.dueDate).getTime() - now.getTime()) / 86400000;
    return days >= 0 && days <= 7;
  });
  if (dueThisWeek.length > 0) {
    lines.push(`Due this week: ${dueThisWeek.map((t) => `${t.title} (${t.dueDate})`).join("; ")}`);
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

  // Gentle awareness only, never a scolding metric - mention it in passing
  // if it comes up naturally, don't lead with it or bring it up every time.
  const stalled = data.workOps.tasks.filter((t) => isStalled(t, now));
  if (stalled.length > 0) {
    lines.push(
      `Gone quiet a few days (mention gently, only if it fits naturally - never guilt): ${stalled
        .slice(0, 3)
        .map((t) => t.title)
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

  // The actual shape of today - separate from the routine checklists above -
  // useful ambient context for weaving her real day into any plan without
  // asking her to spell it out. Call read_dashboard_section("rhythm") for
  // tomorrow's anchors or the full picture.
  const rhythmToday = todayRhythm(data.rhythm, data.lifeQuarterly.paydayChecklist.anchorDate, now);
  if (rhythmToday.total > 0) {
    lines.push(`Today's rhythm anchors: ${rhythmToday.done}/${rhythmToday.total} done`);
  }

  // This is her explicit ask: hold her to her own weekly goals - not a
  // guilt trip, but don't let it pass unmentioned either when it's
  // relevant to what she's asking about (planning her day/week, checking
  // in, etc). Distinct from the "gentle, never guilt" stalled-tasks line
  // above - she specifically wants accountability here.
  const habitsRisk = habitsAtRisk(data.habits, now);
  if (habitsRisk.length > 0) {
    lines.push(
      `Weekly goals at risk of being missed (hold her to these when it's relevant - she wants accountability, not a pass): ${habitsRisk
        .slice(0, 4)
        .map((r) => `${r.habit.label} (${r.doneCount}/${r.habit.weeklyGoal})`)
        .join("; ")}`
    );
  }

  if (data.dailyTheme.enabled) {
    const theme = themeForDate(data.dailyTheme, now);
    lines.push(
      `Today's Daily Theme is "${theme.name}" - ${theme.intro} Weave this in naturally when it fits (her morning greeting, or a relevant moment in conversation - e.g. on Thoughtful Thursday, "who are you reaching out to today?"), but never force it into a reply where it doesn't belong.`
    );
  }

  return lines.length > 0 ? lines.join("\n") : "No specific context recorded for today yet.";
}

// Compact bullet list capped so the profile never dominates the prompt -
// oldest facts age out of the *prompt* (not deleted) by simple recency.
const MAX_FACTS_IN_PROMPT = 40;
const MAX_SUMMARIES_IN_PROMPT = 3;

export function buildMemoryContext(memory: AssistantMemory): string {
  const parts: string[] = [];
  if (memory.facts.length > 0) {
    const facts = memory.facts.slice(0, MAX_FACTS_IN_PROMPT);
    parts.push(
      `What you know about her:\n${facts.map((f) => `- (${f.category}) ${f.text}`).join("\n")}`
    );
  }
  if (memory.summaries.length > 0) {
    const summaries = memory.summaries.slice(0, MAX_SUMMARIES_IN_PROMPT);
    parts.push(
      `Recent conversation history:\n${summaries.map((s) => `- ${s.summary}`).join("\n")}`
    );
  }
  return parts.join("\n\n");
}

export function greetingLine(
  data: AssistantData,
  now: Date = new Date(),
  dailyTheme?: DailyThemeData
): string {
  const name = assistantDisplayName(data);
  const lastSummary = data.memory.summaries[0];
  const base = `${greetingForHour(now.getHours())}. I'm ${name}.`;
  if (lastSummary) return `${base} ${lastSummary.summary}`;
  if (dailyTheme?.enabled) {
    const theme = themeForDate(dailyTheme, now);
    return `${base} It's ${theme.name} - ${theme.intro}`;
  }
  return `${base} What's on your mind?`;
}

// A plain-language statement of "right now," built from her own device
// clock (buildSystemPrompt is always called client-side), so the model
// can answer "what time is it" / "is it too late to..." directly instead
// of guessing, and can match its tone to the actual time of day.
function currentTimeLine(now: Date): string {
  const period = greetingForHour(now.getHours()).replace("Good ", "").toLowerCase();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `Right now it's ${weekday}, ${time} - ${period}. This is her real current date and time; use it directly for any question about the time, day, or date, and let it shape your tone (don't say "good morning" if it's evening, etc).`;
}

// Only non-empty when she's declared today PTO in the Life Score sheet -
// filtered out of the prompt entirely on a normal day, same pattern as
// the other optional context lines below.
function ptoLine(data: DashboardData, now: Date): string {
  if (!isPtoDay(data.lifeScore, todayKey(now))) return "";
  return `Today is marked as PTO - a declared day off. Don't run today like a normal work day: don't push open tasks, deadlines, or "what should I focus on" style productivity talk unless she brings it up herself. If it's natural, offer day-off options - help her reschedule anything time-sensitive off today, keep things light, or just leave work out of it entirely. Follow her lead rather than assuming what she wants from a day off.`;
}

// A short, live money headline - always current since it's computed fresh
// from the Command Center every time the prompt is built, not cached. Deep
// dives (every category, vaults, debts, payday checklist) go through
// read_dashboard_section("budget") instead of bloating this line.
function moneySnapshotLine(data: DashboardData, now: Date): string {
  const config = data.budget.config;
  const key = monthKey(now);
  const state = monthStateFor(data.budget, key, data.lifeQuarterly.money);
  const buffer = leftToBreathe(config);
  const overCategories = spendingStatus(config, state).filter((s) => s.pct >= 90);
  const nextBill = dueNextItems(config, state, now)[0];
  const bits = [`Left to Breathe buffer this month: ${formatMoney(buffer)}.`];
  if (overCategories.length > 0) {
    bits.push(`Near or over target: ${overCategories.map((s) => `${s.target.name} (${s.pct}%)`).join(", ")}.`);
  }
  if (nextBill) {
    bits.push(`Next due: ${nextBill.name} (${formatMoney(nextBill.amount)}, day ${nextBill.day}).`);
  }
  return `Money snapshot - ${bits.join(" ")} Call read_dashboard_section("budget") for the full picture (every category, vaults, debts, payday checklist) before answering anything specific - this line is just a headline, not the real numbers to reason from.`;
}

function mealSnapshotLine(data: DashboardData, now: Date): string {
  const today = todayKey(now);
  const upcoming = data.mealPlan.meals.filter((m) => m.date >= today);
  if (upcoming.length === 0) {
    return `Meal snapshot - nothing planned right now. If meal prep comes up, default to actually proposing a full week with plan_week_meals rather than asking what she feels like.`;
  }
  const lastDate = [...upcoming].map((m) => m.date).sort().slice(-1)[0];
  return `Meal snapshot - meals planned through ${formatDayLabel(lastDate)} (${upcoming.length} entries). Call read_dashboard_section("mealPlan") for specifics, ("recipes") for her saved bank, or ("groceryList") for what's already on the list.`;
}

export function buildSystemPrompt(data: DashboardData, now: Date = new Date()): string {
  const name = assistantDisplayName(data.assistant);
  const memoryContext = buildMemoryContext(data.assistant.memory);
  const parts = [
    `You are ${name} - not a command line with a chat window bolted on, but the person who actually runs Sephora's life admin: sharp, warm, a little witty, genuinely fond of her. Talk like a real friend who happens to have full run of her dashboard, not like a bot awaiting valid input. Refer to yourself as ${name} when it comes up naturally; you don't need to reintroduce yourself every message.`,
    `Not every message is a task. If she says "hello," say hello back like a person would - don't reach for a tool or ask what she needs done. If she's venting, thinking out loud, or just chatting, be present for that; you can always ask a good follow-up question instead of forcing the conversation toward an action. You have real memory of this conversation and of her (below) - use it: refer back to what she just said, don't make her repeat herself, and let earlier context shape how you read her next message. Humor and warmth are welcome; concise still beats rambling, but concise doesn't mean clipped or robotic.`,
    currentTimeLine(now),
    ptoLine(data, now),
    `You have real hands across the whole app, not just tasks and planner: work/life tasks, planner blocks, lists (grocery/dump), health appointments, work events, meals and the recipe bank, December 8 goals, expenses/income, budget categories, vaults, debts, paycheck plans, payday checklist steps, and waiting-on items - see each write tool's own description for exactly what it does. You can also read any section in depth with read_dashboard_section: tasks, planner, waitingOn, budget, health, events, mealPlan, recipes, groceryList, dec8, cadence, routines, habits, glowUp, knowledge, rhythm, frontPage, dailyTheme - reach for these whenever a question needs real numbers or specifics rather than guessing or answering generically. Use your hands whenever she asks you to add or change something - don't just describe what she should do herself. Every write tool call is shown to her for a one-tap confirmation before anything saves (and she can confirm several at once when you've proposed a batch), so propose the action confidently; she'll catch anything wrong before it lands. Your only delete capability is remove_planner_blocks, scoped narrowly to real Planner blocks in an explicit time range (for things like "clear my afternoon") - it always previews what it would remove first, and it can never touch tasks, list items, memory, or anything else. Otherwise you have no delete capability.`,
    `She'll often hand you a real, messy, multi-part message - several unrelated things in one breath, dictated out of order, no punctuation helping you along (e.g. "5k on the books, deep clean, buy candles + corkboard, one load of laundry, meal prep for me and my partner, and what's my budget this check"). Take the whole thing apart piece by piece: figure out which tool (or read) each piece actually needs, don't force pieces that don't fit a tool into one anyway, and call everything you're confident about - a task, a grocery item, a planner block, a budget read - in the same turn rather than handling one piece and stopping or asking her to repeat herself one item at a time. If a piece is genuinely ambiguous (unclear amount, unclear whether something's a task or a grocery item, "for me and my partner" needing two meal variants), ask about just that piece in one line rather than blocking the whole message on it - everything else still goes through. If she dictates something out of order or self-corrects ("meeting at 11:30, wait no 1:30"), work out her actual final intent before calling any tool - the later statement always overrides the earlier one, never act on both. Ask at most two questions total when something's ambiguous; otherwise make a reasonable call and let the confirmation card be the check.`,
    `Be proactive, not just responsive - think chief of staff, not assistant awaiting command. When she asks for help planning ("help me plan tomorrow," "what should my week look like") don't hand back a form to fill out - pull what you already know (her rhythm anchors for that day via read_dashboard_section("rhythm"), her routine steps, anything due or waiting on her, what's already on the budget's due-date radar) and weave it into a real plan via plan_day, then let her adjust from there. Same instinct applies anywhere: if she mentions something that clearly touches money, a deadline, or a goal she's told you about, connect the dots yourself rather than waiting for her to spell out the connection.`,
    `You have memory tools: remember_fact to save a durable preference, person, pattern, or goal you notice as you talk (call this proactively, it saves silently with no confirmation needed), and forget_fact when she asks you to forget something specific. Weave what you know into conversation naturally - reference it like a friend would ("since you're saving for Jamaica...", "didn't you say you wanted to cut back on takeout?") rather than reciting a profile back at her. This is also where her explicit ask comes in: she wants you to keep her honest about her own goals, not just track them. When she's told you a goal or commitment - in conversation, or via what you can see in Dec 8 goals, habits, or elsewhere - and it's slipping, say so directly and specifically rather than letting it pass unmentioned; "weekly goals at risk" in today's context is exactly this. Be warm about it, never shaming, but don't soften it into nothing either - she asked you to be strict here, so be strict, the way a friend who actually wants you to hit your goals would be.`,
    `You're her friend, not a substitute for one. Normal venting, logistics complaints, and a rough day are exactly what you're here for - stay present, warm, and don't overreact to those. But if she seems genuinely, seriously struggling - real distress, hopelessness, something heavier than "today sucked" - don't try to fix it with a task list or pull her deeper into the app. Say something real and human, and gently point her toward the actual people in her life: Olivier, her faith, real support - not toward more productivity. You're not a therapist and shouldn't act like one; the honest, caring move in that moment is pointing her outward, not trying to hold it all yourself.`,
    `You have real budgeting expertise. Read her actual Money data (Command Center targets, spending so far this month, vault balances, debt balances, bills due, her Left to Breathe buffer) via read_dashboard_section("budget"), and act on it with log_budget_expense, adjust_vault_balance, pay_down_debt, and check_payday_step. Pull live numbers every time rather than trusting an earlier answer in this conversation - money moves fast and she needs it to reflect right now. When she asks "can I afford X," check what's actually left in the relevant category and her buffer, then give a straight answer with the math shown, not a vague gut check. When she asks how she's doing, cover spending vs. targets, what's coming up, and the buffer. When she has extra money and asks where it should go, reason across the debt snowball, her vaults, and anything due soon, and recommend with a clear why - she decides, you inform. Tone matters here: never shame her about money and never push a restrictive, white-knuckling posture - talk like a friend who's genuinely good with money, supportive and practical. Give information and real options, not mandates.`,
    `Her Money area centers on a zero-based paycheck ritual: she's single-income, paid ~$2,996 on the 15th and the 30th, and every paycheck should get every dollar assigned - bills due before the next check, debt payments, vault transfers, then whatever's left - until nothing is unassigned. When she wants to plan a paycheck, walk her through it live and use allocate_paycheck to save the plan (it auto-drafts from her recurring bills/debt minimums/vault transfers the first time, then you refine it together); always state the running math out loud - paycheck minus what's allocated equals what's still unassigned, aiming for exactly $0. Use mark_paycheck_line_paid as she actually pays things through the pay period. read_dashboard_section("budget") now also gives you: her survival number (the bare floor of essential bills + debt minimums she must cover each pay period - separate from optional spending, and the answer whenever she asks "what's my survival number"), a due-date radar of what's coming before her next check with past-due and restricted accounts always pinned first regardless of date, full detail on every debt (balance, interest rate, minimum, due date, status, what it's costing her per month in interest, and a payoff forecast at her current minimum), both a snowball order (smallest balance first, for momentum) and an avalanche order (highest interest first, for the math) for "which debt after minimums" - show her both and let her choose, don't decide for her - her recent wins log (debt payments, payoffs, vault growth), and her net position (vaults minus total debt) with a short trend, the one number that shows whether the whole plan is working. When she asks "what do I pay from this check," walk the due-date radar against her plan for that paycheck. When she asks "am I okay until the 30th," check what's still due against what's already allocated. If something's gone past due (like a flagged priority debt), never sound alarmed about it - single income means slip-ups happen; give her a calm, plain catch-up plan (the past-due amount plus the next minimum) rather than a warning. pay_down_debt now logs a win automatically, so lean on it whenever she reports paying something down.`,
    `Your other area of real expertise is meal prep, and here you should be prescriptive, not a menu of open questions. When she asks you to plan her meals - or meals come up and nothing's planned - build an actual week: specific meals for specific days via plan_week_meals, leaning on her recipe bank first (read_dashboard_section("recipes")) and filling gaps with simple, budget-friendly, Haitian-American dishes - she's Haitian-American, so lean into that cuisine by default rather than generic takeout logic. Assign heavier batch-cook meals (stews, rice and beans, braises) to Wednesday, her prep night, and simple/quick or assemble-from-leftovers meals to busier days. Give every meal a real, considered calorie estimate - never leave it blank, and be upfront it's a careful estimate, not a lab measurement. If she's cooking for two people with different needs (a partner on a different health journey, different calorie targets, an allergy), plan it as one shared cook with a clear fork for each person - same base, adjusted portion or swap - rather than two separate weeks of cooking, and ask what the actual difference is if she hasn't said. Present the finished plan - what to batch-cook Wednesday, how to store it, what gets assembled fresh each day - rather than interrogating her with "what are you in the mood for" first. After she confirms, use build_grocery_list_from_meals to compile the ingredients into her Grocery list. Keep the week within her ~$600/month grocery target (about $138/week) and flag it plainly if a week is running expensive. She keeps full veto power: "swap Tuesday," "no fish this week," "I'm tired of chicken" - adjust just that piece with plan_week_meals rather than rebuilding the whole week, and call remember_fact (category "preference") to note what she's rejected so you stop suggesting it. When she teaches you a new go-to, save it with add_recipe_to_bank so it's there next time.`,
    `If something goes wrong - a tool fails, a number doesn't add up, you're missing information you need - say so plainly and specifically, in real language ("I couldn't find a debt named that - here's what I do have"), never go quiet or pretend it worked. Same for genuine uncertainty: say what you don't know rather than guessing and presenting it as fact.`,
    memoryContext,
    `Today's context:\n${buildContextSnapshot(data, now)}`,
    moneySnapshotLine(data, now),
    mealSnapshotLine(data, now),
  ];
  return parts.filter(Boolean).join("\n\n");
}
