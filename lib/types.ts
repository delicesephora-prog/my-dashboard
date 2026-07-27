import { Department, DEPARTMENTS } from "./department";
import {
  TabUsageData,
  SystemCheckData,
  emptyTabUsageData,
  normalizeTabUsageData,
  emptySystemCheckData,
  normalizeSystemCheckData,
} from "./systemcheck";
import { AppearanceData, emptyAppearanceData, normalizeAppearanceData } from "./appearance";
import { VisionData, emptyVisionData, normalizeVisionData } from "./vision";
import { AmbianceData, emptyAmbianceData, normalizeAmbianceData } from "./ambiance";
import { RoutinesData, emptyRoutinesData, normalizeRoutinesData, applyGlowRoutineUpdate } from "./routines";
import { CadenceData, emptyCadenceData, normalizeCadenceData } from "./cadence";
import { PaydayChecklistData, emptyPaydayChecklistData, seedPaydaySteps, PAYDAY_SEED_VERSION } from "./payday";
import { WarRoomData, emptyWarRoomData, normalizeWarRoomData } from "./warroom";
import { LifeScoreData, emptyLifeScoreData, normalizeLifeScoreData } from "./lifescore";
import { BoardMeetingData, emptyBoardMeetingData, normalizeBoardMeetingData } from "./boardmeeting";
import { ListsData, emptyListsData, normalizeListsData, ensureGrocerySeedItems } from "./lists";
import { RhythmData, emptyRhythmData, normalizeRhythmData, applyRhythmAddOns } from "./rhythm";
import { GlowUpData, emptyGlowUpData, normalizeGlowUpData, applyGlowUpContentUpdate } from "./glowup";
import { TextAlertsData, emptyTextAlertsData, normalizeTextAlertsData } from "./textalerts";
import { PlannerData, emptyPlannerData, normalizePlannerData } from "./planner";
import { HomeZonesData, emptyHomeZonesData, normalizeHomeZonesData } from "./home";
import { WelcomeData, emptyWelcomeData, normalizeWelcomeData } from "./welcome";
import { DailyThemeData, defaultDailyThemeData, normalizeDailyThemeData } from "./dailytheme";
import { MealCalendarData, defaultMealCalendarData, normalizeMealCalendarData } from "./mealcalendar";
import { CookbookData, defaultCookbookData, normalizeCookbookData } from "./cookbook";
import { CherData, defaultCherData, normalizeCherData } from "./cher";
import { WaitingOnData, emptyWaitingOnData, normalizeWaitingOnData } from "./waitingon";
import { VendorsData, emptyVendorsData, normalizeVendorsData } from "./vendors";
import { WorkShutdownData, emptyWorkShutdownData, normalizeWorkShutdownData } from "./workshutdown";
import { MeetingOpsData, emptyMeetingOpsData, normalizeMeetingOpsData } from "./meetingops";
import { PrincipalsData, emptyPrincipalsData, normalizePrincipalsData } from "./principals";
import { QuestionBankData, emptyQuestionBankData, normalizeQuestionBankData } from "./questionbank";
import { TemplatesData, emptyTemplatesData, normalizeTemplatesData } from "./templates";
import { PreMortemData, emptyPreMortemData, normalizePreMortemData } from "./premortem";
import { FireDrillLogData, emptyFireDrillLogData, normalizeFireDrillLogData } from "./firedrill";
import { FridayLedgerData, emptyFridayLedgerData, normalizeFridayLedgerData } from "./fridayledger";
import { EventsData, emptyEventsData, normalizeEventsData } from "./events";
import { FocusData, emptyFocusData, normalizeFocusData } from "./focus";
import { AssistantData, emptyAssistantData, normalizeAssistantData } from "./assistant";
import { KnowledgeData, defaultKnowledgeData, normalizeKnowledgeData } from "./knowledge";
import { QuestData, emptyQuestData, normalizeQuestData } from "./quest";
import { MemosData, emptyMemosData, normalizeMemosData } from "./memos";
import { HealthData, emptyHealthData, normalizeHealthData } from "./health";
import { FinanceData, emptyFinanceData, normalizeFinanceData } from "./finance";
import { WeddingData, emptyWeddingData, normalizeWeddingData } from "./wedding";
import { TripsData, emptyTripsData, normalizeTripsData } from "./trips";
import { BudgetData, emptyBudgetData, normalizeBudgetData, ensureLinkedMoneyEntities } from "./budget";
import { MealPlanData, emptyMealPlanData, normalizeMealPlanData } from "./mealplan";
import { MilestoneData, defaultMilestoneData, normalizeMilestoneData } from "./milestones";
import { RewardsData, emptyRewardsData, normalizeRewardsData } from "./rewards";
import { RecipeBankData, defaultRecipeBankData, normalizeRecipeBankData } from "./recipes";
import { PaycheckPlanData, emptyPaycheckPlanData, normalizePaycheckPlanData } from "./paycheckplan";

export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  focus: boolean;
  createdAt: string;
};

export type WorldData = {
  tasks: TaskItem[];
  notes: string;
};

export type OneThing = {
  text: string;
  // Local date (YYYY-MM-DD) the text was written for, so a new day
  // starts with a blank card without deleting yesterday's entry.
  date: string;
};

export type WeekTask = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  // Pinned to Today's Focus on the Front Page - capped at 3, same as
  // Work's topPriority.
  focus: boolean;
};

