import { RoutinesData, emptyRoutinesData, normalizeRoutinesData } from "./routines";
import { PaydayChecklistData, emptyPaydayChecklistData } from "./payday";
import { WarRoomData, emptyWarRoomData, normalizeWarRoomData } from "./warroom";
import { LifeScoreData, emptyLifeScoreData, normalizeLifeScoreData } from "./lifescore";
import { BoardMeetingData, emptyBoardMeetingData, normalizeBoardMeetingData } from "./boardmeeting";
import { ListsData, emptyListsData, normalizeListsData } from "./lists";
import { RhythmData, emptyRhythmData, normalizeRhythmData } from "./rhythm";
import { GlowUpData, emptyGlowUpData, normalizeGlowUpData } from "./glowup";
import { TextAlertsData, emptyTextAlertsData, normalizeTextAlertsData } from "./textalerts";

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

export type WorkTaskStatus = "urgent" | "in_progress" | "waiting" | "completed";
export type WorkTaskPriority = "high" | "medium" | "low";
export type WorkTaskCategory =
  | "Clinical Operations"
  | "Executive Support"
  | "Investor Relations"
  | "Finance"
  | "Translation"
  | "Vendor"
  | "Facilities"
  | "Regulatory"
  | "Administration";

export const WORK_TASK_STATUSES: { key: WorkTaskStatus; label: string }[] = [
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

export const WORK_TASK_CATEGORIES: WorkTaskCategory[] = [
  "Clinical Operations",
  "Executive Support",
  "Investor Relations",
  "Finance",
  "Translation",
  "Vendor",
  "Facilities",
  "Regulatory",
  "Administration",
];

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
  "#6E5C4B", // espresso
  "#C1815F", // terracotta
  "#8FA37E", // sage
  "#C7A46B", // ochre
  "#8C97B0", // dusty blue
  "#9B7B94", // muted plum
];

function seedHabits(): Habit[] {
  return [
    {
      id: crypto.randomUUID(),
      label: "Morning Prayer",
      icon: "🙏",
      color: "#8FA37E",
      section: "faith",
      weeklyGoal: 7,
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Scripture Reading",
      icon: "📖",
      color: "#C7A46B",
      section: "faith",
      weeklyGoal: 5,
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      label: "Move My Body",
      icon: "🏃",
      color: "#C1815F",
      section: "daily",
      weeklyGoal: 5,
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Drink Water",
      icon: "💧",
      color: "#8C97B0",
      section: "daily",
      weeklyGoal: 7,
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      label: "Journal",
      icon: "✍️",
      color: "#6E5C4B",
      section: "daily",
      weeklyGoal: 4,
      order: 2,
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
};

export function emptyHabitsData(): HabitsData {
  return { habits: seedHabits(), weeks: {} };
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

export type Debt = {
  id: string;
  name: string;
  currentBalance: number;
  startingBalance: number;
};

export type MoneyData = {
  vaults: Vault[];
  debts: Debt[];
};

export function emptyMoneyData(): MoneyData {
  return { vaults: [], debts: [] };
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
  };
}

// Backfills any fields missing from older saved data (e.g. before a field
// existed) with defaults, so new features never require a migration.
export function normalizeDashboardData(
  data: Partial<DashboardData> | null | undefined
): DashboardData {
  const fallback = defaultDashboardData();
  if (!data) return fallback;
  return {
    version: 1,
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
      weeks: data.lifeWeekly?.weeks ?? {},
    },
    workOps: {
      tasks: data.workOps?.tasks ?? [],
    },
    backBeat: {
      overview: { ...fallback.backBeat.overview, ...data.backBeat?.overview },
      sites: data.backBeat?.sites ?? [],
      translations: data.backBeat?.translations ?? [],
      edcAccess: data.backBeat?.edcAccess ?? [],
      uberHealth: data.backBeat?.uberHealth ?? [],
    },
    habits: {
      habits: data.habits?.habits ?? fallback.habits.habits,
      weeks: data.habits?.weeks ?? {},
    },
    reference: {
      contacts: data.reference?.contacts ?? [],
      approvalChains: data.reference?.approvalChains ?? fallback.reference.approvalChains,
      sops: data.reference?.sops ?? [],
      meetingNotes: data.reference?.meetingNotes ?? [],
    },
    brainDump: data.brainDump ?? "",
    lifeQuarterly: {
      money: {
        vaults: data.lifeQuarterly?.money?.vaults ?? [],
        debts: data.lifeQuarterly?.money?.debts ?? [],
      },
      paydayChecklist: {
        anchorDate: data.lifeQuarterly?.paydayChecklist?.anchorDate ?? "",
        steps: data.lifeQuarterly?.paydayChecklist?.steps ?? [],
        periods: data.lifeQuarterly?.paydayChecklist?.periods ?? {},
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
  };
}

// Fills in any weeks missing from the stored map (e.g. a week never
// visited before) with a blank WeekData, without persisting it until
// the user actually changes something in that week.
export function weekDataFor(lifeWeekly: LifeWeekly, weekKey: string): WeekData {
  const stored = lifeWeekly.weeks[weekKey];
  if (!stored) return emptyWeekData();
  return { ...emptyWeekData(), ...stored };
}
