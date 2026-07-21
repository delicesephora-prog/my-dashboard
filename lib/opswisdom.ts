// Two curated content banks shown on the Work Shutdown screen - one pick
// per day, deterministic, same pattern as verses/vocab/fact in welcome.ts.
// Hand-written rather than generated so nothing inaccurate or generic ever
// shows up; extend these lists directly when you want more variety.

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function pickForDate<T>(bank: T[], d: Date, offset: number): T {
  const index = ((dayOfYear(d) + offset) % bank.length + bank.length) % bank.length;
  return bank[index];
}

// ---------------------------------------------------------------------------
// Ops Tip of the Day - practical habits for running operations well.

export type OpsTip = { id: string; tip: string };

export const OPS_TIP_BANK: OpsTip[] = [
  { id: "ot1", tip: "Touch it once: if an email takes under two minutes to answer, answer it now instead of flagging it for later." },
  { id: "ot2", tip: "Before a meeting, write down what \"done\" looks like for it - one sentence. If you can't, it may not need to happen." },
  { id: "ot3", tip: "End every status update with a clear ask, not just information. \"FYI\" rarely moves anything forward." },
  { id: "ot4", tip: "Batch your inbox into two or three set windows a day instead of reacting to every notification as it lands." },
  { id: "ot5", tip: "When you say yes to something new, name out loud what it's displacing. Capacity is finite even when the calendar looks open." },
  { id: "ot6", tip: "Keep a running \"parking lot\" for good ideas that aren't this week's priority - it's easier to let go of something you know is saved." },
  { id: "ot7", tip: "Send meeting notes within an hour, while the room still remembers what was actually decided." },
  { id: "ot8", tip: "For any recurring task, ask once a quarter: does this still need a human, or could a template or rule handle it?" },
  { id: "ot9", tip: "When a vendor misses a deadline, ask what changed on their end before assuming it's carelessness - the fix is usually different." },
  { id: "ot10", tip: "Color-code or label by urgency, not by project - it's faster to scan \"what's on fire\" than \"what's Project X.\"" },
  { id: "ot11", tip: "Confirm logistics (time, location, dial-in) the day before any meeting that involves someone outside your building." },
  { id: "ot12", tip: "Write instructions assuming the reader is tired and in a hurry - numbered steps beat paragraphs every time." },
  { id: "ot13", tip: "If you've explained the same thing three times, it's time to write it down once and point people to it." },
  { id: "ot14", tip: "Protect one recurring block a week for the important-but-not-urgent work that always loses to the inbox." },
  { id: "ot15", tip: "When you're waiting on someone, put a date on it - \"following up\" without a deadline quietly becomes never." },
  { id: "ot16", tip: "Read the room before you read the agenda - a tense meeting needs a different opening than a routine one." },
  { id: "ot17", tip: "Keep a short list of the questions you always forget to ask new vendors. Check it every time, not just when you remember." },
  { id: "ot18", tip: "A good handoff includes not just what's done, but what almost went wrong - that context saves the next person real time." },
  { id: "ot19", tip: "Say the hard thing earlier, not later. A two-line heads-up beats a surprise every time." },
  { id: "ot20", tip: "Build in a five-minute buffer between meetings - the work of transitioning well is real work, not slack." },
  { id: "ot21", tip: "When a process breaks twice, fix the process - the second time is rarely a coincidence." },
  { id: "ot22", tip: "Keep your own \"if I get hit by a bus\" doc for your core responsibilities. Update it monthly, not just when asked." },
  { id: "ot23", tip: "Ask \"who else needs to know this?\" before you close out a task, not after someone finds out the hard way." },
  { id: "ot24", tip: "A calendar invite with no agenda is a request for someone's time with no return promised. Add the agenda line." },
  { id: "ot25", tip: "When priorities conflict, go back to whoever set them and ask them to choose - don't silently guess and hope." },
];

export function opsTipForDate(d: Date): OpsTip {
  return pickForDate(OPS_TIP_BANK, d, 0);
}

// ---------------------------------------------------------------------------
// Lesson of the Day - reflective, tied to planning tomorrow well.

export type CareerLesson = { id: string; lesson: string };

export const CAREER_LESSON_BANK: CareerLesson[] = [
  { id: "cl1", lesson: "The work that felt hardest today is usually the work that taught you the most. Note what it was before you plan tomorrow." },
  { id: "cl2", lesson: "Being reliable is a bigger career asset than being impressive. Tomorrow, pick one small promise and keep it exactly." },
  { id: "cl3", lesson: "You don't have to have the answer immediately - \"let me find out and get back to you\" is a complete, professional response." },
  { id: "cl4", lesson: "Notice who you went to for help today. That's often a sign of where your real trust and gaps both are." },
  { id: "cl5", lesson: "A calm no protects your credibility more than a stressed yes ever will. Plan tomorrow with real capacity, not hoped-for capacity." },
  { id: "cl6", lesson: "The best operators aren't the busiest - they're the ones whose systems make the work look easy. Simplify one thing tomorrow." },
  { id: "cl7", lesson: "Every interruption today taught you something about what your role actually is versus what the job description says." },
  { id: "cl8", lesson: "Asking a clarifying question early is never a weakness - it's cheaper than redoing the work later." },
  { id: "cl9", lesson: "Growth rarely feels like confidence in the moment. It usually feels like doing the uncomfortable thing anyway." },
  { id: "cl10", lesson: "Pick tomorrow's One Thing based on impact, not on what's loudest in your inbox right now." },
  { id: "cl11", lesson: "The way you handle a bad day is more visible to others than the way you handle a good one. That's not pressure - it's information." },
  { id: "cl12", lesson: "If something felt unfair today, write down the facts while they're fresh, not the feelings. You'll want the facts later." },
  { id: "cl13", lesson: "Delegating isn't giving up control - it's an investment that pays back every time after the first." },
  { id: "cl14", lesson: "The meeting that ran long today probably needed a clearer purpose, not more time. Build tomorrow's around one." },
  { id: "cl15", lesson: "You are allowed to be proud of a day that was simply steady. Not every day has to be a breakthrough." },
  { id: "cl16", lesson: "When you notice yourself avoiding a task, that's usually the one worth doing first tomorrow." },
  { id: "cl17", lesson: "Good judgment is built from small decisions made honestly, not from one big dramatic moment of clarity." },
  { id: "cl18", lesson: "The most senior thing you can do is make someone else's job easier. Look for one chance to do that tomorrow." },
  { id: "cl19", lesson: "If today felt scattered, tomorrow doesn't need more hours - it needs fewer, clearer priorities." },
  { id: "cl20", lesson: "Feedback that stung today is worth a second read tomorrow, once it doesn't sting as much." },
  { id: "cl21", lesson: "Momentum comes from finishing things, not starting them. Close one loop tomorrow before opening a new one." },
  { id: "cl22", lesson: "The person who explains the plan clearly is trusted more than the person who works the hardest silently." },
  { id: "cl23", lesson: "Rest isn't a reward you earn after the list is empty - the list is never empty. Take it anyway." },
  { id: "cl24", lesson: "Whatever felt out of your control today, tomorrow just needs one small thing that is fully in your control, done well." },
  { id: "cl25", lesson: "You're allowed to change your mind about a decision as new information comes in. That's judgment, not inconsistency." },
];

export function careerLessonForDate(d: Date): CareerLesson {
  return pickForDate(CAREER_LESSON_BANK, d, 7);
}
