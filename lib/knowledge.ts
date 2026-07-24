import { dateKey, todayKey, shiftDateKey } from "./date";

// ---------------------------------------------------------------------------
// Core content

export type TwoLayerBlock = {
  id: string;
  heading: string;
  realWords: string;
  plainEnglish: string;
};

export type Subject = {
  id: string;
  name: string;
  pitch: string;
  blocks: TwoLayerBlock[];
  createdAt: string;
  // Highest mastery level already celebrated for this subject, so a
  // level-up only fires its confetti moment once - not on every re-render
  // that happens to land above the same threshold.
  celebratedLevel: MasteryLevel | null;
};

export function newTwoLayerBlock(heading: string, realWords: string, plainEnglish: string): TwoLayerBlock {
  return { id: crypto.randomUUID(), heading, realWords, plainEnglish };
}

export function newSubject(name: string, pitch: string, blocks: TwoLayerBlock[], now: Date = new Date()): Subject {
  return { id: crypto.randomUUID(), name, pitch, blocks, createdAt: now.toISOString(), celebratedLevel: null };
}

// ---------------------------------------------------------------------------
// Flashcards + spaced repetition (lightweight SM-2 style)

export type CardType = "multiple_choice" | "fill_blank" | "true_false" | "explain";

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  multiple_choice: "Multiple Choice",
  fill_blank: "Fill in the Term",
  true_false: "True / False",
  explain: "Explain It",
};

export type Flashcard = {
  id: string;
  subjectId: string;
  sourceBlockId: string | null;
  type: CardType;
  prompt: string;
  answer: string;
  choices: string[]; // only populated for multiple_choice
  interval: number; // days
  dueDate: string; // YYYY-MM-DD
  easeFactor: number;
  reviewCount: number;
  correctCount: number;
  lastResult: "correct" | "incorrect" | null;
  createdAt: string;
};

export function newFlashcard(
  subjectId: string,
  type: CardType,
  prompt: string,
  answer: string,
  choices: string[] = [],
  sourceBlockId: string | null = null,
  now: Date = new Date()
): Flashcard {
  return {
    id: crypto.randomUUID(),
    subjectId,
    sourceBlockId,
    type,
    prompt,
    answer,
    choices,
    interval: 0,
    dueDate: todayKey(now),
    easeFactor: 2.5,
    reviewCount: 0,
    correctCount: 0,
    lastResult: null,
    createdAt: now.toISOString(),
  };
}

// On a correct answer the interval grows (ease-weighted); on a miss it
// resets to "due again today" - the literal "missed cards return sooner"
// behavior - and the ease factor eases off a little so it comes up more
// often going forward too.
export function answerCard(cards: Flashcard[], cardId: string, correct: boolean, now: Date = new Date()): Flashcard[] {
  return cards.map((c) => {
    if (c.id !== cardId) return c;
    const reviewCount = c.reviewCount + 1;
    if (correct) {
      const easeFactor = Math.min(3, c.easeFactor + 0.1);
      const interval = c.reviewCount === 0 ? 1 : c.reviewCount === 1 ? 3 : Math.round(Math.max(1, c.interval) * easeFactor);
      return {
        ...c,
        reviewCount,
        correctCount: c.correctCount + 1,
        easeFactor,
        interval,
        dueDate: shiftDateKey(todayKey(now), interval),
        lastResult: "correct" as const,
      };
    }
    const easeFactor = Math.max(1.3, c.easeFactor - 0.2);
    return { ...c, reviewCount, easeFactor, interval: 0, dueDate: todayKey(now), lastResult: "incorrect" as const };
  });
}

