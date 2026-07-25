import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardData, saveDashboardData } from "@/lib/db";
import { normalizeDashboardData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Defense in depth: middleware already sets no-store on every response,
// but this route's replies carry the actual dashboard data, so the
// header goes directly on the response here too - nothing between this
// server and the browser (a CDN edge, a proxy, the browser's own cache)
// should ever be able to serve a stale copy of it.
function noStoreJson<T>(body: T, init?: { status?: number }) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

const taskSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  done: z.boolean(),
  focus: z.boolean(),
  createdAt: z.string(),
});

const worldSchema = z.object({
  tasks: z.array(taskSchema).max(500),
  notes: z.string().max(20000),
});

const oneThingSchema = z.object({
  text: z.string().max(2000),
  date: z.string(),
});

const weekTaskSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  done: z.boolean(),
  createdAt: z.string(),
  focus: z.boolean(),
});

const weekDataSchema = z.object({
  tasks: z.array(weekTaskSchema).max(200),
  workouts: z.array(z.string()).max(100),
  weeklyFocus: z.array(z.string().max(200)).length(3),
  reflection: z.string().max(5000),
});

const lifeWeeklySchema = z.object({
  workoutGoal: z.number().int().min(1).max(30),
  currentlyReading: z.object({
    title: z.string().max(200),
    author: z.string().max(200),
  }),
  weeks: z.record(weekDataSchema),
});

// The one shared department list for Work tasks, Cadence, and Vendors -
// see lib/department.ts. Planner stays separate on purpose (personal,
// user-managed categories, not business departments).
const departmentSchema = z.enum([
  "Clinical Operations",
  "Executive Support",
  "Investor Relations",
  "Finance",
  "Translation",
  "Vendor",
  "Facilities",
  "Regulatory",
  "Administration",
  "Career",
]);

const workTaskProgressEntrySchema = z.object({
  date: z.string(),
  pct: z.number().min(0).max(100),
});

const workTaskSchema = z.object({
  id: z.string(),
  title: z.string().max(300),
  status: z.enum(["not_started", "started", "urgent", "in_progress", "waiting", "completed"]),
  priority: z.enum(["high", "medium", "low"]),
  category: departmentSchema,
  dueDate: z.string(),
  notes: z.string().max(5000),
  topPriority: z.boolean(),
  createdAt: z.string(),
  progressPct: z.number().min(0).max(100),
  progressLog: z.array(workTaskProgressEntrySchema).max(1000),
  stallSnoozedUntil: z.string().optional().default(""),
});

const workOpsSchema = z.object({
  tasks: z.array(workTaskSchema).max(1000),
});

const cadenceItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  department: departmentSchema,
  order: z.number(),
  linkedWaitingOnId: z.string().nullable().optional(),
});

const cadenceDataSchema = z.object({
  items: z.array(cadenceItemSchema).max(500),
  dailyLogs: z.record(z.array(z.string()).max(200)),
  weeklyLogs: z.record(z.array(z.string()).max(200)),
  monthlyLogs: z.record(z.array(z.string()).max(200)),
  quarterlyLogs: z.record(z.array(z.string()).max(200)),
  systemCheckSeedVersion: z.number().optional().default(0),
});

const studyOverviewSchema = z.object({
  protocolSummary: z.string().max(10000),
  primaryEndpoint: z.string().max(5000),
  enrollmentStatus: z.string().max(5000),
  importantDates: z.string().max(5000),
});

const studySiteSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  status: z.enum(["Active", "Pending", "Closed"]),
  country: z.string().max(100),
  siteManager: z.string().max(200),
  enrollmentCount: z.number().int().min(0).max(1000000),
  notes: z.string().max(5000),
  archived: z.boolean(),
});

const translationDocSchema = z.object({
  id: z.string(),
  documentName: z.string().max(300),
  vendor: z.string().max(200),
  language: z.string().max(100),
  stages: z.object({
    quoteRequested: z.boolean(),
    quoteApproved: z.boolean(),
    sent: z.boolean(),
    received: z.boolean(),
    uploaded: z.boolean(),
  }),
  notes: z.string().max(5000),
});

const edcAccessRowSchema = z.object({
  id: z.string(),
  user: z.string().max(200),
  site: z.string().max(200),
  stages: z.object({
    requested: z.boolean(),
    approved: z.boolean(),
    completed: z.boolean(),
  }),
});

const uberHealthRowSchema = z.object({
  id: z.string(),
  site: z.string().max(200),
  credits: z.number().min(0).max(1000000),
  monthlyInvoice: z.number().min(0).max(1000000),
  statementReceived: z.boolean(),
  paymentStatus: z.enum(["Pending", "Paid", "Overdue"]),
  notes: z.string().max(5000),
});

const backBeatSchema = z.object({
  overview: studyOverviewSchema,
  sites: z.array(studySiteSchema).max(500),
  translations: z.array(translationDocSchema).max(1000),
  edcAccess: z.array(edcAccessRowSchema).max(1000),
  uberHealth: z.array(uberHealthRowSchema).max(500),
});

const habitSchema = z.object({
  id: z.string(),
  label: z.string().max(100),
  icon: z.string().max(16),
  color: z.string().max(20),
  section: z.enum(["faith", "daily"]),
  weeklyGoal: z.number().int().min(1).max(7),
  order: z.number().int(),
});

const habitWeekDataSchema = z.object({
  completions: z.record(z.array(z.boolean()).length(7)),
});

const habitsDataSchema = z.object({
  habits: z.array(habitSchema).max(100),
  weeks: z.record(habitWeekDataSchema),
  seedVersion: z.number().int(),
});

const contactSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  position: z.string().max(200),
  department: z.string().max(200),
  email: z.string().max(200),
  phone: z.string().max(100),
  company: z.string().max(200),
  notes: z.string().max(5000),
});

const approvalChainSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  purpose: z.string().max(5000),
  steps: z.string().max(10000),
  responsiblePerson: z.string().max(200),
  requiredDocuments: z.string().max(2000),
  expectedTurnaround: z.string().max(200),
  notes: z.string().max(5000),
});

const sopEntrySchema = z.object({
  id: z.string(),
  title: z.string().max(300),
  category: z.string().max(200),
  relatedProject: z.string().max(200),
  lastUpdated: z.string(),
  body: z.string().max(20000),
});

const actionItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  done: z.boolean(),
});

const meetingNoteSchema = z.object({
  id: z.string(),
  date: z.string(),
  meetingName: z.string().max(300),
  attendees: z.string().max(2000),
  notes: z.string().max(10000),
  actionItems: z.array(actionItemSchema).max(200),
});

const referenceSchema = z.object({
  contacts: z.array(contactSchema).max(2000),
  approvalChains: z.array(approvalChainSchema).max(500),
  sops: z.array(sopEntrySchema).max(1000),
  meetingNotes: z.array(meetingNoteSchema).max(2000),
});

const vaultSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  currentAmount: z.number().min(-1000000000).max(1000000000),
  goalAmount: z.number().min(0).max(1000000000),
});

const debtSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  currentBalance: z.number().min(0).max(1000000000),
  startingBalance: z.number().min(0).max(1000000000),
  interestRatePct: z.number().min(0).max(100),
  minPayment: z.number().min(0).max(1000000000),
  dueDay: z.number().int().min(0).max(31),
  status: z.enum(["current", "pastDue", "restricted", "closed"]),
  pastDueAmount: z.number().min(0).max(1000000000),
  priority: z.boolean(),
  notes: z.string().max(2000),
});

const moneyDataSchema = z.object({
  vaults: z.array(vaultSchema).max(200),
  debts: z.array(debtSchema).max(200),
  seedVersion: z.number().int(),
  debtSeedVersion: z.number().int(),
  vaultSeedVersion: z.number().int(),
});

const paydayStepSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  amount: z.number().min(0).max(10000000).nullable(),
  order: z.number().int(),
});

const paydayChecklistDataSchema = z.object({
  anchorDate: z.string(),
  steps: z.array(paydayStepSchema).max(100),
  periods: z.record(z.array(z.string()).max(200)),
  seedVersion: z.number().int(),
});

const quarterGoalSchema = z.object({
  id: z.string(),
  category: z.enum(["Finance", "Health", "Faith", "Personal", "Career"]),
  text: z.string().max(500),
  done: z.boolean(),
});

const achievementSchema = z.object({
  id: z.string(),
  date: z.string(),
  text: z.string().max(1000),
});

const parkingLotItemSchema = z.object({
  id: z.string(),
  text: z.string().max(1000),
});

const quarterDataSchema = z.object({
  goals: z.array(quarterGoalSchema).max(500),
  achievements: z.array(achievementSchema).max(1000),
  parkingLot: z.array(parkingLotItemSchema).max(500),
});

const lifeQuarterlySchema = z.object({
  money: moneyDataSchema,
  paydayChecklist: paydayChecklistDataSchema,
  quarters: z.record(quarterDataSchema),
});

const bookSchema = z.object({
  id: z.string(),
  openLibraryKey: z.string().max(200),
  title: z.string().max(500),
  author: z.string().max(300),
  coverUrl: z.string().max(500),
});

const finishedBookSchema = bookSchema.extend({
  finishedDate: z.string(),
  quarterKey: z.string(),
});

const booksDataSchema = z.object({
  currentlyReading: bookSchema.nullable(),
  read: z.array(finishedBookSchema).max(5000),
});

const bucketItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  category: z.enum([
    "Travel",
    "Experience",
    "Career",
    "Personal",
    "Health",
    "Creative",
    "Financial",
    "Faith",
  ]),
  done: z.boolean(),
  completedDate: z.string(),
});

const bucketListDataSchema = z.object({
  items: z.array(bucketItemSchema).max(1000),
});

const yearReflectionsSchema = z.object({
  vision: z.string().max(10000),
  nonNegotiables: z.string().max(10000),
  focusingOn: z.string().max(10000),
  wantToChange: z.string().max(10000),
});

const yearBucketSchema = z.object({
  id: z.string(),
  theme: z.string().max(200),
  description: z.string().max(2000),
});

const yearGoalSchema = z.object({
  id: z.string(),
  category: z.enum(["Finance", "Health", "Faith", "Personal", "Career"]),
  text: z.string().max(500),
  done: z.boolean(),
});

const transformationGoalSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  done: z.boolean(),
});

const categorySnapshotSchema = z.object({
  date: z.string(),
  done: z.number().int().min(0),
  total: z.number().int().min(0),
});

const categoryWarRoomDataSchema = z.object({
  thisWeeksMove: z.string().max(500),
  thisWeeksMoveSetDate: z.string(),
  snapshots: z.array(categorySnapshotSchema).max(1000),
});

const letterToDecemberSephSchema = z.object({
  text: z.string().max(20000),
  sealed: z.boolean(),
  sealedDate: z.string(),
});

const warRoomDataSchema = z.object({
  categories: z.object({
    Fitness: categoryWarRoomDataSchema,
    Finances: categoryWarRoomDataSchema,
    Faith: categoryWarRoomDataSchema,
    Style: categoryWarRoomDataSchema,
    Career: categoryWarRoomDataSchema,
  }),
  letter: letterToDecemberSephSchema,
});

