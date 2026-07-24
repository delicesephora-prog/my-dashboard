import {
  DashboardData,
  Habit,
  habitCompletionsFor,
  TRANSFORMATION_CATEGORIES,
  TransformationCategoryKey,
  TransformationGoal,
  WORK_TASK_CATEGORIES,
  WORK_TASK_PRIORITIES,
  WORK_TASK_STATUSES,
  WorkTask,
  WorkTaskCategory,
  WorkTaskPriority,
  WorkTaskStatus,
} from "./types";
import { todayKey, formatDayLabel, dateKey } from "./date";
import { Account, TRANSACTION_CATEGORIES, Transaction, monthKey, formatMoney } from "./finance";
import { PlannerBlock, blocksForDate, routineGhostBlocksForDate, sortedCategories, timeToMinutes, minutesToTime } from "./planner";
import { GroceryItem, GROCERY_CATEGORIES, GroceryCategory, StapleItem, guessGroceryCategory } from "./lists";
import { Appointment } from "./health";
import { newEvent, WorkEvent } from "./events";
import { MealSlot, MEAL_SLOTS, MEAL_SLOT_LABELS, MealEntry, PrepStyle, newMeal } from "./mealplan";
import { newWaitingOnItem } from "./waitingon";
import { addMemoryFact, forgetFactsMatching, MemoryFactCategory, MEMORY_FACT_CATEGORIES } from "./assistant";
import { computeRecommendation, computeWeekRecap, habitsAtRisk } from "./frontpage";
import { computeLifeScoreBreakdown } from "./lifescore";
import { questForDate, isQuestDone } from "./quest";
import {
  SpendingTarget,
  monthStateFor,
  updateMonthState,
  spendingStatus,
  dueNextItems,
  buildingUpSummary,
  moneyOutSummary,
  leftToBreathe,
  expectedMonthlyIncome,
  addWin,
} from "./budget";
import { currentPeriodKey, completedStepIdsFor } from "./payday";
import { addRecipe, Recipe } from "./recipes";
import { completionForDate, stepsForDate, ROUTINE_KEYS, ROUTINE_LABELS } from "./routines";
import { weekKeyFor } from "./week";
import { dailyProgress, weeklyProgress, monthlyProgress, weeklyStreak, isOverdueForWarning } from "./glowup";
import { computeMastery, dueCardsAcrossSubjects, unaskedQuestions, MASTERY_LABELS } from "./knowledge";
import { todayRhythm, anchorsForDate, RHYTHM_DAY_LABELS, dayKeyForDate } from "./rhythm";
import {
  survivalNumberForSlot,
  survivalNumberMonthly,
  dueDateRadar,
  payoffForecast,
  interestCostPerMonth,
  orderedDebts,
  monthlyTrendSeries,
} from "./debtplan";
import {
  AllocationKind,
  AllocationLine,
  createPaycheckPlan,
  addPaycheckPlan,
  updatePaycheckPlan,
  newAllocationLine,
  allocatedTotal,
  unallocatedTotal,
  allocationByKind,
  safeToSpend,
  plansSorted,
  mostRecentPlan,
  nextUpcomingPlan,
  slotForPaycheckDate,
  suggestLinesFromConfig,
} from "./paycheckplan";

// A tool call falls into one of three lanes:
// - "write": mutates the dashboard - shown to Sephora as a one-tap
//   confirmation card before it's applied.
// - "read": read_dashboard_section - non-destructive, auto-executes.
// - "memory": remember_fact / forget_fact - also auto-executes (framed to
//   her as automatic/background, with its own instant "forget" undo rather
//   than the add/edit confirmation flow).
export type AssistantToolKind = "write" | "read" | "memory";

export type AssistantToolResult = {
  data: DashboardData;
  resultText: string;
};

export type AssistantTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  kind: AssistantToolKind;
  // One-line preview for the confirmation card, e.g. "Adding: 'brow
  // appointment' -> Health, Aug 2".
  describe: (input: Record<string, unknown>, data: DashboardData) => string;
  apply: (data: DashboardData, input: Record<string, unknown>, now: Date) => AssistantToolResult;
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function findWorkTask(data: DashboardData, query: string): WorkTask | undefined {
  const needle = query.trim().toLowerCase();
  return data.workOps.tasks.find((t) => t.title.toLowerCase().includes(needle));
}

// ---------------------------------------------------------------------------
// Work / Life tasks

const addWorkTaskTool: AssistantTool = {
  name: "add_work_task",
  description:
    "Add a new task to the Work task manager. Use for anything work-related she asks you to add, remind her about, or track.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "The task title" },
      status: { type: "string", enum: WORK_TASK_STATUSES.map((s) => s.key) },
      priority: { type: "string", enum: WORK_TASK_PRIORITIES.map((p) => p.key) },
      category: { type: "string", enum: WORK_TASK_CATEGORIES },
      dueDate: { type: "string", description: "YYYY-MM-DD, optional" },
      notes: { type: "string" },
    },
    required: ["title"],
  },
  kind: "write",
  describe: (input) => {
    const parts = [`Adding task: "${str(input.title)}"`];
    if (input.category) parts.push(`-> ${str(input.category)}`);
    if (input.dueDate) parts.push(`due ${str(input.dueDate)}`);
    return parts.join(" ");
  },
  apply: (data, input, now) => {
    const category = WORK_TASK_CATEGORIES.includes(input.category as WorkTaskCategory)
      ? (input.category as WorkTaskCategory)
      : "Administration";
    const priority = WORK_TASK_PRIORITIES.some((p) => p.key === input.priority)
      ? (input.priority as WorkTaskPriority)
      : "medium";
    const status = WORK_TASK_STATUSES.some((s) => s.key === input.status)
      ? (input.status as WorkTaskStatus)
      : "not_started";
    const task: WorkTask = {
      id: crypto.randomUUID(),
      title: str(input.title),
      status,
      priority,
      category,
      dueDate: str(input.dueDate),
      notes: str(input.notes),
      topPriority: false,
      createdAt: now.toISOString(),
      progressPct: 0,
      progressLog: [],
      stallSnoozedUntil: "",
    };
    return {
      data: { ...data, workOps: { ...data.workOps, tasks: [task, ...data.workOps.tasks] } },
      resultText: `Added work task "${task.title}".`,
    };
  },
};

const editWorkTaskTool: AssistantTool = {
  name: "edit_work_task",
  description:
    "Edit an existing Work task's status, priority, category, due date, or notes. Match it by a snippet of its title.",
  input_schema: {
    type: "object",
    properties: {
      taskTitleMatch: { type: "string", description: "Text that appears in the task's title" },
      status: { type: "string", enum: WORK_TASK_STATUSES.map((s) => s.key) },
      priority: { type: "string", enum: WORK_TASK_PRIORITIES.map((p) => p.key) },
      category: { type: "string", enum: WORK_TASK_CATEGORIES },
      dueDate: { type: "string" },
      notes: { type: "string" },
    },
    required: ["taskTitleMatch"],
  },
  kind: "write",
  describe: (input, data) => {
    const task = findWorkTask(data, str(input.taskTitleMatch));
    return task ? `Editing task: "${task.title}"` : `Editing task matching "${str(input.taskTitleMatch)}" (not found)`;
  },
  apply: (data, input) => {
    const task = findWorkTask(data, str(input.taskTitleMatch));
    if (!task) {
      return { data, resultText: `No task found matching "${str(input.taskTitleMatch)}".` };
    }
    const updated: WorkTask = {
      ...task,
      status: WORK_TASK_STATUSES.some((s) => s.key === input.status) ? (input.status as WorkTaskStatus) : task.status,
      priority: WORK_TASK_PRIORITIES.some((p) => p.key === input.priority)
        ? (input.priority as WorkTaskPriority)
        : task.priority,
      category: WORK_TASK_CATEGORIES.includes(input.category as WorkTaskCategory)
        ? (input.category as WorkTaskCategory)
        : task.category,
      dueDate: typeof input.dueDate === "string" ? input.dueDate : task.dueDate,
      notes: typeof input.notes === "string" ? input.notes : task.notes,
    };
    return {
      data: {
        ...data,
        workOps: { ...data.workOps, tasks: data.workOps.tasks.map((t) => (t.id === task.id ? updated : t)) },
      },
      resultText: `Updated "${task.title}".`,
    };
  },
};

const completeWorkTaskTool: AssistantTool = {
  name: "complete_work_task",
  description: "Mark a Work task completed. Match it by a snippet of its title.",
  input_schema: {
    type: "object",
    properties: {
      taskTitleMatch: { type: "string", description: "Text that appears in the task's title" },
    },
    required: ["taskTitleMatch"],
  },
  kind: "write",
  describe: (input, data) => {
    const task = findWorkTask(data, str(input.taskTitleMatch));
    return task ? `Completing task: "${task.title}"` : `Completing task matching "${str(input.taskTitleMatch)}" (not found)`;
  },
  apply: (data, input) => {
    const task = findWorkTask(data, str(input.taskTitleMatch));
    if (!task) {
      return { data, resultText: `No task found matching "${str(input.taskTitleMatch)}".` };
    }
    const updated: WorkTask = { ...task, status: "completed", progressPct: 100 };
    return {
      data: {
        ...data,
        workOps: { ...data.workOps, tasks: data.workOps.tasks.map((t) => (t.id === task.id ? updated : t)) },
      },
      resultText: `Marked "${task.title}" completed.`,
    };
  },
};

const addLifeTaskTool: AssistantTool = {
  name: "add_life_task",
  description: "Add a simple personal/life to-do (not work-related).",
  input_schema: {
    type: "object",
    properties: {
      text: { type: "string" },
      focus: { type: "boolean", description: "Pin to Today's Focus" },
    },
    required: ["text"],
  },
  kind: "write",
  describe: (input) => `Adding life task: "${str(input.text)}"`,
  apply: (data, input, now) => {
    const task = {
      id: crypto.randomUUID(),
      text: str(input.text),
      done: false,
      focus: Boolean(input.focus),
      createdAt: now.toISOString(),
    };
    return {
      data: { ...data, life: { ...data.life, tasks: [...data.life.tasks, task] } },
      resultText: `Added life task "${task.text}".`,
    };
  },
};

// ---------------------------------------------------------------------------
// Planner