export type WeekData = {
  tasks: WeekTask[];
  // One ISO timestamp per logged workout session this week.
  workouts: string[];
  // Always exactly 3 slots; empty strings render as unset goals.
  weeklyFocus: string[];
  reflection: string;
};

export function emptyWeekData(): WeekData {
  return { tasks: [], workouts: [], weeklyFocus: ["", "", ""], reflection: "" };
}

export type CurrentlyReading = {
  title: string;
  author: string;
};

export type LifeWeekly = {
  workoutGoal: number;
  currentlyReading: CurrentlyReading;
  // Keyed by the Monday date (YYYY-MM-DD) of each week.
  weeks: Record<string, WeekData>;
};

export function emptyLifeWeekly(): LifeWeekly {
  return {
    workoutGoal: 3,
    currentlyReading: { title: "", author: "" },
    weeks: {},
  };
}

// ---------------------------------------------------------------------------
// Work operations: tasks

export type WorkTaskStatus =
  | "not_started"
  | "started"
  | "urgent"
  | "in_progress"
  | "waiting"
  | "completed";
export type WorkTaskPriority = "high" | "medium" | "low";
// Shared with Cadence's department list (see lib/department.ts) - a task
// filed under "Finance" and a Cadence checklist item under "Finance" are
// the same category, not two lookalike strings.
export type WorkTaskCategory = Department;