const yearDataSchema = z.object({
  reflections: yearReflectionsSchema,
  buckets: z.array(yearBucketSchema).max(200),
  goals: z.array(yearGoalSchema).max(500),
  transformations: z.object({
    Fitness: z.array(transformationGoalSchema).max(200),
    Finances: z.array(transformationGoalSchema).max(200),
    Faith: z.array(transformationGoalSchema).max(200),
    Style: z.array(transformationGoalSchema).max(200),
    Career: z.array(transformationGoalSchema).max(200),
  }),
  warRoom: warRoomDataSchema,
});

const dailyReviewEntrySchema = z.object({
  accomplished: z.string().max(5000),
  stillWaiting: z.string().max(5000),
  improveTomorrow: z.string().max(5000),
  biggestWin: z.string().max(2000),
  mood: z.enum(["great", "good", "okay", "low", "rough"]).nullable(),
  energy: z.enum(["high", "good", "okay", "low", "drained"]).nullable(),
});

const dailyReviewDataSchema = z.object({
  entries: z.record(dailyReviewEntrySchema),
});

const smsAlertsDataSchema = z.object({
  alertedOverdueTaskIds: z.array(z.string()).max(2000),
});

const routineStepSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  targetTime: z.string().max(10),
  durationMinutes: z.number().int().min(0).max(600).nullable(),
  order: z.number().int(),
  linkedHabitId: z.string().nullable().optional(),
});

const routineVariantSchema = z.object({
  steps: z.array(routineStepSchema).max(50),
});

const routineSchema = z.object({
  variants: z.object({
    office: routineVariantSchema,
    remote: routineVariantSchema,
    weekend: routineVariantSchema,
  }),
});

const routineDayLogSchema = z.object({
  completedStepIds: z.object({
    morning: z.array(z.string()).max(50),
    day: z.array(z.string()).max(50),
    night: z.array(z.string()).max(50),
  }),
});

const glowUpItemSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  order: z.number().int(),
});

const glowUpMonthlyItemSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  order: z.number().int(),
  lastDoneDate: z.string(),
  warnAfterDays: z.number().int().min(1).max(365).optional(),
});

const diyLogEntrySchema = z.object({
  date: z.string(),
  itemId: z.string(),
});

const glowUpDataSchema = z.object({
  dailyItems: z.array(glowUpItemSchema).max(50),
  weeklyItems: z.array(glowUpItemSchema).max(50),
  monthlyItems: z.array(glowUpMonthlyItemSchema).max(50),
  diyItems: z.array(glowUpItemSchema).max(50),
  dailyLogs: z.record(z.array(z.string()).max(50)),
  weeklyLogs: z.record(z.array(z.string()).max(50)),
  monthlyLogs: z.record(z.array(z.string()).max(50)),
  diyLog: z.array(diyLogEntrySchema).max(500),
  scentNote: z.string().max(2000),
  contentVersion: z.number().int(),
});

const rhythmAnchorSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  order: z.number().int(),
  conditional: z.literal("payday").optional(),
  nudgeTime: z.string().max(10).optional(),
});

const rhythmDayLogSchema = z.object({
  completedAnchorIds: z.array(z.string()).max(50),
  nudgedAnchorIds: z.array(z.string()).max(50),
});

const rhythmDataSchema = z.object({
  days: z.object({
    monday: z.array(rhythmAnchorSchema).max(20),
    tuesday: z.array(rhythmAnchorSchema).max(20),
    wednesday: z.array(rhythmAnchorSchema).max(20),
    thursday: z.array(rhythmAnchorSchema).max(20),
    friday: z.array(rhythmAnchorSchema).max(20),
    saturday: z.array(rhythmAnchorSchema).max(20),
    sunday: z.array(rhythmAnchorSchema).max(20),
  }),
  logs: z.record(rhythmDayLogSchema),
  addOnsVersion: z.number().int(),
});

const groceryCategorySchema = z.enum([
  "Produce",
  "Protein",
  "Pantry",
  "Frozen",
  "Household",
  "Personal Care",
]);

const groceryItemSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
  category: groceryCategorySchema,
  done: z.boolean(),
  createdAt: z.string(),
});

const stapleItemSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
  category: groceryCategorySchema,
});

const groceryDataSchema = z.object({
  items: z.array(groceryItemSchema).max(500),
  staples: z.array(stapleItemSchema).max(300),
  seedItemsVersion: z.number().int(),
});

const dumpItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  createdAt: z.string(),
});

const dumpDataSchema = z.object({
  items: z.array(dumpItemSchema).max(1000),
});

const listsDataSchema = z.object({
  grocery: groceryDataSchema,
  dump: dumpDataSchema,
});

const boardMeetingRecordSchema = z.object({
  date: z.string(),
  weekKeyReviewed: z.string(),
  lifeScoreAvg: z.number().min(0).max(100).nullable(),
  routineConsistencyAvg: z.number().min(0).max(100).nullable(),
  wins: z.array(z.string().max(500)).max(50),
  whatSlipped: z.string().max(5000),
  vaultTotal: z.number(),
  debtTotal: z.number(),
  vaultDelta: z.number().nullable(),
  debtDelta: z.number().nullable(),
  weeklyFocus: z.array(z.string().max(200)).max(3),
  goals: z.array(z.string().max(500)).max(3),
  warRoomMoves: z.object({
    Fitness: z.string().max(500),
    Finances: z.string().max(500),
    Faith: z.string().max(500),
    Style: z.string().max(500),
    Career: z.string().max(500),
  }),
});