export function dueCardsForSubject(cards: Flashcard[], subjectId: string, now: Date = new Date(), limit = 10): Flashcard[] {
  const today = todayKey(now);
  return cards
    .filter((c) => c.subjectId === subjectId && c.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function dueCardsAcrossSubjects(cards: Flashcard[], now: Date = new Date(), limit = 5): Flashcard[] {
  const today = todayKey(now);
  return cards
    .filter((c) => c.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// One quick question for the Front Page daily unlock - deterministic per
// day so it doesn't shuffle on refresh, and skips free-response cards
// since this needs to be answerable in a couple of taps.
export function dailyUnlockCard(data: KnowledgeData, now: Date = new Date()): Flashcard | null {
  const eligible = data.cards.filter((c) => c.type !== "explain");
  if (eligible.length === 0) return null;
  const today = todayKey(now);
  const due = eligible.filter((c) => c.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  if (due.length > 0) return due[0];
  return eligible[hashString(today) % eligible.length];
}

// ---------------------------------------------------------------------------
// Mastery

export type MasteryLevel = "novice" | "learning" | "conversant" | "fluent" | "expert";

export const MASTERY_LEVELS: MasteryLevel[] = ["novice", "learning", "conversant", "fluent", "expert"];

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  novice: "Novice",
  learning: "Learning",
  conversant: "Conversant",
  fluent: "Fluent",
  expert: "Expert",
};

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  novice: "#9C8F94",
  learning: "#B08B4F",
  conversant: "#6B7A8F",
  fluent: "#4B5A24",
  expert: "#5B2333",
};

export type MasteryInfo = { level: MasteryLevel; score: number };

// Derived, never stored directly, so it can never drift out of sync with
// the cards/tests it's computed from. Requires real practice volume
// before it lets the score run high - a couple of lucky answers on a
// brand-new subject shouldn't read as mastery.
export function computeMastery(subjectId: string, data: KnowledgeData): MasteryInfo {
  const subjectCards = data.cards.filter((c) => c.subjectId === subjectId);
  const reviewed = subjectCards.filter((c) => c.reviewCount > 0);
  if (reviewed.length === 0) return { level: "novice", score: 0 };

  const totalReviews = reviewed.reduce((s, c) => s + c.reviewCount, 0);
  const totalCorrect = reviewed.reduce((s, c) => s + c.correctCount, 0);
  const accuracyPct = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;
  const maturePct = subjectCards.length > 0 ? (subjectCards.filter((c) => c.interval >= 21).length / subjectCards.length) * 100 : 0;

  const subjectTests = data.silasTests
    .filter((t) => t.subjectId === subjectId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const silasAvg = subjectTests.length > 0 ? subjectTests.reduce((s, t) => s + t.score, 0) / subjectTests.length : 0;

  let score = accuracyPct * 0.5 + maturePct * 0.3 + silasAvg * 0.2;
  if (reviewed.length < 5) score = Math.min(score, 35);
  score = Math.round(Math.max(0, Math.min(100, score)));

  let level: MasteryLevel = "novice";
  if (score >= 90) level = "expert";
  else if (score >= 75) level = "fluent";
  else if (score >= 50) level = "conversant";
  else if (score >= 20) level = "learning";

  return { level, score };
}

// ---------------------------------------------------------------------------
// The Silas Test - weekly free-response drill

export type SilasTestAttempt = {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  prompt: string;
  response: string;
  score: number; // 0-100
  nailed: string[];
  missed: string[];
  modelAnswer: string;
};

export function silasTestsForSubject(data: KnowledgeData, subjectId: string): SilasTestAttempt[] {
  return data.silasTests.filter((t) => t.subjectId === subjectId).sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Ask Deeper - grounded tutor chat, one thread per subject

export type AskDeeperCitation = { title: string; url: string };

export type AskDeeperMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: AskDeeperCitation[];
  createdAt: string;
};

export function newAskDeeperMessage(
  role: "user" | "assistant",
  content: string,
  citations: AskDeeperCitation[] = [],
  now: Date = new Date()
): AskDeeperMessage {
  return { id: crypto.randomUUID(), role, content, citations, createdAt: now.toISOString() };
}

// ---------------------------------------------------------------------------
// Questions to Ask

export type QuestionAngle = "clinical" | "commercial" | "trial" | "competitive";

export const QUESTION_ANGLE_LABELS: Record<QuestionAngle, string> = {
  clinical: "Clinical / Scientific",
  commercial: "Commercial / Strategic",
  trial: "Trial Execution",
  competitive: "Competitive Landscape",
};

export type QuestionToAsk = {
  id: string;
  subjectId: string;
  question: string;
  angle: QuestionAngle;
  whyGood: string;
  whatYoullLearn: string;
  asked: boolean;
  answerLogged: string;
  createdAt: string;
};

export function newQuestionToAsk(
  subjectId: string,
  question: string,
  angle: QuestionAngle,
  whyGood: string,
  whatYoullLearn: string,
  now: Date = new Date()
): QuestionToAsk {
  return {
    id: crypto.randomUUID(),
    subjectId,
    question,
    angle,
    whyGood,
    whatYoullLearn,
    asked: false,
    answerLogged: "",
    createdAt: now.toISOString(),
  };
}

export function unaskedQuestions(data: KnowledgeData, subjectId?: string): QuestionToAsk[] {
  return data.questions
    .filter((q) => !q.asked && (subjectId === undefined || q.subjectId === subjectId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---------------------------------------------------------------------------
// Scholar streak (the Front Page daily-unlock question)

export type ScholarStreakData = {
  current: number;
  longest: number;
  lastCompletedDate: string; // "" if never completed
};

export function emptyScholarStreak(): ScholarStreakData {
  return { current: 0, longest: 0, lastCompletedDate: "" };
}

export function isDailyUnlockDoneToday(data: KnowledgeData, now: Date = new Date()): boolean {
  return data.scholarStreak.lastCompletedDate === todayKey(now);
}

export function completeDailyUnlock(data: KnowledgeData, now: Date = new Date()): KnowledgeData {
  const today = todayKey(now);
  if (data.scholarStreak.lastCompletedDate === today) return data;
  const yesterday = shiftDateKey(today, -1);
  const current = data.scholarStreak.lastCompletedDate === yesterday ? data.scholarStreak.current + 1 : 1;
  return {
    ...data,
    scholarStreak: { current, longest: Math.max(data.scholarStreak.longest, current), lastCompletedDate: today },
  };
}

// ---------------------------------------------------------------------------
// The two heavier in-tab study sessions (morning + night)

export type DailySessionLog = { morningDone: boolean; nightDone: boolean };

export function todaysSessionStatus(data: KnowledgeData, now: Date = new Date()): DailySessionLog {
  return data.dailyLog[todayKey(now)] ?? { morningDone: false, nightDone: false };
}

export function markSessionDone(data: KnowledgeData, now: Date = new Date()): KnowledgeData {
  const today = todayKey(now);
  const slot: "morningDone" | "nightDone" = now.getHours() < 14 ? "morningDone" : "nightDone";
  const existing = data.dailyLog[today] ?? { morningDone: false, nightDone: false };
  return { ...data, dailyLog: { ...data.dailyLog, [today]: { ...existing, [slot]: true } } };
}

// ---------------------------------------------------------------------------
// Top-level data + normalize

export type KnowledgeData = {
  subjects: Subject[];
  cards: Flashcard[];
  silasTests: SilasTestAttempt[];
  askDeeperChats: Record<string, AskDeeperMessage[]>;
  questions: QuestionToAsk[];
  scholarStreak: ScholarStreakData;
  dailyLog: Record<string, DailySessionLog>;
};

export function emptyKnowledgeData(): KnowledgeData {
  return {
    subjects: [],
    cards: [],
    silasTests: [],
    askDeeperChats: {},
    questions: [],
    scholarStreak: emptyScholarStreak(),
    dailyLog: {},
  };
}

export function normalizeKnowledgeData(partial: Partial<KnowledgeData> | null | undefined): KnowledgeData {
  const fallback = emptyKnowledgeData();
  return {
    subjects: Array.isArray(partial?.subjects) ? partial.subjects : fallback.subjects,
    cards: Array.isArray(partial?.cards) ? partial.cards : fallback.cards,
    silasTests: Array.isArray(partial?.silasTests) ? partial.silasTests : fallback.silasTests,
    askDeeperChats: partial?.askDeeperChats ?? fallback.askDeeperChats,
    questions: Array.isArray(partial?.questions) ? partial.questions : fallback.questions,
    scholarStreak: { ...fallback.scholarStreak, ...partial?.scholarStreak },
    dailyLog: partial?.dailyLog ?? fallback.dailyLog,
  };
}

// ---------------------------------------------------------------------------
// Mutations

export function addSubject(data: KnowledgeData, subject: Subject): KnowledgeData {
  return { ...data, subjects: [...data.subjects, subject] };
}

export function addBlockToSubject(data: KnowledgeData, subjectId: string, block: TwoLayerBlock): KnowledgeData {
  return {
    ...data,
    subjects: data.subjects.map((s) => (s.id === subjectId ? { ...s, blocks: [...s.blocks, block] } : s)),
  };
}

// Ask Deeper answers already come back in "The Real Words" / "In Plain
// English" format (the system prompt requires it) - this splits them back
// apart so a saved answer becomes a real two-layer block instead of
// duplicating the same text into both layers. Falls back to duplicating
// the full text if the markers aren't found for some reason.
export function parseTwoLayerAnswer(content: string): { realWords: string; plainEnglish: string } {
  const realMatch = content.match(/real words[:\s]*\n?([\s\S]*?)(?=\n\s*(in )?plain english|$)/i);
  const plainMatch = content.match(/(in )?plain english[:\s]*\n?([\s\S]*)$/i);
  const realWords = realMatch?.[1]?.trim();
  const plainEnglish = plainMatch?.[2]?.trim();
  if (realWords && plainEnglish) return { realWords, plainEnglish };
  return { realWords: content.trim(), plainEnglish: content.trim() };
}

// "Save to Subject" - folds a liked Ask Deeper answer into Core Content
// and generates one flashcard from it, so curiosity actually grows the
// knowledge base rather than just living in chat history.
export function saveAskDeeperAnswerToSubject(
  data: KnowledgeData,
  subjectId: string,
  heading: string,
  content: string,
  now: Date = new Date()
): KnowledgeData {
  const { realWords, plainEnglish } = parseTwoLayerAnswer(content);
  const block = newTwoLayerBlock(heading, realWords, plainEnglish);
  const withBlock = addBlockToSubject(data, subjectId, block);
  const card = newFlashcard(subjectId, "explain", heading, realWords, [], block.id, now);
  return addCards(withBlock, [card]);
}

export function addCards(data: KnowledgeData, cards: Flashcard[]): KnowledgeData {
  return { ...data, cards: [...data.cards, ...cards] };
}

export function addQuestions(data: KnowledgeData, questions: QuestionToAsk[]): KnowledgeData {
  return { ...data, questions: [...data.questions, ...questions] };
}

export function markQuestionAsked(data: KnowledgeData, id: string, answer: string): KnowledgeData {
  return {
    ...data,
    questions: data.questions.map((q) => (q.id === id ? { ...q, asked: true, answerLogged: answer } : q)),
  };
}

export function addSilasTest(data: KnowledgeData, attempt: SilasTestAttempt): KnowledgeData {
  return { ...data, silasTests: [attempt, ...data.silasTests] };
}

export function addAskDeeperMessage(data: KnowledgeData, subjectId: string, message: AskDeeperMessage): KnowledgeData {
  const existing = data.askDeeperChats[subjectId] ?? [];
  return { ...data, askDeeperChats: { ...data.askDeeperChats, [subjectId]: [...existing, message] } };
}

export function setCelebratedLevel(data: KnowledgeData, subjectId: string, level: MasteryLevel): KnowledgeData {
  return {
    ...data,
    subjects: data.subjects.map((s) => (s.id === subjectId ? { ...s, celebratedLevel: level } : s)),
  };
}

// ---------------------------------------------------------------------------
// Seed content - the two subjects, seeded exactly as specified.

function seedSubjects(now: Date): { subjects: Subject[]; cards: Flashcard[]; questions: QuestionToAsk[] } {
  const backbeat = newSubject(
    "BACKBEAT / AVIM Therapy",
    `AVIM therapy is a pacing algorithm inside a standard dual-chamber pacemaker that lowers blood pressure by deliberately re-timing the coordination between the heart's chambers — no new hardware, no reliance on medication. BACKBEAT is our pivotal trial testing it.`,
    [
      newTwoLayerBlock(
        "What it treats",
        `Uncontrolled hypertension in patients also indicated for a dual-chamber pacemaker. FDA Breakthrough Device Designation; ~7.7M US patients with uncontrolled hypertension despite medication.`,
        `High blood pressure that pills aren't fixing — specifically in people who already need a pacemaker. Huge market, and the FDA fast-tracked it.`
      ),
      newTwoLayerBlock(
        "How it works in the heart (THE key answer)",
        `The heart beats in two stages — the atrium (top chamber) contracts to fill the ventricle (bottom chamber), then the ventricle contracts to pump blood out. The gap between is the AV (atrioventricular) interval. AVIM delivers repeating sequences of short and longer AV intervals via dual-chamber pacing. SHORT intervals reduce ventricular filling → less preload → less pressure ejected (Frank-Starling law: a less-full heart pumps with less force). LONGER intervals modulate the autonomic nervous system, lowering total peripheral resistance (afterload) and preventing the reflex sympathetic response that would otherwise fight the drop.`,
        `Your heart fills, then squeezes. This therapy slightly mistimes those on purpose so the heart squeezes before it's totally full — less blood in means less pressure out. AND it calms the nervous system so your body doesn't panic and tighten everything back up (which is what normally undoes blood-pressure drops). That second part is the clever bit.`
      ),
      newTwoLayerBlock(
        "Why it's different",
        `Device-based, not pharmacologic. Uses standard pacemaker hardware, same implant procedure and lead positions. Works automatically without patient medication compliance.`,
        `It's not a pill and not a new gadget — it's smart software running on a pacemaker doctors already know how to implant. Works on its own; the patient doesn't have to remember anything.`
      ),
      newTwoLayerBlock(
        "Proof so far",
        `MODERATO I & II pilot studies showed statistically significant BP reductions; MODERATO II showed substantial, immediate, sustained reduction in ambulatory and office BP at 6 and 24 months. BACKBEAT (NCT06059638) is the ongoing pivotal IDE trial.`,
        `Two early studies proved it drops blood pressure and keeps it down for 2 years. BACKBEAT — the trial I support — is the big one meant to prove it for approval.`
      ),
    ],
    now
  );

  const virtue = newSubject(
    "Virtue SAB (Sirolimus AngioInfusion Balloon)",
    `Virtue is a first-of-its-kind angioplasty balloon that delivers a drug (sirolimus) deep into a diseased artery without any coating and without leaving anything behind. It treats clogged/re-narrowed arteries. Partnered with Terumo.`,
    [
      newTwoLayerBlock(
        "What it treats",
        `Atherosclerotic artery disease — leading cause of death globally. Breakthrough Device Designation for coronary in-stent restenosis (ISR), coronary small vessel disease, and below-the-knee peripheral artery disease.`,
        `Arteries that are clogged or have re-narrowed after a stent. "In-stent restenosis" = when a previously stented artery closes back up — hard to treat, and a lead target.`
      ),
      newTwoLayerBlock(
        "How it works",
        `A non-coated, microporous AngioInfusion balloon delivers a large liquid dose of a proprietary extended-release sirolimus formulation (SirolimusEFR) into the artery wall during angioplasty. Achieves sustained tissue levels above the therapeutic threshold (1 ng/mg) through the ~30-day critical healing period. Leave-nothing-behind — no permanent implant.`,
        `A tiny balloon threads into the artery and, instead of being coated in drug, has microscopic pores that push liquid medicine directly into the artery wall — then deflates and comes out, leaving nothing behind. The drug (sirolimus) keeps the artery from re-clogging during the month it's healing.`
      ),
      newTwoLayerBlock(
        "Why it's different",
        `Only non-coated drug-delivery balloon in coronary development; delivers sirolimus (the drug class on modern drug-eluting stents) vs. the paclitaxel used on most drug-coated balloons; protected delivery avoids drug loss in transit.`,
        `Competitors coat their balloons in drug, which rubs off on the way in. Virtue carries the drug as protected liquid and injects it right where needed — using the better drug class stents already use.`
      ),
      newTwoLayerBlock(
        "The business angle (investor relations)",
        `Partnered with Terumo (global medical device leader). Terumo paid $10M for a right of first refusal on coronary CAD rights plus a $20M convertible preferred investment (on top of $35M prior). Orchestra earns royalties + per-unit payments as exclusive supplier of the sirolimus formulation.`,
        `A big Japanese device company (Terumo) is paying to keep first dibs — a strong outside vote of confidence. Orchestra makes money on royalties and by being the sole supplier of the special drug.`
      ),
    ],
    now
  );

  const b = backbeat.blocks;
  const backbeatCards: Flashcard[] = [
    newFlashcard(backbeat.id, "explain", "Recite the AVIM therapy pitch, start to finish.", backbeat.pitch, [], null, now),
    newFlashcard(
      backbeat.id,
      "multiple_choice",
      "AVIM therapy is being tested in which patient population?",
      "Uncontrolled hypertension in patients also indicated for a dual-chamber pacemaker",
      [
        "Uncontrolled hypertension in patients also indicated for a dual-chamber pacemaker",
        "Type 2 diabetes",
        "Atrial fibrillation only",
        "Heart failure with reduced ejection fraction",
      ],
      b[0].id,
      now
    ),
    newFlashcard(backbeat.id, "fill_blank", "AVIM has received FDA ___ Device Designation.", "Breakthrough", [], b[0].id, now),
    newFlashcard(
      backbeat.id,
      "true_false",
      "There are roughly 7.7 million US patients with uncontrolled hypertension despite medication.",
      "True",
      [],
      b[0].id,
      now
    ),
    newFlashcard(
      backbeat.id,
      "fill_blank",
      "The gap between atrial and ventricular contraction is called the ___ interval.",
      "AV (atrioventricular)",
      [],
      b[1].id,
      now
    ),
    newFlashcard(
      backbeat.id,
      "multiple_choice",
      "SHORT AV intervals lower blood pressure mainly by...?",
      "Reducing ventricular filling (preload), per Frank-Starling law",
      [
        "Reducing ventricular filling (preload), per Frank-Starling law",
        "Increasing heart rate",
        "Blocking beta receptors",
        "Widening the QRS complex",
      ],
      b[1].id,
      now
    ),
    newFlashcard(
      backbeat.id,
      "multiple_choice",
      "LONGER AV intervals lower blood pressure by...?",
      "Modulating the autonomic nervous system to lower peripheral resistance (afterload)",
      [
        "Modulating the autonomic nervous system to lower peripheral resistance (afterload)",
        "Directly dilating the pacemaker leads",
        "Increasing preload",
        "Triggering a defibrillation shock",
      ],
      b[1].id,
      now
    ),
    newFlashcard(
      backbeat.id,
      "explain",
      "In your own words: how does AVIM lower blood pressure using two different interval lengths?",
      "Short intervals reduce how full the ventricle gets before it squeezes, so less blood is ejected with less force (Frank-Starling law). Longer intervals calm the autonomic nervous system, lowering peripheral resistance and preventing the reflex tightening that would normally fight the drop.",
      [],
      b[1].id,
      now
    ),
    newFlashcard(backbeat.id, "fill_blank", "___'s law explains why a less-full heart pumps with less force.", "Frank-Starling", [], b[1].id, now),
    newFlashcard(
      backbeat.id,
      "true_false",
      "AVIM requires implanting new hardware beyond a standard dual-chamber pacemaker.",
      "False",
      [],
      b[2].id,
      now
    ),
    newFlashcard(
      backbeat.id,
      "multiple_choice",
      "AVIM therapy is best described as...?",
      "Device-based (software on a standard pacemaker)",
      ["Device-based (software on a standard pacemaker)", "A new drug", "A surgical valve replacement", "A wearable monitor"],
      b[2].id,
      now
    ),
    newFlashcard(backbeat.id, "true_false", "AVIM depends on the patient remembering to take medication.", "False", [], b[2].id, now),
    newFlashcard(backbeat.id, "fill_blank", "The ongoing pivotal trial for AVIM therapy is called ___.", "BACKBEAT", [], b[3].id, now),
    newFlashcard(
      backbeat.id,
      "multiple_choice",
      "MODERATO II showed BP reduction sustained at...?",
      "6 and 24 months",
      ["6 and 24 months", "1 week only", "5 years", "It showed no significant reduction"],
      b[3].id,
      now
    ),
    newFlashcard(backbeat.id, "true_false", "BACKBEAT is registered as NCT06059638.", "True", [], b[3].id, now),
  ];

  const v = virtue.blocks;
  const virtueCards: Flashcard[] = [
    newFlashcard(virtue.id, "explain", "Recite the Virtue SAB pitch, start to finish.", virtue.pitch, [], null, now),
    newFlashcard(
      virtue.id,
      "multiple_choice",
      "Virtue SAB has Breakthrough Device Designation for which conditions?",
      "Coronary in-stent restenosis, small vessel disease, and below-the-knee PAD",
      [
        "Coronary in-stent restenosis, small vessel disease, and below-the-knee PAD",
        "Only atrial fibrillation",
        "Only heart failure",
        "Only aortic aneurysm",
      ],
      v[0].id,
      now
    ),
    newFlashcard(virtue.id, "fill_blank", "___ restenosis (ISR) is when a previously stented artery closes back up.", "In-stent", [], v[0].id, now),
    newFlashcard(virtue.id, "true_false", "Atherosclerotic artery disease is a leading cause of death globally.", "True", [], v[0].id, now),
    newFlashcard(
      virtue.id,
      "multiple_choice",
      "Virtue's balloon delivers drug into the artery wall using...?",
      "A non-coated, microporous surface that infuses liquid drug",
      [
        "A non-coated, microporous surface that infuses liquid drug",
        "A drug coating that rubs off on contact",
        "An implanted stent",
        "A radioactive seed",
      ],
      v[1].id,
      now
    ),
    newFlashcard(virtue.id, "fill_blank", "Virtue delivers a proprietary extended-release formulation of ___.", "sirolimus (SirolimusEFR)", [], v[1].id, now),
    newFlashcard(
      virtue.id,
      "multiple_choice",
      "The therapeutic drug level needs to stay above threshold through roughly...?",
      "The ~30-day critical healing period",
      ["The ~30-day critical healing period", "24 hours", "5 years", "6 months"],
      v[1].id,
      now
    ),
    newFlashcard(virtue.id, "true_false", "Virtue leaves a permanent implant behind in the artery.", "False", [], v[1].id, now),
    newFlashcard(
      virtue.id,
      "explain",
      "Explain in plain English how the Virtue balloon gets drug into the artery wall without a coating.",
      "It has microscopic pores instead of a drug coating - it pushes a protected liquid dose of sirolimus straight into the artery wall during the procedure, then deflates and comes out, leaving nothing behind.",
      [],
      v[1].id,
      now
    ),
    newFlashcard(
      virtue.id,
      "multiple_choice",
      "Most competing drug-coated balloons use which drug?",
      "Paclitaxel",
      ["Paclitaxel", "Sirolimus", "Insulin", "Warfarin"],
      v[2].id,
      now
    ),
    newFlashcard(virtue.id, "fill_blank", "Virtue is the only ___ drug-delivery balloon in coronary development.", "non-coated", [], v[2].id, now),
    newFlashcard(
      virtue.id,
      "multiple_choice",
      "Which company partnered with Orchestra on Virtue's coronary rights?",
      "Terumo",
      ["Terumo", "Medtronic", "Abbott", "Boston Scientific"],
      v[3].id,
      now
    ),
    newFlashcard(
      virtue.id,
      "fill_blank",
      "Terumo paid $10M for a right of first refusal plus a $___ convertible preferred investment.",
      "20M",
      [],
      v[3].id,
      now
    ),
    newFlashcard(
      virtue.id,
      "true_false",
      "Orchestra earns royalties and per-unit payments as exclusive supplier of the sirolimus formulation.",
      "True",
      [],
      v[3].id,
      now
    ),
  ];

  const backbeatQuestions: QuestionToAsk[] = [
    newQuestionToAsk(
      backbeat.id,
      "How does AVIM avoid the reflex sympathetic response that usually undoes a blood-pressure drop?",
      "clinical",
      "Shows you understand the autonomic-modulation half of the mechanism, not just the mechanical preload piece.",
      "The neurohormonal side of the therapy - the part most people miss.",
      now
    ),
    newQuestionToAsk(
      backbeat.id,
      "Who else is competing for the uncontrolled-hypertension-plus-pacemaker population, and how big is our head start?",
      "commercial",
      "Shows commercial awareness beyond the science.",
      "The competitive landscape and how much runway the FDA Breakthrough designation actually buys us.",
      now
    ),
    newQuestionToAsk(
      backbeat.id,
      "What's the primary endpoint in BACKBEAT, and at what time point does it read out?",
      "trial",
      "Shows you're tracking the trial's actual success criteria, not just the concept.",
      "What 'success' concretely means for this program and when we'll know.",
      now
    ),
    newQuestionToAsk(
      backbeat.id,
      "How does AVIM compare to renal denervation as a device-based hypertension therapy?",
      "competitive",
      "Renal denervation is the other well-known device approach to hypertension - asking this shows you're mapping the field.",
      "How physicians would weigh AVIM against the other emerging device-based option.",
      now
    ),
  ];

  const virtueQuestions: QuestionToAsk[] = [
    newQuestionToAsk(
      virtue.id,
      "Why is a 30-day drug-release window the right target for in-stent restenosis healing?",
      "clinical",
      "Shows curiosity about the biological rationale behind the number, not just memorizing it.",
      "The vascular healing timeline the whole delivery design is built around.",
      now
    ),
    newQuestionToAsk(
      virtue.id,
      "What does the Terumo relationship signal about Virtue's regulatory or reimbursement path?",
      "commercial",
      "Connects a partnership deal to real commercial strategy.",
      "How partner economics reflect confidence in specific indications.",
      now
    ),
    newQuestionToAsk(
      virtue.id,
      "What's the current enrollment stage for Virtue's Breakthrough-designated indications?",
      "trial",
      "Shows you're tracking execution, not just the pitch.",
      "Where the program actually stands today.",
      now
    ),
    newQuestionToAsk(
      virtue.id,
      "Why hasn't a non-coated liquid-delivery balloon been built before now - what was the technical barrier?",
      "competitive",
      "Shows genuine curiosity about why this is novel rather than assuming it was easy.",
      "The engineering story behind Virtue's differentiation.",
      now
    ),
  ];

  return {
    subjects: [backbeat, virtue],
    cards: [...backbeatCards, ...virtueCards],
    questions: [...backbeatQuestions, ...virtueQuestions],
  };
}

export function defaultKnowledgeData(now: Date = new Date()): KnowledgeData {
  const seed = seedSubjects(now);
  return {
    subjects: seed.subjects,
    cards: seed.cards,
    silasTests: [],
    askDeeperChats: {},
    questions: seed.questions,
    scholarStreak: emptyScholarStreak(),
    dailyLog: {},
  };
}

// ---------------------------------------------------------------------------
// AI prompt builders - the actual API calls live in app/api/knowledge/*,
// but the prompt text itself lives here so it stays next to the data it
// describes, same convention as lib/becoming.ts and lib/assistant.ts.

// Only the fields prompt-building actually needs, so API routes can pass
// what the client sends without requiring a full Subject object.
export type SubjectContent = Pick<Subject, "name" | "pitch" | "blocks">;

function subjectContentDump(subject: SubjectContent): string {
  const blocksText = subject.blocks
    .map((b) => `### ${b.heading}\nReal Words: ${b.realWords}\nPlain English: ${b.plainEnglish}`)
    .join("\n\n");
  return `Subject: ${subject.name}\n\nThe pitch: ${subject.pitch}\n\n${blocksText}`;
}

// Ask Deeper - a tutor chat grounded in the subject's own stored content,
// with web search enabled for anything current/public that isn't already
// captured there.
export function buildAskDeeperSystemPrompt(subject: SubjectContent): string {
  return `You are a sharp, encouraging tutor helping Sephora go deeper on one subject in her Knowledge tab - a personal learning system for the medical-device technologies she works with. She's building toward being able to SPEAK the real scientific/industry language fluently, using plain English to actually understand it first.

Here is everything already stored for this subject - treat it as ground truth for how SHE has learned this so far, and stay consistent with it:

${subjectContentDump(subject)}

Rules for every answer:
1. ALWAYS answer in two layers, clearly labeled: "The Real Words" (the proper scientific/industry terms, used correctly and precisely) followed by "In Plain English" (the same thing explained simply, like to a smart friend). Keep key terms visible in both layers.
2. You have a web search tool - use it for anything about published science, competitor products, or public company/deal information where being current and accurate matters. Cite what you find.
3. If a question would require internal or confidential information you don't actually have (unreleased trial data, internal financials, private strategy), say so plainly - "I don't have that - that's internal information" - rather than guessing or inventing a plausible-sounding number. Never invent numbers, dates, or figures. If you're not sure, say you're not sure.
4. Keep answers tight - a few sentences per layer, not an essay - she's building a mental model she can recite, not reading a textbook.`;
}

export function buildGoDeeperPrompt(kind: "simpler" | "deeper" | "commercial" | "meeting" | "quiz"): string {
  switch (kind) {
    case "simpler":
      return "Explain your last answer even more simply - assume less background, use a everyday analogy if it helps.";
    case "deeper":
      return "Go deeper on your last answer - more mechanism, more nuance, more of the real terminology, still in the two-layer format.";
    case "commercial":
      return "Why does what you just explained matter commercially - for the business, the market, or the competitive position? Two-layer format still applies.";
    case "meeting":
      return "How would I say what you just explained out loud in a meeting - give me a tight, confident spoken version, 2-3 sentences, using the real terminology naturally.";
    case "quiz":
      return "Quiz me on what you just explained - ask me one question about it and wait for my answer before telling me if I'm right.";
  }
}

// Structured-JSON generation - used both for "add a new subject from my
// notes" and "refresh Questions to Ask." Both prompts ask for ONLY valid
// JSON back, parsed by the calling route.

export function buildAddSubjectPrompt(name: string, rawNotes: string): string {
  return `You are helping build a study subject for Sephora's Knowledge tab - a personal learning system for medical-device technologies she works with. She's pasted her own plain-English notes on a new subject called "${name}". Turn them into her app's two-layer study format.

Her raw notes:
${rawNotes}

Reply with ONLY valid JSON (no markdown fences, no commentary), exactly this shape:
{
  "pitch": "a 2-4 sentence memorize-this pitch synthesizing what this is and why it matters, in her voice",
  "blocks": [
    { "heading": "short heading, e.g. 'What it treats' or 'How it works'", "realWords": "proper scientific/industry terms and precise language", "plainEnglish": "the same content explained simply, like to a smart friend" }
  ],
  "cards": [
    { "type": "multiple_choice" | "fill_blank" | "true_false" | "explain", "prompt": "the question", "answer": "the correct answer or key term", "choices": ["only for multiple_choice - 4 options including the correct one"] }
  ],
  "questions": [
    { "question": "an intelligent question she could ask a colleague/expert about this", "angle": "clinical" | "commercial" | "trial" | "competitive", "whyGood": "why this question shows real thinking", "whatYoullLearn": "what a strong answer would teach her" }
  ]
}
Produce 3-6 blocks covering distinct aspects (what it is/treats, how it works, why it's different, proof/status, etc - whatever fits her notes), 10-16 cards spread across the block content and card types, and 4-5 questions with a mix of angles. Base everything on her notes - don't invent facts, numbers, or claims that aren't in what she gave you or well-established general knowledge about the underlying science.`;
}

export function buildRefreshQuestionsPrompt(subject: SubjectContent, mastery: MasteryLevel): string {
  const difficultyNote =
    mastery === "novice" || mastery === "learning"
      ? "She's still early on this subject - keep questions foundational, the kind that build real understanding of the basics."
      : mastery === "conversant"
        ? "She has a working grasp of this subject now - questions can start probing tradeoffs and 'why' rather than just 'what.'"
        : "She's fluent/expert on this subject - make questions strategic and sharp, the kind that would make a colleague or exec sit up, not textbook recall.";

  return `Generate 3-5 new intelligent questions Sephora could ask about this subject in a 1:1 - the kind that show she's been thinking, not that she's lost. Mix clinical/scientific, commercial/strategic, trial-execution, and competitive-landscape angles.

${difficultyNote}

${subjectContentDump(subject)}

Reply with ONLY valid JSON (no markdown fences, no commentary), exactly this shape:
{ "questions": [ { "question": "...", "angle": "clinical" | "commercial" | "trial" | "competitive", "whyGood": "...", "whatYoullLearn": "..." } ] }
Don't repeat ideas that are obviously already covered by asking about the exact same fact twice - vary the angle and depth.`;
}

export function buildGradeSilasPrompt(subject: SubjectContent, response: string): string {
  return `Sephora just took "The Silas Test" - a 30-second free-response drill where she describes a subject and what it does, from memory, as if explaining it on the spot. Grade her response against what's actually stored for this subject.

${subjectContentDump(subject)}

Her response:
"${response}"

Reply with ONLY valid JSON (no markdown fences, no commentary), exactly this shape:
{
  "score": 0-100,
  "nailed": ["short bullet points of what she got right/well"],
  "missed": ["short bullet points of what she left out or got wrong - be specific and honest, this is how she improves"],
  "modelAnswer": "a tight, ~30-second model answer she could aim for next time, in her own two-layer spirit (real terms used naturally, still plain enough to say out loud)"
}
Grade generously for a spoken/typed-on-the-fly answer (not expecting textbook precision) but honestly - missing the actual mechanism or the pitch's core idea should cost real points.`;
}

// Re-exported for callers that only need the date helpers alongside this
// module without a second import line.
export { dateKey, todayKey };