function formatClock(min: number): string {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${display}${period}` : `${display}:${String(m).padStart(2, "0")}${period}`;
}

function dateFromKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function resolvePlannerCategory(data: DashboardData, wanted: string): { id: string; label: string } {
  const sorted = sortedCategories(data.planner.categories);
  const needle = wanted.toLowerCase();
  const matched = sorted.find((c) => c.label.toLowerCase() === needle);
  if (matched) return { id: matched.id, label: matched.label };
  const fallback = sorted[0];
  return { id: fallback?.id ?? "work", label: fallback?.label ?? "Other" };
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

type ResolvedDayBlock = {
  title: string;
  category: string;
  categoryLabel: string;
  startTime: string;
  endTime: string;
  startMin: number;
  endMin: number;
  notes: string;
};

function resolveDayPlanBlocks(rawBlocks: unknown, data: DashboardData): ResolvedDayBlock[] {
  const list = Array.isArray(rawBlocks) ? rawBlocks : [];
  return list
    .map((raw): ResolvedDayBlock | null => {
      const r = raw as Record<string, unknown>;
      const title = str(r.title);
      const startTime = str(r.startTime);
      if (!title || !startTime) return null;
      const startMin = timeToMinutes(startTime);
      const endTimeRaw = str(r.endTime);
      // No end time given - a reasonable default duration (30 min) rather
      // than blocking on it; the model is told to infer a real one when it
      // can, this is just the mechanical safety net for when it can't.
      const endMin = endTimeRaw ? timeToMinutes(endTimeRaw) : startMin + 30;
      const endTime = endTimeRaw || minutesToTime(startMin + 30);
      const { id: category, label: categoryLabel } = resolvePlannerCategory(data, str(r.category));
      return { title, category, categoryLabel, startTime, endTime, startMin, endMin, notes: str(r.notes) };
    })
    .filter((b): b is ResolvedDayBlock => b !== null)
    .sort((a, b) => a.startMin - b.startMin);
}

type DayPlanConflict = { block: ResolvedDayBlock; against: string };

// Checked against three things: other new blocks in the same plan, blocks
// that already exist that day, and her routine-derived ghost blocks
// (morning/day/night steps) - never silently dropped, always surfaced in
// the preview so she decides what to do about it.
function dayPlanConflicts(blocks: ResolvedDayBlock[], data: DashboardData, dateObj: Date): DayPlanConflict[] {
  const existing = blocksForDate(data.planner, dateObj);
  const ghosts = routineGhostBlocksForDate(data.routines.config, data.planner.routineOverrides, dateObj);
  const conflicts: DayPlanConflict[] = [];

  blocks.forEach((b, i) => {
    blocks.forEach((other, j) => {
      if (j <= i) return;
      if (rangesOverlap(b.startMin, b.endMin, other.startMin, other.endMin)) {
        conflicts.push({ block: b, against: `"${other.title}" (${formatClock(other.startMin)}-${formatClock(other.endMin)})` });
      }
    });
    for (const e of existing) {
      const eStart = timeToMinutes(e.startTime);
      const eEnd = timeToMinutes(e.endTime);
      if (rangesOverlap(b.startMin, b.endMin, eStart, eEnd)) {
        conflicts.push({ block: b, against: `her existing "${e.title}" (${formatClock(eStart)}-${formatClock(eEnd)})` });
      }
    }
    for (const g of ghosts) {
      const gStart = timeToMinutes(g.startTime);
      const gEnd = gStart + g.durationMinutes;
      if (rangesOverlap(b.startMin, b.endMin, gStart, gEnd)) {
        conflicts.push({ block: b, against: `her ${g.title} routine step (${formatClock(gStart)})` });
      }
    }
  });
  return conflicts;
}

function dayPlanGapNotes(blocks: ResolvedDayBlock[]): string[] {
  const notes: string[] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    if (b.startMin === a.endMin) {
      notes.push(`No gap between "${a.title}" and "${b.title}" - back to back at ${formatClock(a.endMin)}.`);
    }
  }
  return notes;
}

function buildDayPlanPreview(input: Record<string, unknown>, data: DashboardData): string {
  const dateStr = str(input.date) || todayKey(new Date());
  const blocks = resolveDayPlanBlocks(input.blocks, data);
  if (blocks.length === 0) return "No valid blocks in this plan - each one needs at least a title and a start time.";

  const dateObj = dateFromKey(dateStr);
  const lines = blocks.map((b) => `${formatClock(b.startMin)}-${formatClock(b.endMin)}  ${b.title} · ${b.categoryLabel}`);
  const conflicts = dayPlanConflicts(blocks, data, dateObj);
  const gapNotes = dayPlanGapNotes(blocks);

  const parts = [`Plan for ${formatDayLabel(dateStr)} — ${blocks.length} block${blocks.length === 1 ? "" : "s"}:`, lines.join("\n")];
  if (conflicts.length > 0) {
    parts.push(
      "⚠ Conflicts:\n" +
        conflicts.map((c) => `"${c.block.title}" (${formatClock(c.block.startMin)}) overlaps ${c.against}`).join("\n")
    );
  }
  if (gapNotes.length > 0) {
    parts.push("⚠ " + gapNotes.join("\n⚠ "));
  }
  return parts.join("\n\n");
}

const planDayTool: AssistantTool = {
  name: "plan_day",
  description:
    "Create MULTIPLE Planner blocks for a single day at once - this is the primary way to build out a whole day's schedule from a description, and should always be preferred over calling add_planner_block repeatedly for anything with more than one block. When she dictates a messy, out-of-order, or self-correcting description of her day (e.g. \"meeting at 11:30, wait no 1:30\"), resolve it to her actual final intent first - the LATER statement about any given commitment always overrides an earlier one, never include both. Give every block a startTime; give an endTime when you can reasonably infer one (from context or typical duration for that kind of thing), otherwise a short default is applied automatically. Don't schedule anything on top of her morning/day/night Routine blocks - work around them. This tool shows her the full proposed day and flags any conflicts or back-to-back gaps before anything is created - nothing is added until she confirms.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD - defaults to today if omitted" },
      blocks: {
        type: "array",
        description: "Every block for the day, in any order - they're sorted and checked for conflicts automatically.",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            category: { type: "string", description: "One of her existing Planner category names (Work, Life, Faith, Fitness, Admin, ...)" },
            startTime: { type: "string", description: "HH:MM, 24-hour" },
            endTime: { type: "string", description: "HH:MM, 24-hour - infer a reasonable duration if she didn't give one" },
            notes: { type: "string" },
          },
          required: ["title", "startTime"],
        },
      },
    },
    required: ["blocks"],
  },
  kind: "write",
  describe: (input, data) => buildDayPlanPreview(input, data),
  apply: (data, input, now) => {
    const dateStr = str(input.date) || todayKey(now);
    const resolved = resolveDayPlanBlocks(input.blocks, data);
    if (resolved.length === 0) {
      return { data, resultText: "No blocks were added - nothing valid in the plan." };
    }
    const newBlocks: PlannerBlock[] = resolved.map((b) => ({
      id: crypto.randomUUID(),
      title: b.title,
      category: b.category,
      notes: b.notes,
      startTime: b.startTime,
      endTime: b.endTime,
      repeatDays: [],
      date: dateStr,
    }));
    return {
      data: { ...data, planner: { ...data.planner, blocks: [...data.planner.blocks, ...newBlocks] } },
      resultText: `Added ${newBlocks.length} planner block${newBlocks.length === 1 ? "" : "s"} for ${dateStr}.`,
    };
  },
};

function findOneOffBlock(data: DashboardData, dateStr: string, matchTime: string): PlannerBlock | undefined {
  return data.planner.blocks.find((b) => b.date === dateStr && b.startTime === matchTime);
}

const editPlannerBlockTool: AssistantTool = {
  name: "edit_planner_block",
  description:
    "Edit ONE existing Planner block without touching anything else on the day - use this for a follow-up like \"change the 12:30 block to X\" after a day is already planned. Match the block by its date and its CURRENT start time.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD - defaults to today if omitted" },
      matchTime: { type: "string", description: "HH:MM, 24-hour - the block's current start time" },
      newTitle: { type: "string" },
      newCategory: { type: "string" },
      newStartTime: { type: "string", description: "HH:MM, 24-hour" },
      newEndTime: { type: "string", description: "HH:MM, 24-hour" },
      newNotes: { type: "string" },
    },
    required: ["matchTime"],
  },
  kind: "write",
  describe: (input, data) => {
    const dateStr = str(input.date) || todayKey(new Date());
    const block = findOneOffBlock(data, dateStr, str(input.matchTime));
    if (!block) return `No block found at ${str(input.matchTime)} on ${dateStr}.`;
    const changes: string[] = [];
    if (input.newTitle) changes.push(`title -> "${str(input.newTitle)}"`);
    if (input.newCategory) changes.push(`category -> ${str(input.newCategory)}`);
    if (input.newStartTime) changes.push(`start -> ${str(input.newStartTime)}`);
    if (input.newEndTime) changes.push(`end -> ${str(input.newEndTime)}`);
    return `Editing "${block.title}" (${block.startTime}): ${changes.join(", ") || "no changes given"}`;
  },
  apply: (data, input, now) => {
    const dateStr = str(input.date) || todayKey(now);
    const block = findOneOffBlock(data, dateStr, str(input.matchTime));
    if (!block) {
      return { data, resultText: `No block found at ${str(input.matchTime)} on ${dateStr}.` };
    }
    const updated: PlannerBlock = {
      ...block,
      title: typeof input.newTitle === "string" && input.newTitle ? input.newTitle : block.title,
      category: typeof input.newCategory === "string" && input.newCategory
        ? resolvePlannerCategory(data, input.newCategory).id
        : block.category,
      startTime: typeof input.newStartTime === "string" && input.newStartTime ? input.newStartTime : block.startTime,
      endTime: typeof input.newEndTime === "string" && input.newEndTime ? input.newEndTime : block.endTime,
      notes: typeof input.newNotes === "string" ? input.newNotes : block.notes,
    };
    return {
      data: { ...data, planner: { ...data.planner, blocks: data.planner.blocks.map((b) => (b.id === block.id ? updated : b)) } },
      resultText: `Updated "${updated.title}" on ${dateStr}.`,
    };
  },
};

function blocksInRange(data: DashboardData, dateStr: string, fromMin: number, toMin: number): PlannerBlock[] {
  const dateObj = dateFromKey(dateStr);
  return blocksForDate(data.planner, dateObj).filter((b) => {
    const start = timeToMinutes(b.startTime);
    return start >= fromMin && start < toMin;
  });
}

const removePlannerBlocksTool: AssistantTool = {
  name: "remove_planner_blocks",
  description:
    "Remove Planner blocks in a time range on one day - use for things like \"clear my afternoon\" or \"clear everything after 6pm.\" This is the ONLY thing you can delete - it never touches tasks, list items, memory, or anything else, and only real Planner blocks (never a Routine block). Always shows exactly what will be removed before anything is deleted.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD - defaults to today if omitted" },
      fromTime: { type: "string", description: "HH:MM, 24-hour - start of the range to clear" },
      toTime: { type: "string", description: "HH:MM, 24-hour - end of the range to clear, e.g. 23:59 for 'the rest of the day'" },
    },
    required: ["fromTime", "toTime"],
  },
  kind: "write",
  describe: (input, data) => {
    const dateStr = str(input.date) || todayKey(new Date());
    const matches = blocksInRange(data, dateStr, timeToMinutes(str(input.fromTime)), timeToMinutes(str(input.toTime)));
    if (matches.length === 0) return `Nothing to remove between ${str(input.fromTime)} and ${str(input.toTime)} on ${dateStr}.`;
    const lines = matches.map((b) => `${b.startTime}-${b.endTime}  ${b.title}`);
    return `Removing ${matches.length} block${matches.length === 1 ? "" : "s"} on ${formatDayLabel(dateStr)}:\n${lines.join("\n")}`;
  },
  apply: (data, input, now) => {
    const dateStr = str(input.date) || todayKey(now);
    const matches = blocksInRange(data, dateStr, timeToMinutes(str(input.fromTime)), timeToMinutes(str(input.toTime)));
    if (matches.length === 0) {
      return { data, resultText: `Nothing to remove between ${str(input.fromTime)} and ${str(input.toTime)} on ${dateStr}.` };
    }
    const removeIds = new Set(matches.map((b) => b.id));
    return {
      data: { ...data, planner: { ...data.planner, blocks: data.planner.blocks.filter((b) => !removeIds.has(b.id)) } },
      resultText: `Removed ${matches.length} block${matches.length === 1 ? "" : "s"} on ${dateStr}.`,
    };
  },
};

const shiftPlannerBlocksTool: AssistantTool = {
  name: "shift_planner_blocks",
  description:
    "Move every Planner block on one day that starts at or after a cutoff time, by a fixed amount - use for things like \"move everything after 2pm back an hour\" (deltaMinutes: +60, delaying them) or \"move my afternoon up 30 minutes\" (deltaMinutes: -30, earlier). Positive deltaMinutes pushes blocks later; negative pulls them earlier. Shows the before/after for every affected block, and flags any new conflicts the shift would create, before anything moves.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD - defaults to today if omitted" },
      afterTime: { type: "string", description: "HH:MM, 24-hour - blocks starting at or after this time are shifted" },
      deltaMinutes: { type: "number", description: "Positive = later, negative = earlier" },
    },
    required: ["afterTime", "deltaMinutes"],
  },
  kind: "write",
  describe: (input, data) => {
    const dateStr = str(input.date) || todayKey(new Date());
    const cutoff = timeToMinutes(str(input.afterTime));
    const delta = num(input.deltaMinutes);
    const dateObj = dateFromKey(dateStr);
    const affected = blocksForDate(data.planner, dateObj).filter((b) => timeToMinutes(b.startTime) >= cutoff);
    if (affected.length === 0) return `No blocks at or after ${str(input.afterTime)} on ${dateStr} to move.`;

    const shifted = affected.map((b) => ({
      title: b.title,
      oldStart: timeToMinutes(b.startTime),
      oldEnd: timeToMinutes(b.endTime),
      newStart: timeToMinutes(b.startTime) + delta,
      newEnd: timeToMinutes(b.endTime) + delta,
    }));
    const lines = shifted.map((s) => `"${s.title}": ${formatClock(s.oldStart)} -> ${formatClock(s.newStart)}`);

    const unaffectedIds = new Set(affected.map((b) => b.id));
    const stillFixed = blocksForDate(data.planner, dateObj).filter((b) => !unaffectedIds.has(b.id));
    const ghosts = routineGhostBlocksForDate(data.routines.config, data.planner.routineOverrides, dateObj);
    const conflicts: string[] = [];
    for (const s of shifted) {
      for (const f of stillFixed) {
        const fStart = timeToMinutes(f.startTime);
        const fEnd = timeToMinutes(f.endTime);
        if (rangesOverlap(s.newStart, s.newEnd, fStart, fEnd)) {
          conflicts.push(`"${s.title}" would overlap "${f.title}" (${formatClock(fStart)}-${formatClock(fEnd)})`);
        }
      }
      for (const g of ghosts) {
        const gStart = timeToMinutes(g.startTime);
        const gEnd = gStart + g.durationMinutes;
        if (rangesOverlap(s.newStart, s.newEnd, gStart, gEnd)) {
          conflicts.push(`"${s.title}" would overlap her ${g.title} routine step (${formatClock(gStart)})`);
        }
      }
    }

    const parts = [`Moving ${affected.length} block${affected.length === 1 ? "" : "s"} on ${formatDayLabel(dateStr)} by ${delta > 0 ? "+" : ""}${delta} min:`, lines.join("\n")];
    if (conflicts.length > 0) parts.push("⚠ Conflicts:\n" + conflicts.join("\n"));
    return parts.join("\n\n");
  },
  apply: (data, input, now) => {
    const dateStr = str(input.date) || todayKey(now);
    const cutoff = timeToMinutes(str(input.afterTime));
    const delta = num(input.deltaMinutes);
    const affectedIds = new Set(blocksForDate(data.planner, dateFromKey(dateStr)).filter((b) => timeToMinutes(b.startTime) >= cutoff).map((b) => b.id));
    if (affectedIds.size === 0) {
      return { data, resultText: `No blocks at or after ${str(input.afterTime)} on ${dateStr} to move.` };
    }
    const blocks = data.planner.blocks.map((b) => {
      if (!affectedIds.has(b.id)) return b;
      return {
        ...b,
        startTime: minutesToTime(timeToMinutes(b.startTime) + delta),
        endTime: minutesToTime(timeToMinutes(b.endTime) + delta),
      };
    });
    return {
      data: { ...data, planner: { ...data.planner, blocks } },
      resultText: `Moved ${affectedIds.size} block${affectedIds.size === 1 ? "" : "s"} on ${dateStr} by ${delta > 0 ? "+" : ""}${delta} min.`,
    };
  },
};

const addPlannerBlockTool: AssistantTool = {
  name: "add_planner_block",
  description:
    "Add a time block to the Planner. Give startTime/endTime as 24-hour HH:MM. Set date for a one-off block, or repeatDays for a weekly-repeating block.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      category: { type: "string", description: "One of her existing Planner category names" },
      date: { type: "string", description: "YYYY-MM-DD - for a one-off block" },
      repeatDays: {
        type: "array",
        items: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
        description: "Weekdays to repeat on - for a recurring block",
      },
      startTime: { type: "string", description: "HH:MM, 24-hour" },
      endTime: { type: "string", description: "HH:MM, 24-hour" },
      notes: { type: "string" },
    },
    required: ["title", "startTime", "endTime"],
  },
  kind: "write",
  describe: (input) => {
    const when = Array.isArray(input.repeatDays) && input.repeatDays.length > 0
      ? `every ${(input.repeatDays as string[]).join("/")}`
      : str(input.date) || "today";
    return `Adding block: "${str(input.title)}" ${str(input.startTime)}-${str(input.endTime)}, ${when}`;
  },
  apply: (data, input, now) => {
    const sorted = sortedCategories(data.planner.categories);
    const wantedCategory = str(input.category).toLowerCase();
    const category =
      sorted.find((c) => c.label.toLowerCase() === wantedCategory)?.id ?? sorted[0]?.id ?? "work";
    const repeatDays = Array.isArray(input.repeatDays) ? (input.repeatDays as string[]) : [];
    const block: PlannerBlock = {
      id: crypto.randomUUID(),
      title: str(input.title),
      category,
      notes: str(input.notes),
      startTime: str(input.startTime),
      endTime: str(input.endTime),
      repeatDays: repeatDays as PlannerBlock["repeatDays"],
      date: repeatDays.length > 0 ? "" : str(input.date) || todayKey(now),
    };
    return {
      data: { ...data, planner: { ...data.planner, blocks: [...data.planner.blocks, block] } },
      resultText: `Added planner block "${block.title}".`,
    };
  },
};

// ---------------------------------------------------------------------------
// Lists

const LIST_KEYS = ["grocery", "dump", "staples"] as const;

const addListItemTool: AssistantTool = {
  name: "add_list_item",
  description: "Add an item to the Grocery list, the brain-Dump list, or the Staples list.",
  input_schema: {
    type: "object",
    properties: {
      list: { type: "string", enum: LIST_KEYS },
      text: { type: "string" },
      category: { type: "string", enum: GROCERY_CATEGORIES, description: "Grocery/staples category, optional" },
    },
    required: ["list", "text"],
  },
  kind: "write",
  describe: (input) => `Adding to ${str(input.list)}: "${str(input.text)}"`,
  apply: (data, input, now) => {
    const list = LIST_KEYS.includes(input.list as (typeof LIST_KEYS)[number]) ? input.list : "dump";
    const text = str(input.text);
    if (list === "grocery") {
      const category = GROCERY_CATEGORIES.includes(input.category as GroceryCategory)
        ? (input.category as GroceryCategory)
        : guessGroceryCategory(text);
      const item: GroceryItem = { id: crypto.randomUUID(), text, category, done: false, createdAt: now.toISOString() };
      return {
        data: { ...data, lists: { ...data.lists, grocery: { ...data.lists.grocery, items: [...data.lists.grocery.items, item] } } },
        resultText: `Added "${text}" to the grocery list.`,
      };
    }
    if (list === "staples") {
      const category = GROCERY_CATEGORIES.includes(input.category as GroceryCategory)
        ? (input.category as GroceryCategory)
        : guessGroceryCategory(text);
      const item: StapleItem = { id: crypto.randomUUID(), text, category };
      return {
        data: { ...data, lists: { ...data.lists, grocery: { ...data.lists.grocery, staples: [...data.lists.grocery.staples, item] } } },
        resultText: `Added "${text}" to staples.`,
      };
    }
    const item = { id: crypto.randomUUID(), text, createdAt: now.toISOString() };
    return {
      data: { ...data, lists: { ...data.lists, dump: { ...data.lists.dump, items: [...data.lists.dump.items, item] } } },
      resultText: `Added "${text}" to the Dump.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Health / Events / Meals

const addHealthAppointmentTool: AssistantTool = {
  name: "add_health_appointment",
  description: "Add a health appointment.",
  input_schema: {
    type: "object",
    properties: {
      provider: { type: "string" },
      specialty: { type: "string" },
      date: { type: "string", description: "YYYY-MM-DD" },
      time: { type: "string", description: "HH:MM, 24-hour, optional" },
      location: { type: "string" },
      notes: { type: "string" },
    },
    required: ["provider", "date"],
  },
  kind: "write",
  describe: (input) => `Adding: "${str(input.provider)}" appointment -> Health, ${str(input.date)}`,
  apply: (data, input) => {
    const appt: Appointment = {
      id: crypto.randomUUID(),
      provider: str(input.provider),
      specialty: str(input.specialty),
      date: str(input.date),
      time: str(input.time),
      location: str(input.location),
      notes: str(input.notes),
    };
    return {
      data: { ...data, health: { ...data.health, appointments: [appt, ...data.health.appointments] } },
      resultText: `Added appointment with ${appt.provider} on ${appt.date}.`,
    };
  },
};

const addWorkEventTool: AssistantTool = {
  name: "add_work_event",
  description: "Add an event to the Work Events list.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      date: { type: "string", description: "YYYY-MM-DD" },
      time: { type: "string", description: "HH:MM, 24-hour, optional" },
      notes: { type: "string" },
    },
    required: ["title", "date"],
  },
  kind: "write",
  describe: (input) => `Adding event: "${str(input.title)}" -> ${str(input.date)}`,
  apply: (data, input) => {
    const event: WorkEvent = { ...newEvent(str(input.title), str(input.date), str(input.time)), notes: str(input.notes) };
    return {
      data: { ...data, events: { ...data.events, events: [event, ...data.events.events] } },
      resultText: `Added event "${event.title}" on ${event.date}.`,
    };
  },
};