const boardMeetingDataSchema = z.object({
  meetings: z.record(boardMeetingRecordSchema),
});

const lifeScoreWeightsSchema = z.object({
  routines: z.number().min(0).max(100),
  habits: z.number().min(0).max(100),
  tasks: z.number().min(0).max(100),
  dailyReview: z.number().min(0).max(100),
  workouts: z.number().min(0).max(100),
  payday: z.number().min(0).max(100),
});

const lifeScoreDataSchema = z.object({
  weights: lifeScoreWeightsSchema,
  history: z.record(z.number().min(0).max(100)),
  ptoLog: z.record(z.boolean()),
});

const routinesDataSchema = z.object({
  config: z.object({
    morning: routineSchema,
    day: routineSchema,
    night: routineSchema,
  }),
  days: z.record(routineDayLogSchema),
  seedVersion: z.number().int(),
  glowUpdateVersion: z.number().int(),
});

const textAlertsSettingsSchema = z.object({
  morningEnabled: z.boolean(),
  morningWeekdayTime: z.string().max(10),
  morningWeekendTime: z.string().max(10),
  anchorNudgesEnabled: z.boolean(),
  nightEnabled: z.boolean(),
  nightTime: z.string().max(10),
  workShutdownEnabled: z.boolean(),
  workShutdownTime: z.string().max(10),
});

const textAlertsDataSchema = z.object({
  settings: textAlertsSettingsSchema,
  log: z.record(z.array(z.string()).max(10)),
});

const plannerDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// Categories used to be a fixed 5-value enum - now they're user-managed
// (id/label/color), so a block's category is just a free-form id string.
// See lib/planner.ts's migrateCategoryId for how old literal values like
// "Work" get mapped onto the new default category ids.
const plannerCategorySchema = z.string().max(100);

const plannerBlockSchema = z.object({
  id: z.string(),
  title: z.string().max(200),
  category: plannerCategorySchema,
  notes: z.string().max(2000),
  startTime: z.string().max(10),
  endTime: z.string().max(10),
  repeatDays: z.array(plannerDaySchema).max(7),
  date: z.string().max(10),
});

const routineBlockOverrideSchema = z.object({
  id: z.string(),
  dateKeyStr: z.string().max(10),
  hidden: z.boolean(),
  title: z.string().max(200),
  category: plannerCategorySchema,
  notes: z.string().max(2000),
  startTime: z.string().max(10),
  durationMinutes: z.number().int().min(0).max(600),
});

const plannerCategoryDefSchema = z.object({
  id: z.string(),
  label: z.string().max(60),
  color: z.string().max(20),
  order: z.number(),
});

const plannerDataSchema = z.object({
  blocks: z.array(plannerBlockSchema).max(2000),
  routineOverrides: z.array(routineBlockOverrideSchema).max(4000),
  categories: z.array(plannerCategoryDefSchema).max(60),
  completedBlockDays: z.record(z.array(z.string()).max(200)),
});

const homeDaySchema = z.enum([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

const assigneeSchema = z.enum(["me", "O", "both"]);

const homeZoneTaskSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
  assignee: assigneeSchema.optional(),
});

const homeZoneSchema = z.object({
  id: z.string(),
  day: homeDaySchema,
  label: z.string().max(200),
  tasks: z.array(homeZoneTaskSchema).max(20),
});

const homeDailyItemSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
  assignee: assigneeSchema.optional(),
});

const homeMonthlyItemSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
  assignee: assigneeSchema.optional(),
  lastDoneDate: z.string(),
  expectedIntervalDays: z.number().int().min(1).max(3650),
});

const homeZonesDataSchema = z.object({
  zones: z.array(homeZoneSchema).max(50),
  logs: z.record(z.record(z.array(z.string()).max(20))),
  dailyReset: z.object({
    items: z.array(homeDailyItemSchema).max(50),
    logs: z.record(z.array(z.string()).max(50)),
  }),
  monthly: z.array(homeMonthlyItemSchema).max(50),
});

const welcomeDataSchema = z.object({
  lastShownKey: z.string(),
});

const waitingOnItemSchema = z.object({
  id: z.string(),
  who: z.string().max(200),
  what: z.string().max(2000),
  askedDate: z.string(),
  followUpDate: z.string(),
  resolvedDate: z.string(),
  notes: z.string().max(5000),
  department: departmentSchema.nullable().default(null),
  linkedCadenceItemId: z.string().nullable().default(null),
});

const waitingOnDataSchema = z.object({
  items: z.array(waitingOnItemSchema).max(500),
});

const vendorSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  category: departmentSchema,
  contactName: z.string().max(200),
  email: z.string().max(200),
  phone: z.string().max(50),
  notes: z.string().max(5000),
  archived: z.boolean(),
});

const vendorsDataSchema = z.object({
  vendors: z.array(vendorSchema).max(500),
});

const shutdownSubStepSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  order: z.number(),
});

const shutdownStepSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  order: z.number(),
  subSteps: z.array(shutdownSubStepSchema).max(20),
});

const workShutdownDataSchema = z.object({
  steps: z.array(shutdownStepSchema).max(50),
  days: z.record(z.array(z.string()).max(50)),
  seedVersion: z.number(),
});

const meetingAgendaItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  done: z.boolean(),
});

const meetingSchema = z.object({
  id: z.string(),
  title: z.string().max(300),
  date: z.string(),
  time: z.string(),
  attendees: z.string().max(2000),
  agenda: z.array(meetingAgendaItemSchema).max(100),
  notes: z.string().max(20000),
  actionItems: z.string().max(20000),
  archived: z.boolean(),
});

