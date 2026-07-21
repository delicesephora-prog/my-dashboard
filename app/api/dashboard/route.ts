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

const workTaskSchema = z.object({
  id: z.string(),
  title: z.string().max(300),
  status: z.enum(["urgent", "in_progress", "waiting", "completed"]),
  priority: z.enum(["high", "medium", "low"]),
  category: z.enum([
    "Clinical Operations",
    "Executive Support",
    "Investor Relations",
    "Finance",
    "Translation",
    "Vendor",
    "Facilities",
    "Regulatory",
    "Administration",
  ]),
  dueDate: z.string(),
  notes: z.string().max(5000),
  topPriority: z.boolean(),
  createdAt: z.string(),
});

const workOpsSchema = z.object({
  tasks: z.array(workTaskSchema).max(1000),
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
});

const moneyDataSchema = z.object({
  vaults: z.array(vaultSchema).max(200),
  debts: z.array(debtSchema).max(200),
  seedVersion: z.number().int(),
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
});

const routinesDataSchema = z.object({
  config: z.object({
    morning: routineSchema,
    day: routineSchema,
    night: routineSchema,
  }),
  days: z.record(routineDayLogSchema),
  seedVersion: z.number().int(),
});

const textAlertsSettingsSchema = z.object({
  morningEnabled: z.boolean(),
  morningWeekdayTime: z.string().max(10),
  morningWeekendTime: z.string().max(10),
  anchorNudgesEnabled: z.boolean(),
  nightEnabled: z.boolean(),
  nightTime: z.string().max(10),
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

const plannerBlockSchema = z.object({
  id: z.string(),
  title: z.string().max(200),
  category: z.enum(["Work", "Life", "Faith", "Fitness", "Admin"]),
  notes: z.string().max(2000),
  startTime: z.string().max(10),
  endTime: z.string().max(10),
  repeatDays: z.array(plannerDaySchema).max(7),
  date: z.string().max(10),
});

const plannerDataSchema = z.object({
  blocks: z.array(plannerBlockSchema).max(2000),
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
});

const waitingOnDataSchema = z.object({
  items: z.array(waitingOnItemSchema).max(500),
});

const vendorSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  category: z.enum([
    "Clinical Operations",
    "Executive Support",
    "Investor Relations",
    "Finance",
    "Translation",
    "Vendor",
    "Facilities",
    "Regulatory",
    "Administration",
  ]),
  contactName: z.string().max(200),
  email: z.string().max(200),
  phone: z.string().max(50),
  notes: z.string().max(5000),
  archived: z.boolean(),
});

const vendorsDataSchema = z.object({
  vendors: z.array(vendorSchema).max(500),
});

const shutdownStepSchema = z.object({
  id: z.string(),
  text: z.string().max(300),
  order: z.number(),
});

const workShutdownDataSchema = z.object({
  steps: z.array(shutdownStepSchema).max(50),
  days: z.record(z.array(z.string()).max(50)),
  seedVersion: z.number(),
});

const dashboardSchema = z.object({
  version: z.literal(1),
  work: worldSchema,
  life: worldSchema,
  oneThing: oneThingSchema,
  lifeWeekly: lifeWeeklySchema,
  workOps: workOpsSchema,
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