const addMealTool: AssistantTool = {
  name: "add_meal",
  description: "Add a meal to the meal plan.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD" },
      slot: { type: "string", enum: MEAL_SLOTS },
      text: { type: "string" },
    },
    required: ["date", "slot", "text"],
  },
  kind: "write",
  describe: (input) => `Adding meal: "${str(input.text)}" -> ${str(input.slot)}, ${str(input.date)}`,
  apply: (data, input) => {
    const slot = MEAL_SLOTS.includes(input.slot as MealSlot) ? (input.slot as MealSlot) : "dinner";
    const meal = newMeal(str(input.date) || todayKey(), slot, str(input.text));
    return {
      data: { ...data, mealPlan: { ...data.mealPlan, meals: [...data.mealPlan.meals, meal] } },
      resultText: `Added "${meal.text}" for ${meal.slot} on ${meal.date}.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Dec 8 goals / Finance / Waiting On

const addDec8GoalTool: AssistantTool = {
  name: "add_dec8_goal",
  description: "Add a goal to one of her December 8 transformation categories.",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: TRANSFORMATION_CATEGORIES },
      text: { type: "string" },
    },
    required: ["category", "text"],
  },
  kind: "write",
  describe: (input) => `Adding goal: "${str(input.text)}" -> Dec 8, ${str(input.category)}`,
  apply: (data, input) => {
    const category = TRANSFORMATION_CATEGORIES.includes(input.category as TransformationCategoryKey)
      ? (input.category as TransformationCategoryKey)
      : "Career";
    const goal: TransformationGoal = { id: crypto.randomUUID(), text: str(input.text), done: false };
    return {
      data: {
        ...data,
        year: {
          ...data.year,
          transformations: {
            ...data.year.transformations,
            [category]: [...data.year.transformations[category], goal],
          },
        },
      },
      resultText: `Added "${goal.text}" to ${category}.`,
    };
  },
};

function applyTransaction(data: DashboardData, input: Record<string, unknown>, now: Date, sign: 1 | -1): AssistantToolResult {
  let accounts = data.finance.accounts;
  const wantedName = str(input.account).toLowerCase();
  let account = wantedName ? accounts.find((a) => a.name.toLowerCase() === wantedName) : accounts[0];
  if (!account) {
    account = { id: crypto.randomUUID(), name: "Cash", type: "cash", balance: 0 } as Account;
    accounts = [...accounts, account];
  }
  const category = TRANSACTION_CATEGORIES.includes(input.category as (typeof TRANSACTION_CATEGORIES)[number])
    ? (input.category as (typeof TRANSACTION_CATEGORIES)[number])
    : sign > 0
      ? "Income"
      : "Other";
  const tx: Transaction = {
    id: crypto.randomUUID(),
    accountId: account.id,
    date: str(input.date) || todayKey(now),
    amount: sign * Math.abs(num(input.amount)),
    category,
    description: str(input.description),
  };
  return {
    data: { ...data, finance: { ...data.finance, accounts, transactions: [tx, ...data.finance.transactions] } },
    resultText: `Logged ${sign > 0 ? "income" : "expense"} of $${Math.abs(tx.amount).toFixed(2)}${tx.description ? ` (${tx.description})` : ""}.`,
  };
}

const logExpenseTool: AssistantTool = {
  name: "log_expense",
  description: "Log an expense (money out) in Finance.",
  input_schema: {
    type: "object",
    properties: {
      amount: { type: "number", description: "Positive dollar amount" },
      category: { type: "string", enum: TRANSACTION_CATEGORIES },
      description: { type: "string" },
      date: { type: "string", description: "YYYY-MM-DD, optional - defaults today" },
      account: { type: "string", description: "Account name, optional" },
    },
    required: ["amount", "description"],
  },
  kind: "write",
  describe: (input) => `Logging expense: $${num(input.amount).toFixed(2)} - ${str(input.description)}`,
  apply: (data, input, now) => applyTransaction(data, input, now, -1),
};

const logIncomeTool: AssistantTool = {
  name: "log_income",
  description: "Log income (money in) in Finance.",
  input_schema: {
    type: "object",
    properties: {
      amount: { type: "number", description: "Positive dollar amount" },
      description: { type: "string" },
      date: { type: "string", description: "YYYY-MM-DD, optional - defaults today" },
      account: { type: "string", description: "Account name, optional" },
    },
    required: ["amount", "description"],
  },
  kind: "write",
  describe: (input) => `Logging income: $${num(input.amount).toFixed(2)} - ${str(input.description)}`,
  apply: (data, input, now) => applyTransaction(data, input, now, 1),
};

// ---------------------------------------------------------------------------
// Budgeting (Money Command Center)

function resolveSpendingCategory(data: DashboardData, wanted: string): SpendingTarget | undefined {
  const needle = wanted.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    data.budget.config.spendingTargets.find((t) => t.name.toLowerCase() === needle) ??
    data.budget.config.spendingTargets.find(
      (t) => t.name.toLowerCase().includes(needle) || needle.includes(t.name.toLowerCase())
    )
  );
}

function findVault(data: DashboardData, wanted: string) {
  const needle = wanted.trim().toLowerCase();
  return data.lifeQuarterly.money.vaults.find((v) => v.name.toLowerCase().includes(needle));
}

function findDebt(data: DashboardData, wanted: string) {
  const needle = wanted.trim().toLowerCase();
  return data.lifeQuarterly.money.debts.find((d) => d.name.toLowerCase().includes(needle));
}

const logBudgetExpenseTool: AssistantTool = {
  name: "log_budget_expense",
  description:
    "Log real spending against one of her Command Center monthly spending categories (Hair & Beauty, Shopping/Amazon, Eating Out/Dates, Medical/Copays, Household/Misc, or whatever she's renamed/added) - this is what actually moves 'what's left' in that category for the month, matching what the Command Center itself shows. Match category by name; if she doesn't specify one, ask rather than guessing.",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string" },
      amount: { type: "number", description: "Positive dollar amount spent" },
      date: { type: "string", description: "YYYY-MM-DD, optional - defaults to today, determines which month it lands in" },
    },
    required: ["category", "amount"],
  },
  kind: "write",
  describe: (input, data) => {
    const target = resolveSpendingCategory(data, str(input.category));
    if (!target) return `No spending category found matching "${str(input.category)}".`;
    const dateStr = str(input.date) || todayKey(new Date());
    const key = monthKey(dateFromKey(dateStr));
    const state = monthStateFor(data.budget, key, data.lifeQuarterly.money);
    const spentSoFar = state.spendingLogged[target.id] ?? 0;
    const amt = Math.abs(num(input.amount));
    const remainingBefore = target.monthlyAmount - spentSoFar;
    const remainingAfter = remainingBefore - amt;
    return `Logging ${formatMoney(amt)} to "${target.name}": ${formatMoney(remainingBefore)} left this month -> ${formatMoney(remainingAfter)} left${remainingAfter < 0 ? " (over target)" : ""}.`;
  },
  apply: (data, input, now) => {
    const target = resolveSpendingCategory(data, str(input.category));
    if (!target) return { data, resultText: `No spending category found matching "${str(input.category)}".` };
    const dateStr = str(input.date) || todayKey(now);
    const key = monthKey(dateFromKey(dateStr));
    const amt = Math.abs(num(input.amount));
    const budget = updateMonthState(data.budget, key, data.lifeQuarterly.money, (s) => ({
      ...s,
      spendingLogged: { ...s.spendingLogged, [target.id]: (s.spendingLogged[target.id] ?? 0) + amt },
    }));
    return { data: { ...data, budget }, resultText: `Logged ${formatMoney(amt)} to ${target.name}.` };
  },
};

const adjustVaultBalanceTool: AssistantTool = {
  name: "adjust_vault_balance",
  description:
    "Move money into or out of one of her savings vaults (Emergency Fund, Jamaica Trip, Vacation Fund, etc). Positive amount adds to it, negative takes away - use this for 'put my extra $200 toward Emergency Fund' or correcting a vault balance.",
  input_schema: {
    type: "object",
    properties: {
      vaultName: { type: "string" },
      amount: { type: "number", description: "Signed dollar amount - positive adds, negative removes" },
    },
    required: ["vaultName", "amount"],
  },
  kind: "write",
  describe: (input, data) => {
    const vault = findVault(data, str(input.vaultName));
    if (!vault) return `No vault found matching "${str(input.vaultName)}".`;
    const amt = num(input.amount);
    const after = Math.max(0, vault.currentAmount + amt);
    return `${amt >= 0 ? "Adding" : "Removing"} ${formatMoney(Math.abs(amt))} ${amt >= 0 ? "to" : "from"} "${vault.name}": ${formatMoney(vault.currentAmount)} -> ${formatMoney(after)}.`;
  },
  apply: (data, input) => {
    const vault = findVault(data, str(input.vaultName));
    if (!vault) return { data, resultText: `No vault found matching "${str(input.vaultName)}".` };
    const amt = num(input.amount);
    const newAmount = Math.max(0, vault.currentAmount + amt);
    return {
      data: {
        ...data,
        lifeQuarterly: {
          ...data.lifeQuarterly,
          money: {
            ...data.lifeQuarterly.money,
            vaults: data.lifeQuarterly.money.vaults.map((v) => (v.id === vault.id ? { ...v, currentAmount: newAmount } : v)),
          },
        },
      },
      resultText: `${vault.name} is now ${formatMoney(newAmount)}.`,
    };
  },
};

const payDownDebtTool: AssistantTool = {
  name: "pay_down_debt",
  description: "Apply a payment toward one of her debts (part of the snowball) - reduces its current balance.",
  input_schema: {
    type: "object",
    properties: {
      debtName: { type: "string" },
      amount: { type: "number", description: "Positive dollar amount being paid" },
    },
    required: ["debtName", "amount"],
  },
  kind: "write",
  describe: (input, data) => {
    const debt = findDebt(data, str(input.debtName));
    if (!debt) return `No debt found matching "${str(input.debtName)}".`;
    const amt = Math.abs(num(input.amount));
    const after = Math.max(0, debt.currentBalance - amt);
    return `Paying ${formatMoney(amt)} toward "${debt.name}": ${formatMoney(debt.currentBalance)} -> ${formatMoney(after)}${after === 0 ? " - PAID OFF 🎉" : ""}.`;
  },
  apply: (data, input, now) => {
    const debt = findDebt(data, str(input.debtName));
    if (!debt) return { data, resultText: `No debt found matching "${str(input.debtName)}".` };
    const amt = Math.abs(num(input.amount));
    const newBalance = Math.max(0, debt.currentBalance - amt);
    const paidOff = newBalance <= 0 && debt.currentBalance > 0;
    const budget = amt > 0
      ? addWin(data.budget, { date: dateKey(now), kind: paidOff ? "debtPaidOff" : "debtPayment", name: debt.name, amount: amt, note: "" })
      : data.budget;
    return {
      data: {
        ...data,
        budget,
        lifeQuarterly: {
          ...data.lifeQuarterly,
          money: {
            ...data.lifeQuarterly.money,
            debts: data.lifeQuarterly.money.debts.map((d) => (d.id === debt.id ? { ...d, currentBalance: newBalance } : d)),
          },
        },
      },
      resultText:
        newBalance === 0
          ? `${debt.name} is PAID OFF - debt-free on this one, forever off the list. 🎉`
          : `${debt.name} is now ${formatMoney(newBalance)}.`,
    };
  },
};

const checkPaydayStepTool: AssistantTool = {
  name: "check_payday_step",
  description: "Check or uncheck a step on her Payday Checklist for the current pay period. Match the step by its text.",
  input_schema: {
    type: "object",
    properties: {
      stepText: { type: "string" },
      done: { type: "boolean" },
    },
    required: ["stepText", "done"],
  },
  kind: "write",
  describe: (input, data) => {
    const checklist = data.lifeQuarterly.paydayChecklist;
    if (!checklist.anchorDate) return "No payday date is set up yet - set it in the Payday Checklist first.";
    const step = checklist.steps.find((s) => s.text.toLowerCase().includes(str(input.stepText).toLowerCase()));
    if (!step) return `No payday step found matching "${str(input.stepText)}".`;
    return `${input.done ? "Checking off" : "Unchecking"}: "${step.text}"`;
  },
  apply: (data, input, now) => {
    const checklist = data.lifeQuarterly.paydayChecklist;
    if (!checklist.anchorDate) {
      return { data, resultText: "No payday date is set up yet - set it in the Payday Checklist first." };
    }
    const step = checklist.steps.find((s) => s.text.toLowerCase().includes(str(input.stepText).toLowerCase()));
    if (!step) return { data, resultText: `No payday step found matching "${str(input.stepText)}".` };
    const periodKey = currentPeriodKey(checklist.anchorDate, now);
    const current = new Set(completedStepIdsFor(checklist, periodKey));
    if (input.done) current.add(step.id);
    else current.delete(step.id);
    return {
      data: {
        ...data,
        lifeQuarterly: {
          ...data.lifeQuarterly,
          paydayChecklist: { ...checklist, periods: { ...checklist.periods, [periodKey]: [...current] } },
        },
      },
      resultText: `${input.done ? "Checked off" : "Unchecked"} "${step.text}".`,
    };
  },
};

function resolveAllocationLines(
  rawLines: unknown,
  existing: AllocationLine[] | undefined
): AllocationLine[] {
  const list = Array.isArray(rawLines) ? rawLines : [];
  return list
    .map((raw): AllocationLine | null => {
      const r = raw as Record<string, unknown>;
      const kind = ["bill", "debt", "vault", "spending"].includes(r.kind as string)
        ? (r.kind as AllocationKind)
        : "spending";
      const refName = str(r.refName);
      if (!refName) return null;
      const amount = Math.abs(num(r.amount));
      const prevDone = existing?.find((l) => l.kind === kind && l.refName === refName)?.done ?? false;
      return { ...newAllocationLine(kind, refName, amount), done: prevDone };
    })
    .filter((l): l is AllocationLine => l !== null);
}

function allocatePaycheckPreview(
  dateStr: string,
  expectedAmount: number,
  lines: { kind: string; refName: string; amount: number }[],
  isUpdate: boolean
): string {
  if (lines.length === 0) {
    return `${isUpdate ? "Updating" : "Creating"} paycheck plan for ${dateStr}: ${formatMoney(expectedAmount)} in, no lines given yet.`;
  }
  const byKind: Record<string, number> = {};
  for (const l of lines) byKind[l.kind] = (byKind[l.kind] ?? 0) + l.amount;
  const kindLine = Object.entries(byKind)
    .map(([k, v]) => `${k}: ${formatMoney(v)}`)
    .join(", ");
  const allocated = lines.reduce((s, l) => s + l.amount, 0);
  const unalloc = expectedAmount - allocated;
  return `${isUpdate ? "Updating" : "Creating"} paycheck plan for ${dateStr}: ${formatMoney(expectedAmount)} in -> ${kindLine} -> ${formatMoney(unalloc)}${unalloc === 0 ? " unallocated (every dollar has a job)" : unalloc > 0 ? " still unassigned" : " over-allocated - trim something"}.`;
}

const allocatePaycheckTool: AssistantTool = {
  name: "allocate_paycheck",
  description:
    "Build or adjust her zero-based paycheck allocation plan - the core budgeting ritual: every dollar of a paycheck gets assigned to a bill, a debt minimum (or more), a vault transfer, or spending, until nothing is left unassigned. Use this to walk her through a new paycheck live, or to adjust an existing plan (add/change a line, or update the expected amount) - upserts by date, so calling it again for a date that already has a plan replaces its lines with what you give (already-checked-off lines stay checked if you keep the same kind+refName). If she hasn't given specific lines yet and none exist for this date, leave lines empty and this auto-drafts from her recurring bills, debt minimums, and vault transfers so you're not starting from a blank page - then refine it with her from there. Always show the running math: paycheck minus allocated equals what's left unassigned, and call out her survival number (from read_dashboard_section('budget')) so she sees the floor she's covering first.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD - the paycheck date this plan is for" },
      expectedAmount: { type: "number", description: "What's landing, or her actual bank balance right now" },
      lines: {
        type: "array",
        description:
          "The full set of allocation lines for this paycheck - replaces any existing lines for this date. Omit entirely to auto-draft from her recurring config when creating a brand-new plan, or to leave an existing plan's lines untouched when you're just updating the amount.",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["bill", "debt", "vault", "spending"] },
            refName: { type: "string", description: "Bill/debt/vault name, or a short label for a spending line" },
            amount: { type: "number" },
          },
          required: ["kind", "refName", "amount"],
        },
      },
    },
    required: ["date", "expectedAmount"],
  },
  kind: "write",
  describe: (input, data) => {
    const dateStr = str(input.date);
    const existing = data.paycheckPlans.plans.find((p) => p.date === dateStr);
    const expectedAmount = num(input.expectedAmount);
    const rawLines = Array.isArray(input.lines) ? (input.lines as Record<string, unknown>[]) : null;
    const lines = rawLines
      ? rawLines.map((r) => ({ kind: str(r.kind, "spending"), refName: str(r.refName), amount: Math.abs(num(r.amount)) }))
      : existing
        ? existing.lines.map((l) => ({ kind: l.kind, refName: l.refName, amount: l.amount }))
        : suggestLinesFromConfig(data.budget.config, data.lifeQuarterly.money.debts, slotForPaycheckDate(dateStr)).map((l) => ({
            kind: l.kind,
            refName: l.refName,
            amount: l.amount,
          }));
    return allocatePaycheckPreview(dateStr, expectedAmount, lines, Boolean(existing));
  },
  apply: (data, input, now) => {
    const dateStr = str(input.date) || todayKey(now);
    const expectedAmount = num(input.expectedAmount);
    const existing = data.paycheckPlans.plans.find((p) => p.date === dateStr);
    const rawLines = Array.isArray(input.lines) ? input.lines : null;

    const lines = rawLines
      ? resolveAllocationLines(rawLines, existing?.lines)
      : existing
        ? existing.lines
        : suggestLinesFromConfig(data.budget.config, data.lifeQuarterly.money.debts, slotForPaycheckDate(dateStr));

    const paycheckPlans = existing
      ? updatePaycheckPlan(data.paycheckPlans, existing.id, (p) => ({ ...p, expectedAmount, lines }))
      : addPaycheckPlan(data.paycheckPlans, createPaycheckPlan(dateStr, expectedAmount, lines, now));

    const allocated = lines.reduce((s, l) => s + l.amount, 0);
    const unalloc = expectedAmount - allocated;
    const spending = lines.filter((l) => l.kind === "spending").reduce((s, l) => s + l.amount, 0);
    return {
      data: { ...data, paycheckPlans },
      resultText: `Saved paycheck plan for ${dateStr}: ${formatMoney(expectedAmount)} - allocated ${formatMoney(allocated)} = ${formatMoney(unalloc)} unallocated. Safe to spend: ${formatMoney(spending)}.`,
    };
  },
};

const markPaycheckLinePaidTool: AssistantTool = {
  name: "mark_paycheck_line_paid",
  description:
    "Check or uncheck one line of an existing paycheck plan as actually paid/transferred - use as she pays things through the pay period. Match the plan by its paycheck date and the line by a snippet of its bill/debt/vault/spending name.",
  input_schema: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD - the paycheck plan's date" },
      refNameMatch: { type: "string", description: "Text that appears in the line's name" },
      done: { type: "boolean" },
    },
    required: ["date", "refNameMatch", "done"],
  },
  kind: "write",
  describe: (input, data) => {
    const dateStr = str(input.date);
    const plan = data.paycheckPlans.plans.find((p) => p.date === dateStr);
    if (!plan) return `No paycheck plan found for ${dateStr}.`;
    const needle = str(input.refNameMatch).toLowerCase();
    const line = plan.lines.find((l) => l.refName.toLowerCase().includes(needle));
    if (!line) return `No line matching "${str(input.refNameMatch)}" in the ${dateStr} plan.`;
    return `${input.done ? "Checking off" : "Unchecking"} "${line.refName}" (${formatMoney(line.amount)}) in the ${dateStr} paycheck plan.`;
  },
  apply: (data, input) => {
    const dateStr = str(input.date);
    const plan = data.paycheckPlans.plans.find((p) => p.date === dateStr);
    if (!plan) return { data, resultText: `No paycheck plan found for ${dateStr}.` };
    const needle = str(input.refNameMatch).toLowerCase();
    const line = plan.lines.find((l) => l.refName.toLowerCase().includes(needle));
    if (!line) return { data, resultText: `No line matching "${str(input.refNameMatch)}" in the ${dateStr} plan.` };
    const done = Boolean(input.done);
    const paycheckPlans = updatePaycheckPlan(data.paycheckPlans, plan.id, (p) => ({
      ...p,
      lines: p.lines.map((l) => (l.id === line.id ? { ...l, done } : l)),
    }));
    return {
      data: { ...data, paycheckPlans },
      resultText: `${done ? "Checked off" : "Unchecked"} "${line.refName}" in the ${dateStr} paycheck plan.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Meal prep

function findRecipeById(data: DashboardData, id: string): Recipe | undefined {
  return data.recipes.recipes.find((r) => r.id === id);
}

type MealPlanItemInput = {
  date: string;
  slot: MealSlot;
  title: string;
  calories: number;
  ingredients: string[];
  prepStyle: PrepStyle;
  notes: string;
  recipeId: string;
};

function resolveMealPlanItems(rawMeals: unknown, data: DashboardData): MealPlanItemInput[] {
  const list = Array.isArray(rawMeals) ? rawMeals : [];
  return list
    .map((raw): MealPlanItemInput | null => {
      const r = raw as Record<string, unknown>;
      const date = str(r.date);
      const title = str(r.title);
      if (!date || !title) return null;
      const slot = MEAL_SLOTS.includes(r.slot as MealSlot) ? (r.slot as MealSlot) : "dinner";
      const prepStyle = ["batch-cook", "quick", "assemble"].includes(r.prepStyle as string) ? (r.prepStyle as PrepStyle) : "";
      const recipeId = str(r.recipeId);
      const linkedRecipe = recipeId ? findRecipeById(data, recipeId) : undefined;
      return {
        date,
        slot,
        title,
        calories: num(r.calories) || linkedRecipe?.caloriesPerServing || 0,
        ingredients: Array.isArray(r.ingredients) ? (r.ingredients as unknown[]).map((i) => str(i)) : linkedRecipe?.ingredients ?? [],
        prepStyle: prepStyle || linkedRecipe?.prepStyle || "",
        notes: str(r.notes),
        recipeId,
      };
    })
    .filter((m): m is MealPlanItemInput => m !== null)
    .sort((a, b) => (a.date === b.date ? a.slot.localeCompare(b.slot) : a.date.localeCompare(b.date)));
}

function buildWeekPlanPreview(input: Record<string, unknown>, data: DashboardData, now: Date): string {
  const items = resolveMealPlanItems(input.meals, data);
  if (items.length === 0) return "No valid meals in this plan - each one needs at least a date and a title.";

  const lines = items.map((m) => {
    const cal = m.calories ? ` (~${m.calories} cal)` : "";
    return `${formatDayLabel(m.date)} ${MEAL_SLOT_LABELS[m.slot]}: ${m.title}${cal}`;
  });

  const prepNight = items.filter((m) => m.prepStyle === "batch-cook");
  const parts = [`Week plan - ${items.length} meal${items.length === 1 ? "" : "s"}:`, lines.join("\n")];

  if (prepNight.length > 0) {
    parts.push("🔪 Prep night batch-cook: " + prepNight.map((m) => m.title).join(", "));
  }

  const withCost = items.filter((m) => m.recipeId && findRecipeById(data, m.recipeId));
  if (withCost.length > 0) {
    const estCost = withCost.reduce((sum, m) => sum + (findRecipeById(data, m.recipeId)?.estCostPerServing ?? 0), 0);
    const groceryBill = data.budget.config.bills.find((b) => /grocer/i.test(b.name));
    const monthlyTarget = groceryBill?.monthlyAmount ?? 600;
    const weeklyGuide = monthlyTarget / 4.33;
    const pct = Math.round((estCost / weeklyGuide) * 100);
    let costLine = `Est. cost for ${withCost.length} of ${items.length} meals: ~$${estCost.toFixed(0)} (~${pct}% of your ~$${weeklyGuide.toFixed(0)}/week grocery guide, from the $${monthlyTarget}/mo target).`;
    if (estCost > weeklyGuide) costLine += " ⚠ Running expensive for the week.";
    parts.push(costLine);
  }

  return parts.join("\n\n");
}

const planWeekMealsTool: AssistantTool = {
  name: "plan_week_meals",
  description:
    "Build or adjust her meal plan - the primary way to prescriptively plan a week: propose specific meals (not open questions), assign heavier batch-cook meals to Wednesday (her prep night) and simple/quick ones to busy days, and present the whole thing as a plan. Works for a full week at once, or a single swap ('swap Tuesday' -> call with just that one day). Each meal upserts by date+slot: calling it again for a date/slot that already has a meal replaces that meal only, everything else stays untouched. Prefer recipes from read_dashboard_section('recipes') first, filling any gaps with simple budget-friendly options; check remembered facts for dislikes/staples before suggesting anything (never re-suggest something she's rejected). Give every meal a considered calorie estimate - never leave it blank.",
  input_schema: {
    type: "object",
    properties: {
      meals: {
        type: "array",
        description: "Every meal being set, in any order.",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "YYYY-MM-DD" },
            slot: { type: "string", enum: MEAL_SLOTS },
            title: { type: "string" },
            calories: { type: "number", description: "Estimated calories per serving - always give a real number" },
            ingredients: { type: "array", items: { type: "string" }, description: "Grocery-ready lines, e.g. '2 lbs chicken thighs'" },
            prepStyle: { type: "string", enum: ["batch-cook", "quick", "assemble"] },
            notes: { type: "string", description: "How to store/reheat/assemble" },
            recipeId: { type: "string", description: "Matching id from the recipe bank, if this came from there" },
          },
          required: ["date", "slot", "title"],
        },
      },
    },
    required: ["meals"],
  },
  kind: "write",
  describe: (input, data) => buildWeekPlanPreview(input, data, new Date()),
  apply: (data, input, now) => {
    const items = resolveMealPlanItems(input.meals, data);
    if (items.length === 0) return { data, resultText: "No meals were set - nothing valid in the plan." };

    let meals = data.mealPlan.meals;
    for (const item of items) {
      const existing = meals.find((m) => m.date === item.date && m.slot === item.slot);
      const entry: MealEntry = {
        id: existing?.id ?? crypto.randomUUID(),
        date: item.date,
        slot: item.slot,
        text: item.title,
        notes: item.notes,
        calories: item.calories,
        ingredients: item.ingredients,
        prepStyle: item.prepStyle,
        recipeId: item.recipeId,
      };
      meals = existing ? meals.map((m) => (m.id === existing.id ? entry : m)) : [...meals, entry];
    }

    return {
      data: { ...data, mealPlan: { ...data.mealPlan, meals } },
      resultText: `Set ${items.length} meal${items.length === 1 ? "" : "s"} in the plan.`,
    };
  },
};