const meetingOpsDataSchema = z.object({
  meetings: z.array(meetingSchema).max(1000),
});

const principalSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  role: z.string().max(200),
  org: z.string().max(200),
  contactInfo: z.string().max(500),
  notes: z.string().max(20000),
  archived: z.boolean(),
});

const principalsDataSchema = z.object({
  principals: z.array(principalSchema).max(500),
});

const questionSchema = z.object({
  id: z.string(),
  text: z.string().max(2000),
  tag: z.string().max(100),
  favorite: z.boolean(),
  createdAt: z.string(),
});

const questionBankDataSchema = z.object({
  questions: z.array(questionSchema).max(1000),
});

const templateSchema = z.object({
  id: z.string(),
  title: z.string().max(300),
  body: z.string().max(20000),
  category: z.string().max(100),
  archived: z.boolean(),
});

const templatesDataSchema = z.object({
  templates: z.array(templateSchema).max(500),
});

const preMortemRiskSchema = z.object({
  id: z.string(),
  risk: z.string().max(2000),
  mitigation: z.string().max(2000),
});

const preMortemSchema = z.object({
  id: z.string(),
  projectName: z.string().max(300),
  date: z.string(),
  risks: z.array(preMortemRiskSchema).max(100),
  notes: z.string().max(20000),
  archived: z.boolean(),
});

const preMortemDataSchema = z.object({
  premortems: z.array(preMortemSchema).max(500),
});

const fireDrillEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string().max(300),
  whatHappened: z.string().max(20000),
  howResolved: z.string().max(20000),
  lessonLearned: z.string().max(20000),
});

const fireDrillLogDataSchema = z.object({
  entries: z.array(fireDrillEntrySchema).max(1000),
});

const fridayLedgerDataSchema = z.object({
  reflections: z.record(z.string().max(20000)),
});

const workEventSchema = z.object({
  id: z.string(),
  title: z.string().max(300),
  date: z.string(),
  time: z.string(),
  notes: z.string().max(5000),
  archived: z.boolean(),
});

const eventsDataSchema = z.object({
  events: z.array(workEventSchema).max(1000),
});

const focusSessionSchema = z.object({
  id: z.string(),
  taskText: z.string().max(500),
  durationMinutes: z.number(),
  startedAt: z.string(),
  completedAt: z.string(),
});

const focusDataSchema = z.object({
  sessions: z.array(focusSessionSchema).max(2000),
});

const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
  createdAt: z.string(),
});

const memoryFactSchema = z.object({
  id: z.string(),
  text: z.string().max(2000),
  category: z.enum(["preference", "person", "pattern", "note"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const conversationSummarySchema = z.object({
  id: z.string(),
  summary: z.string().max(4000),
  createdAt: z.string(),
});

const monthlyUsageSchema = z.object({
  monthKey: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  costUsd: z.number(),
});

const assistantDataSchema = z.object({
  messages: z.array(assistantMessageSchema).max(200),
  name: z.string().max(60),
  memory: z.object({
    facts: z.array(memoryFactSchema).max(300),
    summaries: z.array(conversationSummarySchema).max(20),
  }),
  usage: z.object({
    monthlySpendCapUsd: z.number().nullable(),
    log: z.array(monthlyUsageSchema).max(120),
  }),
});

const becomingMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
  createdAt: z.string(),
});

const dailyActionSchema = z.object({
  date: z.string(),
  action: z.string().max(2000),
  done: z.boolean(),
});

const reflectionSchema = z.object({
  id: z.string(),
  date: z.string(),
  text: z.string().max(8000),
  aiResponse: z.string().max(8000),
});

const becomingDataSchema = z.object({
  onboarded: z.boolean(),
  profileSummary: z.string().max(4000),
  conversation: z.array(becomingMessageSchema).max(200),
  dailyActions: z.record(dailyActionSchema),
  reflections: z.array(reflectionSchema).max(1000),
});

const questDataSchema = z.object({
  completedDates: z.record(z.string()),
});

const memosDataSchema = z.object({
  entries: z.record(z.string().max(20000)),
});

const twoLayerBlockSchema = z.object({
  id: z.string(),
  heading: z.string().max(200),
  realWords: z.string().max(4000),
  plainEnglish: z.string().max(4000),
});

const masteryLevelSchema = z.enum(["novice", "learning", "conversant", "fluent", "expert"]);

const knowledgeSubjectSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  pitch: z.string().max(2000),
  blocks: z.array(twoLayerBlockSchema).max(40),
  createdAt: z.string(),
  celebratedLevel: masteryLevelSchema.nullable(),
});

const cardTypeSchema = z.enum(["multiple_choice", "fill_blank", "true_false", "explain"]);

const flashcardSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  sourceBlockId: z.string().nullable(),
  type: cardTypeSchema,
  prompt: z.string().max(2000),
  answer: z.string().max(2000),
  choices: z.array(z.string().max(500)).max(8),
  interval: z.number(),
  dueDate: z.string(),
  easeFactor: z.number(),
  reviewCount: z.number(),
  correctCount: z.number(),
  lastResult: z.enum(["correct", "incorrect"]).nullable(),
  createdAt: z.string(),
});

const silasTestAttemptSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  date: z.string(),
  prompt: z.string().max(2000),
  response: z.string().max(8000),
  score: z.number(),
  nailed: z.array(z.string().max(500)).max(20),
  missed: z.array(z.string().max(500)).max(20),
  modelAnswer: z.string().max(4000),
});

