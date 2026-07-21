import { DashboardData, quarterDataFor } from "./types";
import { quarterKeyFor } from "./quarter";
import { computeWeekRecap, todayHabitProgress } from "./frontpage";
import { blocksForDate } from "./planner";
import { dailyProgress as glowUpDailyProgress } from "./glowup";
import { zoneForDate, completedTaskIds } from "./home";
import { dateKey } from "./date";
import { todayRhythm } from "./rhythm";
import { moneyTotals } from "./boardmeeting";
import { formatMoney } from "./finance";
import { daysUntilDecember8 } from "./warroom";
import { upcomingAppointments } from "./health";
import { daysUntilWedding } from "./wedding";
import { upcomingTrips } from "./trips";

export type LifePocketTile = {
  key: string;
  icon: string;
  label: string;
  stat: string;
};

// One tile per Life pocket, each with a real, live-computed stat - no
// stored "summary" data, everything here is derived fresh from the same
// records each pocket's own view reads.
export function lifePocketTiles(data: DashboardData, now: Date = new Date()): LifePocketTile[] {
  const recap = computeWeekRecap(data, now);
  const habitProgress = todayHabitProgress(data.habits, now);
  const quarterGoals = quarterDataFor(data.lifeQuarterly, quarterKeyFor(now)).goals;
  const quarterDone = quarterGoals.filter((g) => g.done).length;
  const groceryOpen = data.lists.grocery.items.filter((i) => !i.done).length;
  const rhythm = todayRhythm(data.rhythm, data.lifeQuarterly.paydayChecklist.anchorDate, now);
  const glowUp = glowUpDailyProgress(data.glowUp, now);
  const zone = zoneForDate(data.homeZones, now);
  const zoneDone = zone ? completedTaskIds(data.homeZones, dateKey(now), zone.id).length : 0;
  const money = moneyTotals(data.lifeQuarterly.money);
  const bucketDone = data.bucketList.items.filter((i) => i.done).length;
  const yearGoalsDone = data.year.goals.filter((g) => g.done).length;
  const weddingDays = daysUntilWedding(data.wedding, now);
  const tripsPlanned = upcomingTrips(data.trips.trips, now).length;
  const healthUpcoming = upcomingAppointments(data.health.appointments, now).length;

  return [
    { key: "tasks", icon: "📋", label: "Tasks", stat: `${data.life.tasks.filter((t) => !t.done).length} open` },
    { key: "week", icon: "🗓️", label: "This Week", stat: `${recap.tasksDone}/${recap.tasksTotal} tasks` },
    { key: "planner", icon: "🕰️", label: "Planner", stat: `${blocksForDate(data.planner, now).length} blocks today` },
    { key: "rituals", icon: "🕯️", label: "Rituals", stat: `${habitProgress.pct}% habits today` },
    { key: "money", icon: "💰", label: "Money", stat: `${formatMoney(money.vaultTotal)} saved` },
    { key: "quarter", icon: "🎯", label: "Quarter", stat: `${quarterDone}/${quarterGoals.length} goals` },
    { key: "lists", icon: "🛒", label: "Lists", stat: `${groceryOpen} to grab` },
    { key: "rhythm", icon: "🌊", label: "Rhythm", stat: `${rhythm.done}/${rhythm.total} today` },
    { key: "glowUp", icon: "✨", label: "Glow Up", stat: `${glowUp.done}/${glowUp.total} today` },
    { key: "home", icon: "🏡", label: "Home", stat: zone ? `${zoneDone}/${zone.tasks.length} zone tasks` : "Rest day" },
    {
      key: "books",
      icon: "📚",
      label: "Books",
      stat: data.books.currentlyReading ? "Currently reading" : `${data.books.read.length} finished`,
    },
    { key: "bucketList", icon: "🌟", label: "Bucket List", stat: `${bucketDone}/${data.bucketList.items.length} done` },
    { key: "year", icon: "📖", label: "Year", stat: `${yearGoalsDone}/${data.year.goals.length} goals` },
    { key: "dec8", icon: "🎆", label: "Dec 8", stat: `${daysUntilDecember8(now)} days` },
    { key: "verses", icon: "✝️", label: "Verses", stat: "New each day" },
    { key: "assistant", icon: "💬", label: "Assistant", stat: `${data.assistant.messages.length} messages` },
    { key: "memos", icon: "📝", label: "Memos", stat: `${Object.keys(data.memos.entries).length} weeks written` },
    { key: "health", icon: "➕", label: "Health", stat: `${healthUpcoming} upcoming` },
    { key: "wedding", icon: "💍", label: "Wedding", stat: weddingDays !== null ? `${weddingDays} days to go` : "Not set" },
    { key: "trips", icon: "✈️", label: "Trips", stat: `${tripsPlanned} planned` },
  ];
}