const buildGroceryListFromMealsTool: AssistantTool = {
  name: "build_grocery_list_from_meals",
  description:
    "Compile a consolidated, deduplicated ingredient list (from meals you just planned, or from reading the meal plan) and add it to her Grocery list. Combine duplicate ingredients across meals into one line before calling this - don't call it once per meal.",
  input_schema: {
    type: "object",
    properties: {
      ingredients: { type: "array", items: { type: "string" }, description: "Deduplicated, grocery-ready lines" },
    },
    required: ["ingredients"],
  },
  kind: "write",
  describe: (input, data) => {
    const ingredients = Array.isArray(input.ingredients) ? (input.ingredients as unknown[]).map((i) => str(i)).filter(Boolean) : [];
    if (ingredients.length === 0) return "No ingredients given.";
    const openTexts = new Set(data.lists.grocery.items.filter((i) => !i.done).map((i) => i.text.toLowerCase()));
    const toAdd = ingredients.filter((i) => !openTexts.has(i.toLowerCase()));
    const skipped = ingredients.length - toAdd.length;
    const parts = [`Adding ${toAdd.length} item${toAdd.length === 1 ? "" : "s"} to the grocery list:`, toAdd.join("\n") || "(none)"];
    if (skipped > 0) parts.push(`Already on the list, skipping ${skipped}.`);
    return parts.join("\n\n");
  },
  apply: (data, input, now) => {
    const ingredients = Array.isArray(input.ingredients) ? (input.ingredients as unknown[]).map((i) => str(i)).filter(Boolean) : [];
    const openTexts = new Set(data.lists.grocery.items.filter((i) => !i.done).map((i) => i.text.toLowerCase()));
    const toAdd = ingredients.filter((i) => !openTexts.has(i.toLowerCase()));
    if (toAdd.length === 0) return { data, resultText: "Nothing new to add - already on the list." };
    const newItems: GroceryItem[] = toAdd.map((text) => ({
      id: crypto.randomUUID(),
      text,
      category: guessGroceryCategory(text),
      done: false,
      createdAt: now.toISOString(),
    }));
    return {
      data: { ...data, lists: { ...data.lists, grocery: { ...data.lists.grocery, items: [...data.lists.grocery.items, ...newItems] } } },
      resultText: `Added ${newItems.length} item${newItems.length === 1 ? "" : "s"} to the grocery list.`,
    };
  },
};