const askDeeperCitationSchema = z.object({ title: z.string().max(300), url: z.string().max(1000) });

const askDeeperMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
  citations: z.array(askDeeperCitationSchema).max(10),
  createdAt: z.string(),
});

const questionAngleSchema = z.enum(["clinical", "commercial", "trial", "competitive"]);

const questionToAskSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  question: z.string().max(1000),
  angle: questionAngleSchema,
  whyGood: z.string().max(1000),
  whatYoullLearn: z.string().max(1000),
  asked: z.boolean(),
  answerLogged: z.string().max(4000),
  createdAt: z.string(),
});

const scholarStreakDataSchema = z.object({
  current: z.number(),
  longest: z.number(),
  lastCompletedDate: z.string(),
});

const dailySessionLogSchema = z.object({ morningDone: z.boolean(), nightDone: z.boolean() });

const knowledgeDataSchema = z.object({
  subjects: z.array(knowledgeSubjectSchema).max(100),
  cards: z.array(flashcardSchema).max(5000),
  silasTests: z.array(silasTestAttemptSchema).max(1000),
  askDeeperChats: z.record(z.array(askDeeperMessageSchema).max(200)),
  questions: z.array(questionToAskSchema).max(1000),
  scholarStreak: scholarStreakDataSchema,
  dailyLog: z.record(dailySessionLogSchema),
});

const appointmentSchema = z.object({
  id: z.string(),
  provider: z.string().max(200),
  specialty: z.string().max(200),
  date: z.string(),
  time: z.string().max(50),
  location: z.string().max(300),
  notes: z.string().max(5000),
});

const medicationSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  dosage: z.string().max(200),
  frequency: z.string().max(200),
  active: z.boolean(),
  notes: z.string().max(5000),
});

const healthNoteSchema = z.object({
  id: z.string(),
  date: z.string(),
  text: z.string().max(10000),
});

const healthDataSchema = z.object({
  appointments: z.array(appointmentSchema),
  medications: z.array(medicationSchema),
  notes: z.array(healthNoteSchema),
});

const prepStyleSchema = z.enum(["batch-cook", "quick", "assemble", ""]);

const mealEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  text: z.string().max(500),
  notes: z.string().max(2000),
  calories: z.number(),
  ingredients: z.array(z.string().max(200)).max(60),
  prepStyle: prepStyleSchema,
  recipeId: z.string(),
});

const mealPlanDataSchema = z.object({
  meals: z.array(mealEntrySchema).max(2000),
});

const recipeSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  cuisine: z.string().max(100),
  caloriesPerServing: z.number(),
  servings: z.number(),
  ingredients: z.array(z.string().max(200)).max(60),
  prepStyle: prepStyleSchema,
  estCostPerServing: z.number(),
  tags: z.array(z.string().max(50)).max(30),
  notes: z.string().max(2000),
  createdAt: z.string(),
});

const recipeBankDataSchema = z.object({
  recipes: z.array(recipeSchema).max(500),
});

const dailyThemeDayKeySchema = z.enum([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

const dailyThemePromptSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
});

const dailyThemeImageSchema = z.object({
  url: z.string().max(2000),
  thumbUrl: z.string().max(2000),
  photographer: z.string().max(200),
  photographerUrl: z.string().max(2000),
  sourceUrl: z.string().max(2000),
  fetchedAt: z.string(),
  customUrl: z.string().max(2000),
});

const dailyThemeSchema = z.object({
  dayKey: dailyThemeDayKeySchema,
  name: z.string().max(100),
  colorMood: z.string().max(100),
  intro: z.string().max(500),
  prompts: z.array(dailyThemePromptSchema).max(20),
  imageQuery: z.string().max(200),
  image: dailyThemeImageSchema,
});

const dailyThemeDataSchema = z.object({
  enabled: z.boolean(),
  themes: z.object({
    sunday: dailyThemeSchema,
    monday: dailyThemeSchema,
    tuesday: dailyThemeSchema,
    wednesday: dailyThemeSchema,
    thursday: dailyThemeSchema,
    friday: dailyThemeSchema,
    saturday: dailyThemeSchema,
  }),
  completions: z.record(z.string(), z.array(z.string()).max(50)),
  lastShownKey: z.string(),
  seedVersion: z.number().int(),
});

const allocationLineSchema = z.object({
  id: z.string(),
  kind: z.enum(["bill", "debt", "vault", "spending"]),
  refName: z.string().max(200),
  amount: z.number(),
  done: z.boolean(),
});

const paycheckPlanSchema = z.object({
  id: z.string(),
  date: z.string(),
  expectedAmount: z.number(),
  lines: z.array(allocationLineSchema).max(200),
  createdAt: z.string(),
});

const paycheckPlanDataSchema = z.object({
  plans: z.array(paycheckPlanSchema).max(1000),
});

const transactionCategorySchema = z.enum([
  "Income",
  "Housing",
  "Utilities",
  "Groceries",
  "Dining",
  "Transport",
  "Subscriptions",
  "Health",
  "Shopping",
  "Entertainment",
  "Debt Payment",
  "Savings Transfer",
  "Other",
]);

const accountSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  type: z.enum(["checking", "savings", "credit", "cash", "other"]),
  balance: z.number(),
});

const transactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  date: z.string(),
  amount: z.number(),
  category: transactionCategorySchema,
  description: z.string().max(500),
});

const budgetSchema = z.object({
  id: z.string(),
  category: transactionCategorySchema,
  monthlyLimit: z.number(),
});

const financeDataSchema = z.object({
  accounts: z.array(accountSchema),
  transactions: z.array(transactionSchema),
  budgets: z.array(budgetSchema),
});

const weddingChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  dueDate: z.string().nullable(),
  done: z.boolean(),
});

const weddingVendorSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  category: z.string().max(200),
  contactName: z.string().max(200),
  phone: z.string().max(50),
  email: z.string().max(200),
  status: z.enum(["researching", "contacted", "booked", "paid"]),
  notes: z.string().max(5000),
});

const weddingGuestSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  group: z.string().max(200),
  rsvp: z.enum(["pending", "yes", "no"]),
  plusOne: z.boolean(),
  notes: z.string().max(2000),
});

const weddingBudgetItemSchema = z.object({
  id: z.string(),
  category: z.string().max(200),
  estimated: z.number(),
  actual: z.number(),
});

const weddingTimelineEventSchema = z.object({
  id: z.string(),
  time: z.string().max(50),
  text: z.string().max(500),
});

const weddingDataSchema = z.object({
  weddingDate: z.string().nullable(),
  checklist: z.array(weddingChecklistItemSchema),
  vendors: z.array(weddingVendorSchema),
  guests: z.array(weddingGuestSchema),
  budget: z.array(weddingBudgetItemSchema),
  timeline: z.array(weddingTimelineEventSchema),
});

const itineraryEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string().max(50),
  text: z.string().max(500),
});

const packingItemSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  packed: z.boolean(),
});

const tripBudgetItemSchema = z.object({
  id: z.string(),
  category: z.string().max(200),
  estimated: z.number(),
  actual: z.number(),
});

const tripSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  destination: z.string().max(200),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  notes: z.string().max(5000),
  itinerary: z.array(itineraryEventSchema),
  packingList: z.array(packingItemSchema),
  budget: z.array(tripBudgetItemSchema),
});

const savedIdeaSchema = z.object({
  id: z.string(),
  text: z.string().max(500),
  link: z.string().max(2000),
  notes: z.string().max(2000),
});

const tripsDataSchema = z.object({
  trips: z.array(tripSchema),
  savedIdeas: z.array(savedIdeaSchema),
});

const paymentScheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("dueDay"), day: z.number() }),
  z.object({ kind: z.literal("paydaySplit"), firstAmount: z.number(), secondAmount: z.number() }),
  z.object({ kind: z.literal("varies") }),
]);

const budgetBillItemSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  monthlyAmount: z.number(),
  schedule: paymentScheduleSchema,
  essential: z.boolean(),
});

const budgetDebtPaymentItemSchema = z.object({
  id: z.string(),
  debtName: z.string().max(200),
  monthlyAmount: z.number(),
  schedule: paymentScheduleSchema,
  isFinalPayment: z.boolean(),
});

const budgetVaultTransferItemSchema = z.object({
  id: z.string(),
  vaultName: z.string().max(200),
  monthlyAmount: z.number(),
  schedule: paymentScheduleSchema,
});

const budgetSpendingTargetSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  monthlyAmount: z.number(),
  cycleMonths: z.number(),
  cycleAmount: z.number().nullable(),
});

const extraIncomeEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  note: z.string().max(500),
});

const budgetConfigSchema = z.object({
  perPaycheckIncome: z.number(),
  bills: z.array(budgetBillItemSchema),
  debtPayments: z.array(budgetDebtPaymentItemSchema),
  vaultTransfers: z.array(budgetVaultTransferItemSchema),
  spendingTargets: z.array(budgetSpendingTargetSchema),
});

const lineItemMonthStateSchema = z.object({
  firstDone: z.boolean(),
  secondDone: z.boolean(),
  firstAmount: z.number().nullable(),
  secondAmount: z.number().nullable(),
});

const monthlyBudgetStateSchema = z.object({
  paycheckFirstReceived: z.boolean(),
  paycheckSecondReceived: z.boolean(),
  bills: z.record(lineItemMonthStateSchema),
  debts: z.record(lineItemMonthStateSchema),
  vaults: z.record(lineItemMonthStateSchema),
  spendingLogged: z.record(z.number()),
  startVaultTotal: z.number(),
  startDebtPaidOff: z.number(),
});

const winEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  kind: z.enum(["debtPayment", "debtPaidOff", "vaultGrowth"]),
  name: z.string().max(200),
  amount: z.number(),
  note: z.string().max(500),
});

const budgetDataSchema = z.object({
  config: budgetConfigSchema,
  months: z.record(monthlyBudgetStateSchema),
  extraIncome: z.array(extraIncomeEntrySchema),
  wins: z.array(winEntrySchema).max(500),
  configSeedVersion: z.number(),
  linkedSeedVersion: z.number(),
});

const tabUsageEntrySchema = z.object({
  opens: z.number().int().min(0),
  lastOpenedAt: z.string(),
});

const tabUsageDataSchema = z.object({
  usage: z.record(tabUsageEntrySchema),
  hiddenTabs: z.array(z.string()).max(50),
});

const systemCheckLogEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  notUsing: z.string().max(2000),
  annoying: z.string().max(2000),
  hiddenTabKeys: z.array(z.string()).max(50),
});

const systemCheckDataSchema = z.object({
  log: z.array(systemCheckLogEntrySchema).max(500),
});

const appearanceDataSchema = z.object({
  themeMode: z.enum(["auto", "light", "evening"]),
});

const visionImageSchema = z.object({
  id: z.string(),
  url: z.string().max(2000),
  caption: z.string().max(300),
  isCover: z.boolean(),
  createdAt: z.string(),
});

const visionDataSchema = z.object({
  images: z.array(visionImageSchema).max(300),
});

