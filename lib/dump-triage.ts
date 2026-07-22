// Turns one messy, poured-out brain dump into separate items, each with a
// suggested destination. Tries the Assistant's Claude model first (genuinely
// understands run-on sentences and ambiguous commas); falls back to a local
// heuristic split + keyword guess if the Assistant isn't configured or the
// request fails, so the feature always works either way.

export type TriageDestination = "work" | "life" | "grocery" | "parkingLot" | "dump";

export const TRIAGE_DESTINATIONS: TriageDestination[] = ["work", "life", "grocery", "parkingLot", "dump"];

export const TRIAGE_DESTINATION_LABELS: Record<TriageDestination, string> = {
  work: "Work task",
  life: "Life task",
  grocery: "Grocery",
  parkingLot: "Idea",
  dump: "Dump",
};

export type TriagedItem = {
  id: string;
  text: string;
  destination: TriageDestination;
};

const SPLIT_CONNECTORS = /\b(?:and then|then i need to|then i should|then|also need to|also)\b/gi;

// Heuristic splitter: line breaks are always boundaries; within a line,
// break on connector phrases ("and then", "also"), and on periods/semicolons
// that read as sentence boundaries. Commas are left alone by default since
// they're too often part of a single thought (a grocery list item, a
// clause) to safely split on - that ambiguity is exactly what the
// Assistant-backed path handles better.
export function splitBrainDump(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  for (const line of lines) {
    const bySentence = line.split(/(?<=[.;!?])\s+(?=[A-Z0-9])/);
    for (const sentence of bySentence) {
      const chunks = sentence
        .split(SPLIT_CONNECTORS)
        .map((c) => c.replace(/^[,\s]+|[,\s]+$/g, ""))
        .filter(Boolean);
      pieces.push(...chunks);
    }
  }
  return pieces.filter((p) => p.length > 0);
}

const GROCERY_WORDS =
  /\b(buy|grocer|milk|eggs|bread|produce|snack|pantry|butter|cheese|meat|chicken|veg|fruit|store run|shopping list|pick up.*(store|market))\b/i;
const WORK_WORDS =
  /\b(email|meeting|deadline|client|report|presentation|follow up|slack|project|manager|deck|invoice|standup|call .*(boss|team|client))\b/i;
const LIFE_WORDS =
  /\b(appointment|doctor|dentist|call mom|call dad|schedule|book|renew|pay .*(bill|rent)|pick up .*(kid|dry ?clean)|errand|dmv|pharmacy)\b/i;
const IDEA_WORDS =
  /\b(idea|someday|maybe|what if|explore|consider|look into|research|would be (cool|nice)|thinking about)\b/i;

export function guessDestination(text: string): TriageDestination {
  if (GROCERY_WORDS.test(text)) return "grocery";
  if (IDEA_WORDS.test(text)) return "parkingLot";
  if (WORK_WORDS.test(text)) return "work";
  if (LIFE_WORDS.test(text)) return "life";
  return "dump";
}

export function heuristicTriage(raw: string): TriagedItem[] {
  return splitBrainDump(raw).map((text) => ({
    id: crypto.randomUUID(),
    text,
    destination: guessDestination(text),
  }));
}

const TRIAGE_SYSTEM_PROMPT = `You triage a messy "brain dump" for a personal dashboard app. The user pastes raw, unstructured text - run-on sentences, multiple thoughts on one line, dictated speech, line breaks mid-thought, commas that might separate distinct thoughts or might just be part of one clause.

Split it into separate atomic items, each a single actionable thought or note, keeping wording close to the original (just trimmed to that one thought, lightly cleaned up). For each item, suggest exactly one destination from this set:
- "work": a work task or professional to-do
- "life": a personal/life to-do (errand, appointment, call, chore)
- "grocery": something to buy at the store
- "parkingLot": an idea, someday-thought, or thing to explore later - not an immediate action
- "dump": unclear, or just a note worth keeping without a clear action

Respond with ONLY valid JSON, no prose, no markdown code fence, in exactly this shape:
{"items":[{"text":"...","destination":"work"}]}`;

function parseAssistantReply(reply: string): TriagedItem[] | null {
  const cleaned = reply.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    const items: TriagedItem[] = [];
    for (const raw of parsed.items) {
      if (typeof raw?.text !== "string" || !raw.text.trim()) continue;
      const destination: TriageDestination = TRIAGE_DESTINATIONS.includes(raw.destination)
        ? raw.destination
        : "dump";
      items.push({ id: crypto.randomUUID(), text: raw.text.trim(), destination });
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

// Tries the Assistant API for a smarter split+classify; returns null on any
// failure (not configured, network error, malformed reply) so the caller
// can fall back to heuristicTriage without surfacing an error to the user.
export async function triageWithAssistant(raw: string): Promise<TriagedItem[] | null> {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: TRIAGE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: raw.slice(0, 6000) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data?.ok || typeof data.reply !== "string") return null;
    return parseAssistantReply(data.reply);
  } catch {
    return null;
  }
}

export async function triageBrainDump(raw: string): Promise<TriagedItem[]> {
  const smart = await triageWithAssistant(raw);
  if (smart) return smart;
  return heuristicTriage(raw);
}