const addRecipeToBankTool: AssistantTool = {
  name: "add_recipe_to_bank",
  description: "Save a new recipe to her recipe bank so it can be suggested again later.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      cuisine: { type: "string" },
      caloriesPerServing: { type: "number" },
      servings: { type: "number" },
      ingredients: { type: "array", items: { type: "string" } },
      prepStyle: { type: "string", enum: ["batch-cook", "quick", "assemble"] },
      estCostPerServing: { type: "number" },
      tags: { type: "array", items: { type: "string" } },
      notes: { type: "string" },
    },
    required: ["name", "caloriesPerServing", "ingredients", "prepStyle"],
  },
  kind: "write",
  describe: (input) => `Saving recipe: "${str(input.name)}" (~${num(input.caloriesPerServing)} cal/serving)`,
  apply: (data, input, now) => {
    const recipes = addRecipe(
      data.recipes,
      {
        name: str(input.name),
        cuisine: str(input.cuisine) || "Haitian-American",
        caloriesPerServing: num(input.caloriesPerServing),
        servings: num(input.servings) || 4,
        ingredients: Array.isArray(input.ingredients) ? (input.ingredients as unknown[]).map((i) => str(i)) : [],
        prepStyle: (input.prepStyle as PrepStyle) || "quick",
        estCostPerServing: num(input.estCostPerServing),
        tags: Array.isArray(input.tags) ? (input.tags as unknown[]).map((t) => str(t)) : [],
        notes: str(input.notes),
      },
      now
    );
    return { data: { ...data, recipes }, resultText: `Saved "${str(input.name)}" to the recipe bank.` };
  },
};