const ambianceDataSchema = z.object({
  checkSoundEnabled: z.boolean(),
  chimeEnabled: z.boolean(),
  focusSoundEnabled: z.boolean(),
  focusTrack: z.enum(["rain", "cafe", "piano"]),
});

const milestoneTrackerSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  icon: z.string().max(10),
  color: z.string().max(20),
  type: z.enum(["daily", "count"]),
  order: z.number(),
  celebratedThresholds: z.array(z.number()).max(20),
});

const milestoneDataSchema = z.object({
  trackers: z.array(milestoneTrackerSchema).max(200),
  entries: z.record(z.record(z.number())),
});

const rewardTriggerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("trackerStreak"), trackerId: z.string(), days: z.number() }),
  z.object({ kind: z.literal("trackerMonthlyCount"), trackerId: z.string(), count: z.number() }),
  z.object({ kind: z.literal("debtPaidOff"), debtId: z.string() }),
  z.object({ kind: z.literal("scholarStreak"), days: z.number() }),
  z.object({ kind: z.literal("appOpenStreak"), days: z.number() }),
  z.object({ kind: z.literal("manual") }),
]);

const rewardSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  costEstimate: z.number(),
  spendingCategoryId: z.string(),
  trigger: rewardTriggerSchema,
  status: z.enum(["active", "readyToClaim", "claimed"]),
  earnedAt: z.string(),
  claimedAt: z.string(),
  order: z.number(),
});

const rewardsDataSchema = z.object({
  rewards: z.array(rewardSchema).max(500),
});

const dashboardSchema = z.object({
  version: z.literal(1),
  work: worldSchema,
  life: worldSchema,
  oneThing: oneThingSchema,
  lifeWeekly: lifeWeeklySchema,
  workOps: workOpsSchema,
  cadence: cadenceDataSchema,
  backBeat: backBeatSchema,
  habits: habitsDataSchema,
  reference: referenceSchema,
  brainDump: z.string().max(50000),
  lifeQuarterly: lifeQuarterlySchema,
  books: booksDataSchema,
  bucketList: bucketListDataSchema,
  year: yearDataSchema,
  dailyReview: dailyReviewDataSchema,
  smsAlerts: smsAlertsDataSchema,
  routines: routinesDataSchema,
  lifeScore: lifeScoreDataSchema,
  boardMeetings: boardMeetingDataSchema,
  lists: listsDataSchema,
  rhythm: rhythmDataSchema,
  glowUp: glowUpDataSchema,
  textAlerts: textAlertsDataSchema,
  planner: plannerDataSchema,
  homeZones: homeZonesDataSchema,
  welcome: welcomeDataSchema,
  waitingOn: waitingOnDataSchema,
  vendors: vendorsDataSchema,
  workShutdown: workShutdownDataSchema,
  meetingOps: meetingOpsDataSchema,
  principals: principalsDataSchema,
  questionBank: questionBankDataSchema,
  templates: templatesDataSchema,
  preMortem: preMortemDataSchema,
  fireDrillLog: fireDrillLogDataSchema,
  fridayLedger: fridayLedgerDataSchema,
  events: eventsDataSchema,
  focus: focusDataSchema,
  assistant: assistantDataSchema,
  becoming: becomingDataSchema,
  quest: questDataSchema,
  memos: memosDataSchema,
  health: healthDataSchema,
  mealPlan: mealPlanDataSchema,
  finance: financeDataSchema,
  wedding: weddingDataSchema,
  trips: tripsDataSchema,
  budget: budgetDataSchema,
  tabUsage: tabUsageDataSchema,
  systemCheck: systemCheckDataSchema,
  appearance: appearanceDataSchema,
  vision: visionDataSchema,
  ambiance: ambianceDataSchema,
  knowledge: knowledgeDataSchema,
  milestones: milestoneDataSchema,
  rewards: rewardsDataSchema,
  recipes: recipeBankDataSchema,
  paycheckPlans: paycheckPlanDataSchema,
  dailyTheme: dailyThemeDataSchema,
});

export async function GET() {
  try {
    const data = await getDashboardData();
    return noStoreJson({ ok: true, data });
  } catch (err) {
    return noStoreJson(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => undefined);
  // A request body that fails to parse (a flaky mobile connection cutting
  // off the upload mid-stream, for example) must never be treated as "no
  // data" - normalizeDashboardData(null/undefined) fills in full blank
  // defaults, and saving that would silently wipe everything. Bail out
  // instead, before anything gets normalized or written.
  if (body === undefined || body === null || typeof body !== "object") {
    return noStoreJson(
      { ok: false, error: "Request body missing or unreadable - save not applied." },
      { status: 400 }
    );
  }

  // Backfill any fields the request is missing (e.g. a browser tab that's
  // been open since before a newer field was added) so a slightly stale
  // client never gets its save silently rejected.
  const normalized = normalizeDashboardData(body);
  const parsed = dashboardSchema.safeParse(normalized);

  if (!parsed.success) {
    return noStoreJson(
      { ok: false, error: "Invalid dashboard data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // A client-generated timestamp identifying how recent this save is - lets
  // the database itself reject a save that arrives after a newer one, no
  // matter which HTTP request the server happens to finish processing
  // last. Falls back to "now" if a client hasn't been updated to send it.
  const headerSeq = Number(req.headers.get("x-save-seq"));
  const clientSeq = Number.isFinite(headerSeq) && headerSeq > 0 ? headerSeq : Date.now();

  try {
    await saveDashboardData(parsed.data, clientSeq);
    return noStoreJson({ ok: true });
  } catch (err) {
    return noStoreJson(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
