// A short line under the greeting - rotates once a day, same for everyone
// who opens the app that day. Mixes scripture with grounded, non-cheesy
// quotes to match the Faith habits and goals already in the app.
const QUOTES = [
  "“She is clothed with strength and dignity, and she laughs without fear of the future.” — Proverbs 31:25",
  "Discipline is choosing between what you want now and what you want most.",
  "“Commit to the Lord whatever you do, and he will establish your plans.” — Proverbs 16:3",
  "Small, steady steps beat big plans you never start.",
  "“Be strong and courageous. Do not be afraid; do not be discouraged.” — Joshua 1:9",
  "You don't need a perfect day. You need a next right step.",
  "“She sets about her work vigorously; her arms are strong for her tasks.” — Proverbs 31:17",
  "Progress, not perfection.",
  "“Cast all your anxiety on him because he cares for you.” — 1 Peter 5:7",
  "Done is better than perfect.",
  "“The Lord will fight for you; you need only to be still.” — Exodus 14:14",
  "One thing at a time, done well.",
  "“Trust in the Lord with all your heart and lean not on your own understanding.” — Proverbs 3:5",
  "Rest is productive too.",
  "“She opens her arms to the poor and extends her hands to the needy.” — Proverbs 31:20",
  "Today doesn't need to be perfect. It just needs your attention.",
  "“For I know the plans I have for you, plans to prosper you.” — Jeremiah 29:11",
  "You are allowed to go at your own pace.",
  "“Let all that you do be done in love.” — 1 Corinthians 16:14",
  "The days are long, but the years are short - make this one count.",
  "“She speaks with wisdom, and faithful instruction is on her tongue.” — Proverbs 31:26",
  "Momentum starts with one small win.",
  "“Give thanks in all circumstances.” — 1 Thessalonians 5:18",
  "You don't have to see the whole staircase, just the next step.",
  "“She is not afraid for her household; she is clothed in fine linen and purple.” — Proverbs 31:21-22",
  "What gets scheduled gets done.",
  "“Be joyful in hope, patient in affliction, faithful in prayer.” — Romans 12:12",
  "Consistency beats intensity.",
];

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function quoteForToday(d: Date = new Date()): string {
  return QUOTES[dayOfYear(d) % QUOTES.length];
}