const addWaitingOnTool: AssistantTool = {
  name: "add_waiting_on",
  description: "Add a Waiting On item - something she's waiting to hear back about from someone.",
  input_schema: {
    type: "object",
    properties: {
      who: { type: "string" },
      what: { type: "string" },
      followUpDate: { type: "string", description: "YYYY-MM-DD, optional" },
    },
    required: ["who", "what"],
  },
  kind: "write",
  describe: (input) => `Adding Waiting On: ${str(input.who)} - "${str(input.what)}"`,
  apply: (data, input, now) => {
    const item = { ...newWaitingOnItem(str(input.who), str(input.what), now), followUpDate: str(input.followUpDate) };
    return {
      data: { ...data, waitingOn: { ...data.waitingOn, items: [item, ...data.waitingOn.items] } },
      resultText: `Added Waiting On: ${item.who} - "${item.what}".`,
    };
  },
};

// ---------------------------------------------------------------------------
// Read

const READABLE_SECTIONS = [
  "tasks",
  "planner",
  "waitingOn",
  "budget",
  "health",
  "events",
  "mealPlan",
  "recipes",
  "groceryList",
  "dec8",
  "cadence",
  "routines",
  "habits",
  "glowUp",
  "knowledge",
  "rhythm",
  "frontPage",
] as const;