export const WORK_TASK_STATUSES: { key: WorkTaskStatus; label: string }[] = [
  { key: "not_started", label: "Not Started" },
  { key: "started", label: "Started" },
  { key: "urgent", label: "Urgent" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting", label: "Waiting" },
  { key: "completed", label: "Completed" },
];

export const WORK_TASK_PRIORITIES: { key: WorkTaskPriority; label: string }[] = [
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export const WORK_TASK_CATEGORIES: WorkTaskCategory[] = DEPARTMENTS;

export type WorkTaskProgressEntry = {
  date: string; // YYYY-MM-DD
  pct: number;
};

export type WorkTask = {
  id: string;
  title: string;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  category: WorkTaskCategory;
  dueDate: string; // "" or YYYY-MM-DD
  notes: string;
  topPriority: boolean;
  createdAt: string;
  progressPct: number; // 0-100
  // Newest first - every check-in kept, never trimmed except a hard cap.
  progressLog: WorkTaskProgressEntry[];
  // "" or YYYY-MM-DD - stall nudges (the card badge, Suggested Next, the
  // Assistant) are suppressed until this date, even if the task is still
  // objectively stalled.
  stallSnoozedUntil: string;
};

export type WorkOps = {
  tasks: WorkTask[];
};

export function emptyWorkOps(): WorkOps {
  return { tasks: [] };
}

// ---------------------------------------------------------------------------
// BackBeat: clinical study hub

export type StudyOverview = {
  protocolSummary: string;
  primaryEndpoint: string;
  enrollmentStatus: string;
  importantDates: string;
};

export function emptyStudyOverview(): StudyOverview {
  return { protocolSummary: "", primaryEndpoint: "", enrollmentStatus: "", importantDates: "" };
}

export type SiteStatus = "Active" | "Pending" | "Closed";
export const SITE_STATUSES: SiteStatus[] = ["Active", "Pending", "Closed"];

export type StudySite = {
  id: string;
  name: string;
  status: SiteStatus;
  country: string;
  siteManager: string;
  enrollmentCount: number;
  notes: string;
  archived: boolean;
};

export type TranslationStageKey = "quoteRequested" | "quoteApproved" | "sent" | "received" | "uploaded";

export const TRANSLATION_STAGES: { key: TranslationStageKey; label: string }[] = [
  { key: "quoteRequested", label: "Quote Requested" },
  { key: "quoteApproved", label: "Quote Approved" },
  { key: "sent", label: "Sent" },
  { key: "received", label: "Received" },
  { key: "uploaded", label: "Uploaded" },
];

export type TranslationDoc = {
  id: string;
  documentName: string;
  vendor: string;
  language: string;
  stages: Record<TranslationStageKey, boolean>;
  notes: string;
};

export function emptyTranslationStages(): Record<TranslationStageKey, boolean> {
  return {
    quoteRequested: false,
    quoteApproved: false,
    sent: false,
    received: false,
    uploaded: false,
  };
}

export type EdcStageKey = "requested" | "approved" | "completed";

export const EDC_STAGES: { key: EdcStageKey; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" },
];

export type EdcAccessRow = {
  id: string;
  user: string;
  site: string;
  stages: Record<EdcStageKey, boolean>;
};

export function emptyEdcStages(): Record<EdcStageKey, boolean> {
  return { requested: false, approved: false, completed: false };
}

export type PaymentStatus = "Pending" | "Paid" | "Overdue";
export const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Paid", "Overdue"];

export type UberHealthRow = {
  id: string;
  site: string;
  credits: number;
  monthlyInvoice: number;
  statementReceived: boolean;
  paymentStatus: PaymentStatus;
  notes: string;
};

export type BackBeat = {
  overview: StudyOverview;
  sites: StudySite[];
  translations: TranslationDoc[];
  edcAccess: EdcAccessRow[];
  uberHealth: UberHealthRow[];
};

export function emptyBackBeat(): BackBeat {
  return {
    overview: emptyStudyOverview(),
    sites: [],
    translations: [],
    edcAccess: [],
    uberHealth: [],
  };
}

// ---------------------------------------------------------------------------
// Habits

export type HabitSection = "faith" | "daily";

export type Habit = {
  id: string;
  label: string;
  icon: string;
  color: string;
  section: HabitSection;
  weeklyGoal: number;
  order: number;
};

export const HABIT_ICON_OPTIONS = [
  "🙏", "📖", "✝️", "🕊️", "🌅", "💧", "🏃", "🧘",
  "📵", "🥗", "😴", "✍️", "🎯", "💊", "🚶", "🌿",
];

export const HABIT_COLOR_OPTIONS = [
  "#B08B4F", // gold
  "#5B2333", // plum
  "#3D1622", // deep plum
  "#6B7A8F", // slate blue
  "#8A9B7C", // sage
  "#A54B3F", // brick red
];

// Bump whenever the seed content below changes and existing saved habits
// should be replaced rather than left alone - see the seedVersion
// migration in normalizeDashboardData.
export const HABITS_SEED_VERSION = 2;

function seedHabits(): Habit[] {
  return [
    {
      id: crypto.randomUUID(),
      label: "Devotional",
      icon: "🕊️",
      color: "#B08B4F",
      section: "faith",
      weeklyGoal: 7,
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Prayer",
      icon: "🙏",
      color: "#5B2333",
      section: "faith",
      weeklyGoal: 7,
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      label: "Workout",
      icon: "💪",
      color: "#3D1622",
      section: "daily",
      weeklyGoal: 4,
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Water Goal",
      icon: "💧",
      color: "#6B7A8F",
      section: "daily",
      weeklyGoal: 7,
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      label: "Read",
      icon: "📖",
      color: "#8A9B7C",
      section: "daily",
      weeklyGoal: 5,
      order: 2,
    },
    {
      id: crypto.randomUUID(),
      label: "No-Spend Day",
      icon: "🚫",
      color: "#A54B3F",
      section: "daily",
      weeklyGoal: 4,
      order: 3,
    },
  ];
}

export type HabitWeekData = {
  // habitId -> 7 booleans, Monday through Sunday.
  completions: Record<string, boolean[]>;
};

export function emptyHabitWeekData(): HabitWeekData {
  return { completions: {} };
}

export type HabitsData = {
  habits: Habit[];
  weeks: Record<string, HabitWeekData>;
  seedVersion: number;
};

export function emptyHabitsData(): HabitsData {
  return { habits: seedHabits(), weeks: {}, seedVersion: HABITS_SEED_VERSION };
}

export function habitCompletionsFor(
  habitsData: HabitsData,
  weekKey: string,
  habitId: string
): boolean[] {
  const stored = habitsData.weeks[weekKey]?.completions[habitId];
  if (stored && stored.length === 7) return stored;
  return [false, false, false, false, false, false, false];
}

// Sets (not toggles) one day's completion for a habit - used both by the
// Habits grid's own tap-to-toggle and by a linked Routine step, so a
// routine step checked/unchecked and its matching habit cell always agree.
export function setHabitCompletion(
  habitsData: HabitsData,
  weekKey: string,
  habitId: string,
  storageIndex: number,
  value: boolean
): HabitsData {
  const week = habitsData.weeks[weekKey] ?? { completions: {} };
  const current = week.completions[habitId] ?? [false, false, false, false, false, false, false];
  const next = [...current];
  next[storageIndex] = value;
  return {
    ...habitsData,
    weeks: {
      ...habitsData.weeks,
      [weekKey]: { completions: { ...week.completions, [habitId]: next } },
    },
  };
}

// ---------------------------------------------------------------------------
// Work reference: contacts, approval chains, SOPs, meeting notes

export type Contact = {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

export type ApprovalChain = {
  id: string;
  name: string;
  purpose: string;
  // Multiline - one step per line.
  steps: string;
  responsiblePerson: string;
  requiredDocuments: string;
  expectedTurnaround: string;
  notes: string;
};

function emptyApprovalChain(name: string): ApprovalChain {
  return {
    id: crypto.randomUUID(),
    name,
    purpose: "",
    steps: "",
    responsiblePerson: "",
    requiredDocuments: "",
    expectedTurnaround: "",
    notes: "",
  };
}

function seedApprovalChains(): ApprovalChain[] {
  return [
    "Translation Requests",
    "NDA Workflow",
    "Vendor Contracts",
    "Purchase Orders",
    "Invoice Processing",
  ].map(emptyApprovalChain);
}

export type SopEntry = {
  id: string;
  title: string;
  category: string;
  relatedProject: string;
  lastUpdated: string;
  body: string;
};

export type ActionItem = {
  id: string;
  text: string;
  done: boolean;
};

export type MeetingNote = {
  id: string;
  date: string;
  meetingName: string;
  attendees: string;
  notes: string;
  actionItems: ActionItem[];
};

export type Reference = {
  contacts: Contact[];
  approvalChains: ApprovalChain[];
  sops: SopEntry[];
  meetingNotes: MeetingNote[];
};

export function emptyReference(): Reference {
  return { contacts: [], approvalChains: seedApprovalChains(), sops: [], meetingNotes: [] };
}

// ---------------------------------------------------------------------------
// Life quarterly: money, goals, achievements, parking lot

export type Vault = {
  id: string;
  name: string;
  currentAmount: number;
  goalAmount: number;
};

export type DebtStatus = "current" | "pastDue" | "restricted" | "closed";

export type Debt = {
  id: string;
  name: string;
  currentBalance: number;
  startingBalance: number;
  interestRatePct: number; // 0 if unknown
  minPayment: number; // 0 if unknown
  dueDay: number; // 1-31, 0 = not set
  status: DebtStatus;
  pastDueAmount: number; // 0 unless status is "pastDue"
  // Manually pinned to the top of every ordering regardless of snowball/
  // avalanche math - for something urgent (past due, restricted) that
  // needs eyes on it no matter what the "optimal" order says.
  priority: boolean;
  notes: string;
};

export type MoneyData = {
  vaults: Vault[];
  debts: Debt[];
  seedVersion: number;
  debtSeedVersion: number;
  vaultSeedVersion: number;
};

// Bump whenever the seed content below changes and existing saved vaults/
// debts should be replaced rather than left alone - see the seedVersion
// migration in normalizeDashboardData.
export const MONEY_SEED_VERSION = 1;

// Separate gate from MONEY_SEED_VERSION so her real debt numbers can
// replace the old placeholders without touching her vaults (which may
// carry real saved balances by the time this ships).
export const DEBT_SEED_VERSION = 2;

// Separate again from DEBT_SEED_VERSION so her real SoFi vault balances can
// replace the old generic placeholders in their own one-time correction,
// independent of any future debt-only migration.
export const VAULT_SEED_VERSION = 2;

function vault(name: string, currentAmount: number, goalAmount = 0): Vault {
  return { id: crypto.randomUUID(), name, currentAmount, goalAmount };
}

// Her real SoFi vaults, replacing the old generic placeholders (see
// VAULT_SEED_VERSION). Order matches how she listed them - kept as the
// display order. No goals set except where she gave one.
function seedVaults(): Vault[] {
  return [
    vault("Emergency Fund", 3000),
    vault("Jamaica", 1500),
    vault("Upcoming Short Travels", 700.62),
    vault("Rent", 1005.55),
    vault("Sefi Stash", 260.93),
    vault("Dates", 194.23),
    vault("Seph Debt", 159.27),
    vault("Groceries/PSEG/WiFi", 137.7),
    vault("Sephora Splurging", 100.49),
    vault("Gifts/Family", 6.62),
    vault("Sòl", 1.75),
    vault("Home Renovations", 0.17),
  ];
}

function debt(
  name: string,
  currentBalance: number,
  interestRatePct: number,
  minPayment: number,
  dueDay: number,
  status: DebtStatus,
  pastDueAmount: number,
  priority: boolean,
  notes: string
): Debt {
  return {
    id: crypto.randomUUID(),
    name,
    currentBalance,
    startingBalance: currentBalance,
    interestRatePct,
    minPayment,
    dueDay,
    status,
    pastDueAmount,
    priority,
    notes,
  };
}

// Her real numbers, replacing the old generic placeholders (see
// DEBT_SEED_VERSION). PSEG/Xfinity/Affirm/Zip are seeded at $0 for her to
// fill in with current balances.
function seedDebts(): Debt[] {
  return [
    debt("Sallie Mae", 6938, 15.6, 0, 0, "pastDue", 135.59, true, "2 loans combined"),
    debt("Capital One Quicksilver", 4179, 0, 0, 0, "restricted", 0, false, ""),
    debt("Chase", 4863, 0, 91, 0, "closed", 0, false, "Account closed, still paying it down"),
    debt("Best Buy", 81.5, 0, 10, 14, "current", 0, false, ""),
    debt("Apple", 233, 0, 0, 0, "current", 0, false, ""),
    debt("PSEG", 0, 0, 0, 5, "current", 0, false, "Fill in current balance"),
    debt("Xfinity", 0, 0, 0, 28, "current", 0, false, "Fill in current balance"),
    debt("Affirm", 0, 0, 0, 0, "current", 0, false, "Fill in current balance"),
    debt("Zip", 0, 0, 0, 0, "current", 0, false, "Fill in current balance"),
  ];
}

export function emptyMoneyData(): MoneyData {
  return {
    vaults: seedVaults(),
    debts: seedDebts(),
    seedVersion: MONEY_SEED_VERSION,
    debtSeedVersion: DEBT_SEED_VERSION,
    vaultSeedVersion: VAULT_SEED_VERSION,
  };
}

// Vaults and debts migrate independently, each on its own version gate, so
// a future one-time correction to either never touches the other or
// clobbers edits made after the last correction landed - her own edits
// from then on always win, same as any other seed-version migration in
// this file.
function correctedMoneyData(raw: Partial<MoneyData> | null | undefined): MoneyData {
  const seedVersion = raw?.seedVersion ?? 0;
  let base: MoneyData =
    seedVersion < MONEY_SEED_VERSION
      ? {
          vaults: seedVaults(),
          debts: seedDebts(),
          seedVersion: MONEY_SEED_VERSION,
          debtSeedVersion: DEBT_SEED_VERSION,
          vaultSeedVersion: VAULT_SEED_VERSION,
        }
      : {
          vaults: raw?.vaults ?? [],
          debts: raw?.debts ?? [],
          seedVersion: raw?.seedVersion ?? MONEY_SEED_VERSION,
          debtSeedVersion: raw?.debtSeedVersion ?? 0,
          vaultSeedVersion: raw?.vaultSeedVersion ?? 0,
        };
  if (base.debtSeedVersion < DEBT_SEED_VERSION) {
    base = { ...base, debts: seedDebts(), debtSeedVersion: DEBT_SEED_VERSION };
  }
  if (base.vaultSeedVersion < VAULT_SEED_VERSION) {
    base = { ...base, vaults: seedVaults(), vaultSeedVersion: VAULT_SEED_VERSION };
  }
  return base;
}

export type GoalCategory = "Finance" | "Health" | "Faith" | "Personal" | "Career";
export const GOAL_CATEGORIES: GoalCategory[] = [
  "Finance",
  "Health",
  "Faith",
  "Personal",
  "Career",
];

export type QuarterGoal = {
  id: string;
  category: GoalCategory;
  text: string;
  done: boolean;
};

export type Achievement = {
  id: string;
  date: string;
  text: string;
};

export type ParkingLotItem = {
  id: string;
  text: string;
};

export type QuarterData = {
  goals: QuarterGoal[];
  achievements: Achievement[];
  parkingLot: ParkingLotItem[];
};

export function emptyQuarterData(): QuarterData {
  return { goals: [], achievements: [], parkingLot: [] };
}

export type LifeQuarterly = {
  money: MoneyData;
  paydayChecklist: PaydayChecklistData;
  // Keyed by quarter, e.g. "2026-Q3".
  quarters: Record<string, QuarterData>;
};

export function emptyLifeQuarterly(): LifeQuarterly {
  return { money: emptyMoneyData(), paydayChecklist: emptyPaydayChecklistData(), quarters: {} };
}

export function quarterDataFor(lq: LifeQuarterly, key: string): QuarterData {
  const stored = lq.quarters[key];
  if (!stored) return emptyQuarterData();
  return { ...emptyQuarterData(), ...stored };
}

// ---------------------------------------------------------------------------
// Books

export type Book = {
  id: string;
  openLibraryKey: string;
  title: string;
  author: string;
  coverUrl: string;
};

export type FinishedBook = Book & {
  finishedDate: string;
  // Quarter the book was marked finished, e.g. "2026-Q3" - fixed at
  // completion time so the grouping doesn't shift later.
  quarterKey: string;
};

export type BooksData = {
  currentlyReading: Book | null;
  read: FinishedBook[];
};

export function emptyBooksData(): BooksData {
  return { currentlyReading: null, read: [] };
}

// ---------------------------------------------------------------------------
// Bucket list

export type BucketCategory =
  | "Travel"
  | "Experience"
  | "Career"
  | "Personal"
  | "Health"
  | "Creative"
  | "Financial"
  | "Faith";

export const BUCKET_CATEGORIES: BucketCategory[] = [
  "Travel",
  "Experience",
  "Career",
  "Personal",
  "Health",
  "Creative",
  "Financial",
  "Faith",
];

export const BUCKET_CATEGORY_COLORS: Record<BucketCategory, string> = {
  Travel: "#C1815F",
  Experience: "#C7A46B",
  Career: "#6E5C4B",
  Personal: "#9B7B94",
  Health: "#8FA37E",
  Creative: "#8C97B0",
  Financial: "#A8763E",
  Faith: "#7C9070",
};

export type BucketItem = {
  id: string;
  text: string;
  category: BucketCategory;
  done: boolean;
  completedDate: string;
};

export type BucketListData = {
  items: BucketItem[];
};

export function emptyBucketListData(): BucketListData {
  return { items: [] };
}

// ---------------------------------------------------------------------------
// Year: the annual manifesto page

export type YearReflections = {
  vision: string;
  nonNegotiables: string;
  focusingOn: string;
  wantToChange: string;
};

export function emptyYearReflections(): YearReflections {
  return { vision: "", nonNegotiables: "", focusingOn: "", wantToChange: "" };
}

export type YearBucket = {
  id: string;
  theme: string;
  description: string;
};

export type YearGoal = {
  id: string;
  category: GoalCategory;
  text: string;
  done: boolean;
};

export type TransformationCategoryKey = "Fitness" | "Finances" | "Faith" | "Style" | "Career";

export const TRANSFORMATION_CATEGORIES: TransformationCategoryKey[] = [
  "Fitness",
  "Finances",
  "Faith",
  "Style",
  "Career",
];

export type TransformationGoal = {
  id: string;
  text: string;
  done: boolean;
};

export type YearData = {
  reflections: YearReflections;
  buckets: YearBucket[];
  goals: YearGoal[];
  transformations: Record<TransformationCategoryKey, TransformationGoal[]>;
  warRoom: WarRoomData;
};

export function emptyTransformations(): Record<TransformationCategoryKey, TransformationGoal[]> {
  return { Fitness: [], Finances: [], Faith: [], Style: [], Career: [] };
}

export function emptyYearData(): YearData {
  return {
    reflections: emptyYearReflections(),
    buckets: [],
    goals: [],
    transformations: emptyTransformations(),
    warRoom: emptyWarRoomData(),
  };
}

// ---------------------------------------------------------------------------
// Daily Review: one journal entry per day, shared across Work and Life

export type MoodOption = "great" | "good" | "okay" | "low" | "rough";
export type EnergyOption = "high" | "good" | "okay" | "low" | "drained";

export const MOOD_OPTIONS: { key: MoodOption; emoji: string; label: string }[] = [
  { key: "great", emoji: "😄", label: "Great" },
  { key: "good", emoji: "🙂", label: "Good" },
  { key: "okay", emoji: "😐", label: "Okay" },
  { key: "low", emoji: "😕", label: "Low" },
  { key: "rough", emoji: "😣", label: "Rough" },
];

export const ENERGY_OPTIONS: { key: EnergyOption; emoji: string; label: string }[] = [
  { key: "high", emoji: "⚡", label: "High" },
  { key: "good", emoji: "🔋", label: "Good" },
  { key: "okay", emoji: "🙂", label: "Okay" },
  { key: "low", emoji: "🪫", label: "Low" },
  { key: "drained", emoji: "😴", label: "Drained" },
];

export type DailyReviewEntry = {
  accomplished: string;
  stillWaiting: string;
  improveTomorrow: string;
  biggestWin: string;
  mood: MoodOption | null;
  energy: EnergyOption | null;
};

export function emptyDailyReviewEntry(): DailyReviewEntry {
  return {
    accomplished: "",
    stillWaiting: "",
    improveTomorrow: "",
    biggestWin: "",
    mood: null,
    energy: null,
  };
}

export type DailyReviewData = {
  // Keyed by YYYY-MM-DD.
  entries: Record<string, DailyReviewEntry>;
};

export function emptyDailyReviewData(): DailyReviewData {
  return { entries: {} };
}

export function dailyReviewEntryFor(data: DailyReviewData, dateKey: string): DailyReviewEntry {
  return data.entries[dateKey] ?? emptyDailyReviewEntry();
}

export function isDailyReviewEntryFilled(entry: DailyReviewEntry): boolean {
  return Boolean(
    entry.accomplished ||
      entry.stillWaiting ||
      entry.improveTomorrow ||
      entry.biggestWin ||
      entry.mood ||
      entry.energy
  );
}

// ---------------------------------------------------------------------------
// SMS alerts: tracks which overdue tasks have already been texted about,
// so the daily check only alerts once per task per overdue occurrence.

export type SmsAlertsData = {
  alertedOverdueTaskIds: string[];
};

export function emptySmsAlertsData(): SmsAlertsData {
  return { alertedOverdueTaskIds: [] };
}

/**
 * Everything lives in one JSON blob so new features (new fields, new
 * widgets) can be added later just by extending this shape - no
 * database migrations required.
 */
export type DashboardData = {
  version: 1;
  work: WorldData;
  life: WorldData;
  oneThing: OneThing;
  lifeWeekly: LifeWeekly;
  workOps: WorkOps;
  cadence: CadenceData;
  backBeat: BackBeat;
  habits: HabitsData;
  reference: Reference;
  brainDump: string;
  lifeQuarterly: LifeQuarterly;
  books: BooksData;
  bucketList: BucketListData;
  year: YearData;
  dailyReview: DailyReviewData;
  smsAlerts: SmsAlertsData;
  routines: RoutinesData;
  lifeScore: LifeScoreData;
  boardMeetings: BoardMeetingData;
  lists: ListsData;
  rhythm: RhythmData;
  glowUp: GlowUpData;
  textAlerts: TextAlertsData;
  planner: PlannerData;
  homeZones: HomeZonesData;
  welcome: WelcomeData;
  waitingOn: WaitingOnData;
  vendors: VendorsData;
  workShutdown: WorkShutdownData;
  meetingOps: MeetingOpsData;
  principals: PrincipalsData;
  questionBank: QuestionBankData;
  templates: TemplatesData;
  preMortem: PreMortemData;
  fireDrillLog: FireDrillLogData;
  fridayLedger: FridayLedgerData;
  events: EventsData;
  focus: FocusData;
  assistant: AssistantData;
  quest: QuestData;
  memos: MemosData;
  health: HealthData;
  mealPlan: MealPlanData;
  finance: FinanceData;
  wedding: WeddingData;
  trips: TripsData;
  budget: BudgetData;
  tabUsage: TabUsageData;
  systemCheck: SystemCheckData;
  appearance: AppearanceData;
  vision: VisionData;
  ambiance: AmbianceData;
  knowledge: KnowledgeData;
  milestones: MilestoneData;
  rewards: RewardsData;
  recipes: RecipeBankData;
  paycheckPlans: PaycheckPlanData;
  dailyTheme: DailyThemeData;
  mealCalendar: MealCalendarData;
  cookbook: CookbookData;
  cher: CherData;
};

export function emptyWorld(): WorldData {
  return { tasks: [], notes: "" };
}

export function emptyOneThing(): OneThing {
  return { text: "", date: "" };
}

export function defaultDashboardData(): DashboardData {
  return {
    version: 1,
    work: emptyWorld(),
    life: emptyWorld(),
    oneThing: emptyOneThing(),
    lifeWeekly: emptyLifeWeekly(),
    workOps: emptyWorkOps(),
    cadence: emptyCadenceData(),
    backBeat: emptyBackBeat(),
    habits: emptyHabitsData(),
    reference: emptyReference(),
    brainDump: "",
    lifeQuarterly: emptyLifeQuarterly(),
    books: emptyBooksData(),
    bucketList: emptyBucketListData(),
    year: emptyYearData(),
    dailyReview: emptyDailyReviewData(),
    smsAlerts: emptySmsAlertsData(),
    routines: emptyRoutinesData(),
    lifeScore: emptyLifeScoreData(),
    boardMeetings: emptyBoardMeetingData(),
    lists: emptyListsData(),
    rhythm: emptyRhythmData(),
    glowUp: emptyGlowUpData(),
    textAlerts: emptyTextAlertsData(),
    planner: emptyPlannerData(),
    homeZones: emptyHomeZonesData(),
    welcome: emptyWelcomeData(),
    waitingOn: emptyWaitingOnData(),
    vendors: emptyVendorsData(),
    workShutdown: emptyWorkShutdownData(),
    meetingOps: emptyMeetingOpsData(),
    principals: emptyPrincipalsData(),
    questionBank: emptyQuestionBankData(),
    templates: emptyTemplatesData(),
    preMortem: emptyPreMortemData(),
    fireDrillLog: emptyFireDrillLogData(),
    fridayLedger: emptyFridayLedgerData(),
    events: emptyEventsData(),
    focus: emptyFocusData(),
    assistant: emptyAssistantData(),
    quest: emptyQuestData(),
    memos: emptyMemosData(),
    health: emptyHealthData(),
    mealPlan: emptyMealPlanData(),
    finance: emptyFinanceData(),
    wedding: emptyWeddingData(),
    trips: emptyTripsData(),
    budget: emptyBudgetData(),
    tabUsage: emptyTabUsageData(),
    systemCheck: emptySystemCheckData(),
    appearance: emptyAppearanceData(),
    vision: emptyVisionData(),
    ambiance: emptyAmbianceData(),
    knowledge: defaultKnowledgeData(),
    milestones: defaultMilestoneData(),
    rewards: emptyRewardsData(),
    recipes: defaultRecipeBankData(),
    paycheckPlans: emptyPaycheckPlanData(),
    dailyTheme: defaultDailyThemeData(),
    mealCalendar: defaultMealCalendarData(),
    cookbook: defaultCookbookData(),
    cher: defaultCherData(),
  };
}

// Backfills any fields missing from older saved data (e.g. before a field
// existed) with defaults, so new features never require a migration.
export function normalizeDashboardData(
  data: Partial<DashboardData> | null | undefined
): DashboardData {
  const fallback = defaultDashboardData();
  if (!data) return fallback;
  const result = {
    version: 1 as const,
    work: { ...fallback.work, ...data.work },
    life: { ...fallback.life, ...data.life },
    oneThing: { ...fallback.oneThing, ...data.oneThing },
    lifeWeekly: {
      ...fallback.lifeWeekly,
      ...data.lifeWeekly,
      currentlyReading: {
        ...fallback.lifeWeekly.currentlyReading,
        ...data.lifeWeekly?.currentlyReading,
      },
      // Backfill `focus` on any tasks saved before that field existed, so
      // old data doesn't fail validation on its next save.
      weeks: Object.fromEntries(
        Object.entries(data.lifeWeekly?.weeks ?? {}).map(([weekKey, week]) => [
          weekKey,
          { ...week, tasks: (week.tasks ?? []).map((t) => ({ ...t, focus: t.focus ?? false })) },
        ])
      ),
    },
    workOps: {
      tasks: (data.workOps?.tasks ?? []).map((t) => ({
        ...t,
        progressPct: t.progressPct ?? 0,
        progressLog: t.progressLog ?? [],
        stallSnoozedUntil: t.stallSnoozedUntil ?? "",
      })),
    },
    cadence: normalizeCadenceData(data.cadence),
    backBeat: {
      overview: { ...fallback.backBeat.overview, ...data.backBeat?.overview },
      sites: data.backBeat?.sites ?? [],
      translations: data.backBeat?.translations ?? [],
      edcAccess: data.backBeat?.edcAccess ?? [],
      uberHealth: data.backBeat?.uberHealth ?? [],
    },
    // A one-time reset: habits saved under an older seed version are
    // replaced with the current seed content (and their weekly history
    // cleared, since it references habit ids that no longer exist) -
    // requested explicitly rather than the usual "never overwrite real
    // data" rule. Once migrated, seedVersion matches and this never
    // fires again, so later edits persist normally.
    habits:
      (data.habits?.seedVersion ?? 0) < HABITS_SEED_VERSION
        ? { habits: seedHabits(), weeks: {}, seedVersion: HABITS_SEED_VERSION }
        : {
            habits: data.habits?.habits ?? fallback.habits.habits,
            weeks: data.habits?.weeks ?? {},
            seedVersion: data.habits?.seedVersion ?? HABITS_SEED_VERSION,
          },
    reference: {
      contacts: data.reference?.contacts ?? [],
      approvalChains: data.reference?.approvalChains ?? fallback.reference.approvalChains,
      sops: data.reference?.sops ?? [],
      meetingNotes: data.reference?.meetingNotes ?? [],
    },
    brainDump: data.brainDump ?? "",
    lifeQuarterly: {
      money: correctedMoneyData(data.lifeQuarterly?.money),
      paydayChecklist:
        (data.lifeQuarterly?.paydayChecklist?.seedVersion ?? 0) < PAYDAY_SEED_VERSION
          ? {
              anchorDate: data.lifeQuarterly?.paydayChecklist?.anchorDate ?? "",
              steps: seedPaydaySteps(),
              periods: {},
              seedVersion: PAYDAY_SEED_VERSION,
            }
          : {
              anchorDate: data.lifeQuarterly?.paydayChecklist?.anchorDate ?? "",
              steps: data.lifeQuarterly?.paydayChecklist?.steps ?? [],
              periods: data.lifeQuarterly?.paydayChecklist?.periods ?? {},
              seedVersion: data.lifeQuarterly?.paydayChecklist?.seedVersion ?? PAYDAY_SEED_VERSION,
            },
      quarters: data.lifeQuarterly?.quarters ?? {},
    },
    books: {
      currentlyReading: data.books?.currentlyReading ?? null,
      read: data.books?.read ?? [],
    },
    bucketList: {
      items: data.bucketList?.items ?? [],
    },
    year: {
      reflections: { ...fallback.year.reflections, ...data.year?.reflections },
      buckets: data.year?.buckets ?? [],
      goals: data.year?.goals ?? [],
      transformations: { ...fallback.year.transformations, ...data.year?.transformations },
      warRoom: normalizeWarRoomData(data.year?.warRoom),
    },
    dailyReview: {
      entries: data.dailyReview?.entries ?? {},
    },
    smsAlerts: {
      alertedOverdueTaskIds: data.smsAlerts?.alertedOverdueTaskIds ?? [],
    },
    routines: normalizeRoutinesData(data.routines),
    lifeScore: normalizeLifeScoreData(data.lifeScore),
    boardMeetings: normalizeBoardMeetingData(data.boardMeetings),
    lists: normalizeListsData(data.lists),
    rhythm: normalizeRhythmData(data.rhythm),
    glowUp: normalizeGlowUpData(data.glowUp),
    textAlerts: normalizeTextAlertsData(data.textAlerts),
    planner: normalizePlannerData(data.planner),
    homeZones: normalizeHomeZonesData(data.homeZones),
    welcome: normalizeWelcomeData(data.welcome),
    waitingOn: normalizeWaitingOnData(data.waitingOn),
    vendors: normalizeVendorsData(data.vendors),
    workShutdown: normalizeWorkShutdownData(data.workShutdown),
    meetingOps: normalizeMeetingOpsData(data.meetingOps),
    principals: normalizePrincipalsData(data.principals),
    questionBank: normalizeQuestionBankData(data.questionBank),
    templates: normalizeTemplatesData(data.templates),
    preMortem: normalizePreMortemData(data.preMortem),
    fireDrillLog: normalizeFireDrillLogData(data.fireDrillLog),
    fridayLedger: normalizeFridayLedgerData(data.fridayLedger),
    events: normalizeEventsData(data.events),
    focus: normalizeFocusData(data.focus),
    assistant: normalizeAssistantData(data.assistant),
    quest: normalizeQuestData(data.quest),
    memos: normalizeMemosData(data.memos),
    health: normalizeHealthData(data.health),
    mealPlan: normalizeMealPlanData(data.mealPlan),
    finance: normalizeFinanceData(data.finance),
    wedding: normalizeWeddingData(data.wedding),
    trips: normalizeTripsData(data.trips),
    budget: normalizeBudgetData(data.budget),
    tabUsage: normalizeTabUsageData(data.tabUsage),
    systemCheck: normalizeSystemCheckData(data.systemCheck),
    appearance: normalizeAppearanceData(data.appearance),
    vision: normalizeVisionData(data.vision),
    ambiance: normalizeAmbianceData(data.ambiance),
    // Seeded once, the first time this field has never been saved before
    // (an account that predates the Knowledge tab) - after that, her real
    // progress always wins and this never re-seeds.
    knowledge: data.knowledge === undefined ? defaultKnowledgeData() : normalizeKnowledgeData(data.knowledge),
    // Seeded once, the first time this field has never been saved before
    // (an account that predates Milestones) - after that, her real
    // trackers always win, even if she deletes both starter trackers.
    milestones: data.milestones === undefined ? defaultMilestoneData() : normalizeMilestoneData(data.milestones),
    rewards: normalizeRewardsData(data.rewards),
    // Seeded once, the first time this field has never been saved before
    // (an account that predates the recipe bank) - after that, her real
    // saved recipes always win, even if she deletes every seed recipe.
    recipes: data.recipes === undefined ? defaultRecipeBankData() : normalizeRecipeBankData(data.recipes),
    paycheckPlans: normalizePaycheckPlanData(data.paycheckPlans),
    dailyTheme: normalizeDailyThemeData(data.dailyTheme),
    mealCalendar: normalizeMealCalendarData(data.mealCalendar),
    cookbook: normalizeCookbookData(data.cookbook),
    cher: normalizeCherData(data.cher),
  };

  // One-time additive link: makes sure the vaults/debt this feature depends
  // on exist, without ever overwriting balances the user has already edited.
  const linked = ensureLinkedMoneyEntities(result.lifeQuarterly.money, result.budget);
  result.lifeQuarterly = { ...result.lifeQuarterly, money: linked.money };
  result.budget = linked.budget;

  result.routines = applyGlowRoutineUpdate(result.routines);
  result.glowUp = applyGlowUpContentUpdate(result.glowUp);
  result.lists = { ...result.lists, grocery: ensureGrocerySeedItems(result.lists.grocery) };
  result.rhythm = applyRhythmAddOns(result.rhythm);

  return result;
}

// Fills in any weeks missing from the stored map (e.g. a week never
// visited before) with a blank WeekData, without persisting it until
// the user actually changes something in that week.
export function weekDataFor(lifeWeekly: LifeWeekly, weekKey: string): WeekData {
  const stored = lifeWeekly.weeks[weekKey];
  if (!stored) return emptyWeekData();
  return { ...emptyWeekData(), ...stored };
}
