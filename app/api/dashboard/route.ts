import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardData, saveDashboardData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
});

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = dashboardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid dashboard data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    await saveDashboardData(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