function readSection(data: DashboardData, section: string, now: Date): unknown {
  switch (section) {
    case "tasks":
      return {
        workTasks: data.workOps.tasks.slice(0, 40).map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          category: t.category,
          dueDate: t.dueDate,
          progressPct: t.progressPct,
        })),
        lifeTasks: data.life.tasks.slice(0, 40).map((t) => ({ text: t.text, done: t.done })),
      };
    case "planner": {
      // blocksForDate already resolves one-off vs. weekly-repeating blocks
      // correctly for this exact date; routineGhostBlocksForDate adds in
      // the routine-derived time blocks (morning/day/night steps) that
      // make up most of a real day but aren't stored as Planner blocks -
      // both need to be included, or "what's on my planner today" reads
      // as mostly empty even on a fully scheduled day.
      const realBlocks = blocksForDate(data.planner, now).map((b) => ({
        title: b.title,
        startTime: b.startTime,
        endTime: b.endTime,
      }));
      const ghostBlocks = routineGhostBlocksForDate(data.routines.config, data.planner.routineOverrides, now).map(
        (g) => ({ title: g.title, startTime: g.startTime, endTime: "" })
      );
      return {
        today: [...realBlocks, ...ghostBlocks].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        ),
      };
    }
    case "waitingOn":
      return data.waitingOn.items
        .filter((i) => !i.resolvedDate)
        .map((i) => ({ who: i.who, what: i.what, askedDate: i.askedDate, followUpDate: i.followUpDate }));
    case "budget": {
      // The real numbers she actually looks at (Money > Command Center,
      // Paycheck Plan, Debts, Progress) - not the separate legacy
      // Accounts/Transactions ledger, which is kept underneath as
      // personalLedger for completeness only.
      const key = monthKey(now);
      const money = data.lifeQuarterly.money;
      const config = data.budget.config;
      const state = monthStateFor(data.budget, key, money);
      const spendStatus = spendingStatus(config, state);
      const buildingUp = buildingUpSummary(money, state);
      const groceryBill = config.bills.find((b) => /grocer/i.test(b.name));
      const paydayAnchor = data.lifeQuarterly.paydayChecklist.anchorDate;
      const periodKey = currentPeriodKey(paydayAnchor, now);
      const doneStepIds = new Set(completedStepIdsFor(data.lifeQuarterly.paydayChecklist, periodKey));

      const monthTx = data.finance.transactions.filter((t) => t.date.slice(0, 7) === key);

      const trend = monthlyTrendSeries(data.budget, money);
      const netNow = trend[trend.length - 1];
      const mostRecent = mostRecentPlan(data.paycheckPlans, now);
      const nextPlan = nextUpcomingPlan(data.paycheckPlans, now);
      const summarizePlan = (p: typeof mostRecent) =>
        p && {
          date: p.date,
          expectedAmount: p.expectedAmount,
          allocated: allocatedTotal(p),
          unallocated: unallocatedTotal(p),
          safeToSpend: safeToSpend(p),
          byKind: allocationByKind(p),
          lines: p.lines.map((l) => ({ kind: l.kind, refName: l.refName, amount: l.amount, done: l.done })),
        };

      return {
        expectedMonthlyIncome: expectedMonthlyIncome(config),
        leftToBreatheBuffer: leftToBreathe(config),
        billsDebtsVaultsThisMonth: moneyOutSummary(config, state),
        dueSoon: dueNextItems(config, state, now)
          .slice(0, 8)
          .map((d) => ({ name: d.name, amount: d.amount, dueDay: d.day, kind: d.kind })),
        spendingCategories: spendStatus.map((s) => ({
          name: s.target.name,
          monthlyTarget: s.target.monthlyAmount,
          spentSoFar: s.spent,
          remaining: s.target.monthlyAmount - s.spent,
          pctUsed: s.pct,
        })),
        vaults: money.vaults.map((v) => ({ name: v.name, current: v.currentAmount, goal: v.goalAmount })),
        // Survival number: the bare floor of essential bills + debt
        // minimums she must cover each pay period to stay safe - not the
        // full budget, just the non-negotiable part.
        survivalNumber: {
          monthly: survivalNumberMonthly(config, money.debts),
          firstPaycheck: survivalNumberForSlot(config, money.debts, "first"),
          secondPaycheck: survivalNumberForSlot(config, money.debts, "second"),
        },
        // Due-date radar: everything due before her next paycheck, with
        // past-due and restricted accounts always pinned first regardless
        // of date, so nothing slips from not-looking-again.
        dueDateRadar: dueDateRadar(config, money.debts, now).map((r) => ({
          name: r.name,
          amount: r.amount,
          date: r.date || null,
          kind: r.kind,
          status: r.status,
          pinned: r.pinned,
        })),
        debts: money.debts.map((d) => ({
          name: d.name,
          currentBalance: d.currentBalance,
          startingBalance: d.startingBalance,
          interestRatePct: d.interestRatePct,
          minPayment: d.minPayment,
          dueDay: d.dueDay || null,
          status: d.status,
          pastDueAmount: d.pastDueAmount || null,
          priority: d.priority,
          monthlyInterestCost: interestCostPerMonth(d.currentBalance, d.interestRatePct),
          payoffForecastAtCurrentMin: payoffForecast(d.currentBalance, d.interestRatePct, d.minPayment, now),
        })),
        // Both debt orders, side by side, so you can show her the math for
        // each and let her choose rather than picking one for her.
        debtOrder: {
          snowballSmallestFirst: orderedDebts(money.debts, "snowball").map((d) => d.name),
          avalancheHighestInterestFirst: orderedDebts(money.debts, "avalanche").map((d) => d.name),
        },
        vaultTotal: buildingUp.vaultTotal,
        debtPaidOffTotal: buildingUp.debtPaidOff,
        // Net position (vaults minus total debt) - the single truest
        // measure of whether the plan is working, tracked over time.
        netPositionNow: netNow?.netPosition ?? 0,
        netPositionTrend: trend.slice(-6),
        wins: data.budget.wins.slice(0, 15).map((w) => ({ date: w.date, kind: w.kind, name: w.name, amount: w.amount })),
        groceryMonthlyTarget: groceryBill?.monthlyAmount ?? 600,
        paydayChecklist: paydayAnchor
          ? {
              currentPeriod: periodKey,
              steps: data.lifeQuarterly.paydayChecklist.steps.map((s) => ({ text: s.text, done: doneStepIds.has(s.id) })),
            }
          : { note: "No payday date set up yet." },
        // The zero-based paycheck plan flow - her actual per-paycheck
        // allocation ritual (~$2,996 on the 15th and 30th). Use
        // allocate_paycheck to build or adjust one with her.
        paycheckPlan: {
          mostRecent: summarizePlan(mostRecent),
          nextUpcoming: summarizePlan(nextPlan),
          recentHistory: plansSorted(data.paycheckPlans)
            .slice(0, 6)
            .map((p) => ({ date: p.date, expectedAmount: p.expectedAmount, unallocated: unallocatedTotal(p) })),
        },
        personalLedger: {
          totalBalance: data.finance.accounts.reduce((s, a) => s + a.balance, 0),
          monthIncome: monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
          monthExpense: Math.abs(monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
        },
      };
    }
    case "health":
      return {
        upcomingAppointments: data.health.appointments.filter((a) => a.date >= todayKey(now)).slice(0, 20),
        activeMedications: data.health.medications.filter((m) => m.active),
      };
    case "events":
      return data.events.events.filter((e) => !e.archived && e.date >= todayKey(now)).slice(0, 20);
    case "mealPlan":
      return data.mealPlan.meals
        .filter((m) => m.date >= todayKey(now))
        .slice(0, 30)
        .map((m) => ({
          date: m.date,
          slot: m.slot,
          text: m.text,
          calories: m.calories || null,
          ingredients: m.ingredients,
          prepStyle: m.prepStyle || null,
          notes: m.notes,
        }));
    case "recipes":
      return data.recipes.recipes.map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        caloriesPerServing: r.caloriesPerServing,
        servings: r.servings,
        ingredients: r.ingredients,
        prepStyle: r.prepStyle,
        estCostPerServing: r.estCostPerServing,
        tags: r.tags,
        notes: r.notes,
      }));
    case "groceryList":
      return {
        openItems: data.lists.grocery.items.filter((i) => !i.done).map((i) => ({ text: i.text, category: i.category })),
        staples: data.lists.grocery.staples.map((s) => ({ text: s.text, category: s.category })),
      };
    case "dec8":
      return Object.fromEntries(
        Object.entries(data.year.transformations).map(([cat, goals]) => [
          cat,
          {
            done: goals.filter((g) => g.done).length,
            total: goals.length,
            goals: goals.map((g) => ({ text: g.text, done: g.done })),
          },
        ])
      );
    case "cadence":
      return {
        items: data.cadence.items.map((i) => ({ text: i.text, frequency: i.frequency, department: i.department })),
      };
    case "routines": {
      // Her daily skincare/self-care rhythm (morning/day/night step
      // checklists) - distinct from the Rhythm anchors below, which are
      // the actual shape of her week, and from Habits, which are
      // weekly-goal trackers. All three make up "Rituals" in the UI.
      const routines = ROUTINE_KEYS.map((key) => {
        const summary = completionForDate(data.routines.config, data.routines, key, now);
        const steps = stepsForDate(data.routines.config, key, now);
        return {
          key,
          label: ROUTINE_LABELS[key],
          done: summary.done,
          total: summary.total,
          steps: steps.map((s) => s.text),
        };
      });
      return { today: routines };
    }
    case "habits": {
      const weekKey = weekKeyFor(now);
      return {
        thisWeek: data.habits.habits.map((h: Habit) => ({
          label: h.label,
          section: h.section,
          weeklyGoal: h.weeklyGoal,
          doneCount: habitCompletionsFor(data.habits, weekKey, h.id).filter(Boolean).length,
        })),
        atRisk: habitsAtRisk(data.habits, now).map((r) => `${r.habit.label} (${r.doneCount}/${r.habit.weeklyGoal} so far this week)`),
      };
    }
    case "glowUp": {
      const daily = dailyProgress(data.glowUp, now);
      const weekly = weeklyProgress(data.glowUp, now);
      const monthly = monthlyProgress(data.glowUp, now);
      const overdueMonthly = data.glowUp.monthlyItems.filter((i) => isOverdueForWarning(i, now)).map((i) => i.text);
      return {
        daily: { done: daily.done, total: daily.total },
        weekly: { done: weekly.done, total: weekly.total },
        monthly: { done: monthly.done, total: monthly.total },
        weeklyStreak: weeklyStreak(data.glowUp, now),
        overdueMonthlyItems: overdueMonthly,
        scentNote: data.glowUp.scentNote,
      };
    }
    case "knowledge": {
      return {
        scholarStreak: data.knowledge.scholarStreak.current,
        subjects: data.knowledge.subjects.map((s) => {
          const mastery = computeMastery(s.id, data.knowledge);
          return { name: s.name, pitch: s.pitch, masteryLevel: MASTERY_LABELS[mastery.level], masteryScore: mastery.score };
        }),
        dueFlashcards: dueCardsAcrossSubjects(data.knowledge.cards, now, 10).length,
        openQuestionsToAsk: unaskedQuestions(data.knowledge)
          .slice(0, 10)
          .map((q) => ({ text: q.question, angle: q.angle })),
      };
    }
    case "rhythm": {
      // The actual shape of her week - anchor points per weekday (payday
      // checklist, board meeting, prep night, etc), separate from the
      // Planner's real time-blocked calendar. Good for "what's tomorrow
      // shaped like" or weaving her real rhythm into a day plan.
      const paydayAnchor = data.lifeQuarterly.paydayChecklist.anchorDate;
      const todayInfo = todayRhythm(data.rhythm, paydayAnchor, now);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowAnchors = anchorsForDate(data.rhythm, paydayAnchor, tomorrow);
      return {
        today: {
          dayLabel: RHYTHM_DAY_LABELS[dayKeyForDate(now)],
          anchors: todayInfo.anchors.map((a) => ({ text: a.anchor.text, state: a.state })),
        },
        tomorrow: {
          dayLabel: RHYTHM_DAY_LABELS[dayKeyForDate(tomorrow)],
          anchors: tomorrowAnchors.map((a) => a.text),
        },
      };
    }
    case "frontPage": {
      const oneThing = data.oneThing.date === todayKey(now) ? data.oneThing.text : "";
      const recommendation = computeRecommendation(data, now);
      const recap = computeWeekRecap(data, now);
      const atRisk = habitsAtRisk(data.habits, now);
      const quest = questForDate(now);
      const score = computeLifeScoreBreakdown(data, now);
      return {
        oneThing: oneThing || null,
        suggestedNext: recommendation.text,
        todaysQuest: { title: quest.title, done: isQuestDone(data.quest, now) },
        lifeScore: { score: score.score, label: score.label },
        habitsAtRisk: atRisk.map((r) => `${r.habit.label} (${r.doneCount}/${r.habit.weeklyGoal})`),
        thisWeek: recap,
      };
    }
    default:
      return { error: `Unknown section "${section}"` };
  }
}

