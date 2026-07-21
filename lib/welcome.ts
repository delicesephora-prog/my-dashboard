import { dateKey } from "./date";

// ---------------------------------------------------------------------------
// The welcome screen: shown once per time-of-day (morning/afternoon/evening),
// never on every single open. Content (verse, vocab, fact) comes from small
// hand-curated banks below, not generated live - that's the only way to
// guarantee nothing inaccurate ever shows up. Same pattern should be used
// for any future "one per day" content (quest bank, adventure bank, etc.).

export type DayPart = "morning" | "afternoon" | "evening";

// Mirrors greetingForHour's boundaries in lib/date.ts, so the welcome
// screen's day-part always matches the greeting text the user actually sees.
export function dayPartForDate(d: Date): DayPart {
  const hour = d.getHours();
  if (hour < 5) return "evening";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

// Deterministic "one per day" pick - the same day always lands on the same
// bank entry, on any device, without needing to store which one was shown.
function pickForDate<T>(bank: T[], d: Date): T {
  const index = ((dayOfYear(d) % bank.length) + bank.length) % bank.length;
  return bank[index];
}

export type WelcomeData = {
  // "" until first shown. Format: "YYYY-MM-DD-<daypart>".
  lastShownKey: string;
};

export function emptyWelcomeData(): WelcomeData {
  return { lastShownKey: "" };
}

export function normalizeWelcomeData(partial: Partial<WelcomeData> | null | undefined): WelcomeData {
  return { lastShownKey: partial?.lastShownKey ?? "" };
}

export function welcomeKeyFor(d: Date): string {
  return `${dateKey(d)}-${dayPartForDate(d)}`;
}

export function shouldShowWelcome(data: WelcomeData, d: Date): boolean {
  return data.lastShownKey !== welcomeKeyFor(d);
}

export function markWelcomeShown(data: WelcomeData, d: Date): WelcomeData {
  return { ...data, lastShownKey: welcomeKeyFor(d) };
}

// ---------------------------------------------------------------------------
// Verse bank - 40 verses, one assigned per day of the year (wraps after
// 40 days). Wording follows common ESV/NIV-style phrasing for well-known
// verses. Encouragement lines are original, not scripture.

export type VerseEntry = {
  id: string;
  verse: string;
  reference: string;
  encouragement: string;
};

export const VERSE_BANK: VerseEntry[] = [
  { id: "v1", verse: "She is clothed with strength and dignity; she can laugh at the days to come.", reference: "Proverbs 31:25", encouragement: "Strength doesn't mean having it all figured out. It means showing up steady, again." },
  { id: "v2", verse: "I can do all things through him who strengthens me.", reference: "Philippians 4:13", encouragement: "Whatever's on today's list, you're not carrying it alone." },
  { id: "v3", verse: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.", reference: "Jeremiah 29:11", encouragement: "The waiting seasons are still part of the plan, not a pause from it." },
  { id: "v4", verse: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles.", reference: "Isaiah 40:31", encouragement: "Rest isn't falling behind. It's how you get strength back." },
  { id: "v5", verse: "Be still, and know that I am God.", reference: "Psalm 46:10", encouragement: "One quiet minute before the day speeds up is never wasted." },
  { id: "v6", verse: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.", reference: "Proverbs 3:5-6", encouragement: "You don't need the whole path lit up - just the next step." },
  { id: "v7", verse: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.", reference: "Joshua 1:9", encouragement: "Courage isn't the absence of nerves. It's moving anyway." },
  { id: "v8", verse: "The LORD is my shepherd; I shall not want.", reference: "Psalm 23:1", encouragement: "Enough is a real place to stand, not just a hope." },
  { id: "v9", verse: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", reference: "Romans 8:28", encouragement: "Even the detour days are being worked into something." },
  { id: "v10", verse: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.", reference: "Philippians 4:6-7", encouragement: "Naming the worry out loud is already the first step out of it." },
  { id: "v11", verse: "This is the day that the LORD has made; let us rejoice and be glad in it.", reference: "Psalm 118:24", encouragement: "Today doesn't have to be remarkable to be worth being glad in." },
  { id: "v12", verse: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.", reference: "Matthew 6:33", encouragement: "Put first things first and watch how much else falls into place." },
  { id: "v13", verse: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.", reference: "2 Corinthians 5:17", encouragement: "You're allowed to be someone new today, not just the version from yesterday." },
  { id: "v14", verse: "The LORD is my light and my salvation; whom shall I fear?", reference: "Psalm 27:1", encouragement: "Whatever felt big at 2am usually shrinks in daylight." },
  { id: "v15", verse: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.", reference: "Lamentations 3:22-23", encouragement: "You don't have to carry yesterday's mess into today. It's already new." },
  { id: "v16", verse: "Commit your work to the LORD, and your plans will be established.", reference: "Proverbs 16:3", encouragement: "Plan well, then hold the plan loosely - it's allowed to be a partnership." },
  { id: "v17", verse: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.", reference: "Galatians 6:9", encouragement: "The unglamorous, repeated effort is exactly what's building the result." },
  { id: "v18", verse: "Delight yourself in the LORD, and he will give you the desires of your heart.", reference: "Psalm 37:4", encouragement: "The wants you keep circling back to might matter more than you think." },
  { id: "v19", verse: "Casting all your anxieties on him, because he cares for you.", reference: "1 Peter 5:7", encouragement: "You weren't meant to hold all of it by yourself." },
  { id: "v20", verse: "The joy of the LORD is your strength.", reference: "Nehemiah 8:10", encouragement: "Let a little joy in today - it's not a distraction from the work, it fuels it." },
  { id: "v21", verse: "Whatever you do, work heartily, as for the Lord and not for men.", reference: "Colossians 3:23", encouragement: "Even the unseen tasks today count as real work, done well." },
  { id: "v22", verse: "Oh, taste and see that the LORD is good! Blessed is the man who takes refuge in him!", reference: "Psalm 34:8", encouragement: "Good things are still worth noticing, even mid-chaos." },
  { id: "v23", verse: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28", encouragement: "Tired is not the same as failing. It's a sign to rest, not push harder." },
  { id: "v24", verse: "I praise you, for I am fearfully and wonderfully made.", reference: "Psalm 139:14", encouragement: "The body and mind carrying you through today were made with intention." },
  { id: "v25", verse: "Do not be conformed to this world, but be transformed by the renewal of your mind.", reference: "Romans 12:2", encouragement: "You get to choose what voice you listen to loudest today." },
  { id: "v26", verse: "She dresses herself with strength and makes her arms strong.", reference: "Proverbs 31:17", encouragement: "Strength is built in ordinary moments, not just the big ones." },
  { id: "v27", verse: "So teach us to number our days that we may get a heart of wisdom.", reference: "Psalm 90:12", encouragement: "This day is not a rehearsal - it's one of the real ones." },
  { id: "v28", verse: "GOD, the Lord, is my strength; he makes my feet like the deer's; he makes me tread on my high places.", reference: "Habakkuk 3:19", encouragement: "Sure footing matters more than speed. Take the steady step." },
  { id: "v29", verse: "For God gave us a spirit not of fear but of power and love and self-control.", reference: "2 Timothy 1:7", encouragement: "The nerves are real, but they don't get the final word today." },
  { id: "v30", verse: "You make known to me the path of life; in your presence there is fullness of joy.", reference: "Psalm 16:11", encouragement: "Joy and a full schedule can coexist. Let yourself have both." },
  { id: "v31", verse: "Give her of the fruit of her hands, and let her works praise her in the gates.", reference: "Proverbs 31:31", encouragement: "The work you've been quietly doing is allowed to be seen and celebrated." },
  { id: "v32", verse: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.", reference: "Isaiah 41:10", encouragement: "You're not doing today solo, even on the days it feels that way." },
  { id: "v33", verse: "Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness.", reference: "James 1:2-4", encouragement: "The hard weeks are quietly building something sturdier in you." },
  { id: "v34", verse: "I lift up my eyes to the hills. From where does my help come? My help comes from the LORD, who made heaven and earth.", reference: "Psalm 121:1-2", encouragement: "It's okay to look up and ask for help before you're out of options." },
  { id: "v35", verse: "If you lie down, you will not be afraid; when you lie down, your sleep will be sweet.", reference: "Proverbs 3:24", encouragement: "Tonight's rest is earned just by showing up for today, not by finishing everything." },
  { id: "v36", verse: "For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.", reference: "Ephesians 2:10", encouragement: "You weren't an afterthought in today's plans. You were the point." },
  { id: "v37", verse: "Let me hear in the morning of your steadfast love, for in you I trust. Make me know the way I should go.", reference: "Psalm 143:8", encouragement: "Starting the day steady is worth more than starting it fast." },
  { id: "v38", verse: "Let all that you do be done in love.", reference: "1 Corinthians 16:14", encouragement: "Even the small, unnoticed tasks land differently when done with care." },
  { id: "v39", verse: "The LORD your God is in your midst, a mighty one who will save; he will rejoice over you with gladness; he will quiet you by his love; he will exult over you with loud singing.", reference: "Zephaniah 3:17", encouragement: "Someone is genuinely glad you're here today. Start from that." },
  { id: "v40", verse: "Cast your burden on the LORD, and he will sustain you; he will never permit the righteous to be moved.", reference: "Psalm 55:22", encouragement: "Whatever's heavy on the list today, you're allowed to set some of it down." },
];

export function verseForDate(d: Date): VerseEntry {
  return pickForDate(VERSE_BANK, d);
}

// ---------------------------------------------------------------------------
// Vocab of the Day - standard dictionary words, paraphrased definitions.

export type VocabEntry = {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
};

export const VOCAB_BANK: VocabEntry[] = [
  { id: "vo1", word: "Ineffable", partOfSpeech: "adjective", definition: "Too great or extreme to be put into words." },
  { id: "vo2", word: "Serendipity", partOfSpeech: "noun", definition: "The knack of finding something good without looking for it." },
  { id: "vo3", word: "Ephemeral", partOfSpeech: "adjective", definition: "Lasting for a very short time." },
  { id: "vo4", word: "Resilience", partOfSpeech: "noun", definition: "The capacity to recover quickly from difficulty." },
  { id: "vo5", word: "Luminous", partOfSpeech: "adjective", definition: "Full of light; glowing or bright." },
  { id: "vo6", word: "Equanimity", partOfSpeech: "noun", definition: "Calm composure, especially under pressure." },
  { id: "vo7", word: "Verve", partOfSpeech: "noun", definition: "Vigor, spirit, and enthusiasm." },
  { id: "vo8", word: "Halcyon", partOfSpeech: "adjective", definition: "Denoting a past time that was idyllically happy and peaceful." },
  { id: "vo9", word: "Wanderlust", partOfSpeech: "noun", definition: "A strong, innate desire to travel." },
  { id: "vo10", word: "Gratitude", partOfSpeech: "noun", definition: "The quality of being thankful." },
  { id: "vo11", word: "Diligence", partOfSpeech: "noun", definition: "Careful and persistent effort." },
  { id: "vo12", word: "Fortitude", partOfSpeech: "noun", definition: "Courage in facing pain or adversity." },
  { id: "vo13", word: "Aplomb", partOfSpeech: "noun", definition: "Self-assured confidence, especially under pressure." },
  { id: "vo14", word: "Zenith", partOfSpeech: "noun", definition: "The highest point; the peak of success." },
  { id: "vo15", word: "Tenacity", partOfSpeech: "noun", definition: "The quality of being persistent and determined." },
  { id: "vo16", word: "Sanguine", partOfSpeech: "adjective", definition: "Optimistic, especially in a difficult situation." },
  { id: "vo17", word: "Cadence", partOfSpeech: "noun", definition: "A rhythmic flow or sequence." },
  { id: "vo18", word: "Solace", partOfSpeech: "noun", definition: "Comfort in a time of distress." },
  { id: "vo19", word: "Meticulous", partOfSpeech: "adjective", definition: "Showing great, careful attention to detail." },
  { id: "vo20", word: "Effervescent", partOfSpeech: "adjective", definition: "Vivacious, bubbly, and full of enthusiasm." },
  { id: "vo21", word: "Reverie", partOfSpeech: "noun", definition: "A pleasant state of being lost in thought; a daydream." },
  { id: "vo22", word: "Stalwart", partOfSpeech: "adjective", definition: "Loyal, reliable, and hardworking." },
  { id: "vo23", word: "Panache", partOfSpeech: "noun", definition: "Flamboyant confidence of style." },
  { id: "vo24", word: "Discernment", partOfSpeech: "noun", definition: "The ability to judge well." },
  { id: "vo25", word: "Fastidious", partOfSpeech: "adjective", definition: "Very attentive to accuracy and detail." },
  { id: "vo26", word: "Convivial", partOfSpeech: "adjective", definition: "Friendly, lively, and warm." },
  { id: "vo27", word: "Perseverance", partOfSpeech: "noun", definition: "Steady persistence despite difficulty." },
  { id: "vo28", word: "Effulgent", partOfSpeech: "adjective", definition: "Shining brightly; radiant." },
  { id: "vo29", word: "Grace", partOfSpeech: "noun", definition: "Simple elegance or refinement of movement." },
  { id: "vo30", word: "Buoyant", partOfSpeech: "adjective", definition: "Cheerful and optimistic; able to stay positive." },
];

export function vocabForDate(d: Date): VocabEntry {
  return pickForDate(VOCAB_BANK, d);
}

// ---------------------------------------------------------------------------
// Fact of the Day - evergreen, verifiable facts (not live news - see the
// Front Page copy for why "news of the day" needs a separate, real source).

export type FactEntry = { id: string; fact: string };

export const FACT_BANK: FactEntry[] = [
  { id: "f1", fact: "Honey never spoils - 3,000-year-old honey found in Egyptian tombs was still edible." },
  { id: "f2", fact: "Octopuses have three hearts and blue, copper-based blood." },
  { id: "f3", fact: "A day on Venus is longer than its year - it rotates slower than it orbits the sun." },
  { id: "f4", fact: "Bananas are botanically classified as berries. Strawberries, technically, are not." },
  { id: "f5", fact: "Sharks predate trees by roughly 50 million years." },
  { id: "f6", fact: "The shortest war on record lasted about 38 minutes (the Anglo-Zanzibar War, 1896)." },
  { id: "f7", fact: "A group of flamingos is called a \"flamboyance.\"" },
  { id: "f8", fact: "The human nose can distinguish over a trillion distinct scents." },
  { id: "f9", fact: "Wombat droppings are cube-shaped, which keeps them from rolling away." },
  { id: "f10", fact: "There are more possible chess games than atoms in the observable universe." },
  { id: "f11", fact: "Butterflies taste with sensors on their feet." },
  { id: "f12", fact: "The Great Wall of China is not actually visible from space with the naked eye - a persistent myth." },
  { id: "f13", fact: "Oxford University predates the founding of the Aztec Empire." },
  { id: "f14", fact: "A bolt of lightning is roughly five times hotter than the surface of the sun." },
  { id: "f15", fact: "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid of Giza." },
  { id: "f16", fact: "Polar bears have black skin underneath their white fur." },
  { id: "f17", fact: "Scotland's official national animal is the unicorn." },
  { id: "f18", fact: "Venus, not Mercury, is the hottest planet in the solar system, thanks to its thick atmosphere." },
  { id: "f19", fact: "A single cumulus cloud can weigh over a million pounds." },
  { id: "f20", fact: "Koala fingerprints are so similar to human ones they've occasionally confused crime scenes." },
  { id: "f21", fact: "Fredric Baur, inventor of the Pringles can, was buried in one at his request." },
  { id: "f22", fact: "Astronauts have described the smell of space as similar to seared steak or hot metal." },
  { id: "f23", fact: "The dot above a lowercase \"i\" or \"j\" has a name: a tittle." },
  { id: "f24", fact: "Antarctica, not the Sahara, is technically the largest desert in the world." },
  { id: "f25", fact: "A species of jellyfish, Turritopsis dohrnii, can revert to an earlier life stage and is considered biologically immortal." },
  { id: "f26", fact: "Honeybees can recognize individual human faces." },
  { id: "f27", fact: "The Eiffel Tower grows a few inches taller in summer as the iron expands in the heat." },
  { id: "f28", fact: "Atmospheric models suggest it may rain diamonds on Neptune and Uranus." },
  { id: "f29", fact: "Some cats can develop allergic reactions to specific humans, just as humans can to cats." },
  { id: "f30", fact: "A \"jiffy\" is an actual unit of time in physics: 1/100th of a second." },
];

export function factForDate(d: Date): FactEntry {
  return pickForDate(FACT_BANK, d);
}