const readDashboardSectionTool: AssistantTool = {
  name: "read_dashboard_section",
  description:
    "Read a deeper slice of her dashboard than the snapshot you already have, to answer a specific question. Sections: " +
    READABLE_SECTIONS.join(", ") +
    ".",
  input_schema: {
    type: "object",
    properties: {
      section: { type: "string", enum: [...READABLE_SECTIONS] },
    },
    required: ["section"],
  },
  kind: "read",
  describe: (input) => `Reading ${str(input.section)}`,
  apply: (data, input, now) => ({
    data,
    resultText: JSON.stringify(readSection(data, str(input.section), now)),
  }),
};

// ---------------------------------------------------------------------------
// Memory

const rememberFactTool: AssistantTool = {
  name: "remember_fact",
  description:
    "Save a durable fact about her - a preference, a person she mentioned, a pattern in how she works, or a note worth remembering. Call this proactively whenever you notice something worth keeping; it saves silently in the background.",
  input_schema: {
    type: "object",
    properties: {
      text: { type: "string" },
      category: { type: "string", enum: MEMORY_FACT_CATEGORIES },
    },
    required: ["text", "category"],
  },
  kind: "memory",
  describe: (input) => `Remembering: ${str(input.text)}`,
  apply: (data, input, now) => {
    const category = MEMORY_FACT_CATEGORIES.includes(input.category as MemoryFactCategory)
      ? (input.category as MemoryFactCategory)
      : "note";
    return {
      data: { ...data, assistant: addMemoryFact(data.assistant, str(input.text), category, now) },
      resultText: "Saved to memory.",
    };
  },
};

const forgetFactTool: AssistantTool = {
  name: "forget_fact",
  description: "Forget something from memory when she asks you to. Give a short query matching what to forget.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Text to match against saved facts" },
    },
    required: ["query"],
  },
  kind: "memory",
  describe: (input) => `Forgetting anything matching: ${str(input.query)}`,
  apply: (data, input) => {
    const { data: assistant, removedCount } = forgetFactsMatching(data.assistant, str(input.query));
    return {
      data: { ...data, assistant },
      resultText: removedCount > 0 ? `Forgot ${removedCount} thing${removedCount === 1 ? "" : "s"}.` : "Didn't find anything matching that.",
    };
  },
};

export const ASSISTANT_TOOLS: AssistantTool[] = [
  addWorkTaskTool,
  editWorkTaskTool,
  completeWorkTaskTool,
  addLifeTaskTool,
  addPlannerBlockTool,
  planDayTool,
  editPlannerBlockTool,
  removePlannerBlocksTool,
  shiftPlannerBlocksTool,
  addListItemTool,
  addHealthAppointmentTool,
  addWorkEventTool,
  addMealTool,
  planWeekMealsTool,
  buildGroceryListFromMealsTool,
  addRecipeToBankTool,
  addDec8GoalTool,
  logExpenseTool,
  logIncomeTool,
  logBudgetExpenseTool,
  adjustVaultBalanceTool,
  payDownDebtTool,
  allocatePaycheckTool,
  markPaycheckLinePaidTool,
  checkPaydayStepTool,
  addWaitingOnTool,
  readDashboardSectionTool,
  rememberFactTool,
  forgetFactTool,
];

export function findAssistantTool(name: string): AssistantTool | undefined {
  return ASSISTANT_TOOLS.find((t) => t.name === name);
}

// The Anthropic API's tool definition shape - just the fields it wants,
// stripped of our own kind/describe/apply.
export function toolDefinitionsForApi(): { name: string; description: string; input_schema: Record<string, unknown> }[] {
  return ASSISTANT_TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));
}
