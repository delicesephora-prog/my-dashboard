import {
  DashboardData,
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
import { todayKey } from "./date";
import { Account, TRANSACTION_CATEGORIES, Transaction, monthKey } from "./finance";
import { PlannerBlock, blocksForDate, routineGhostBlocksForDate, sortedCategories, timeToMinutes } from "./planner";
import { GroceryItem, GROCERY_CATEGORIES, GroceryCategory, StapleItem, guessGroceryCategory } from "./lists";
import { Appointment } from "./health";
import { newEvent, WorkEvent } from "./events";
import { MealSlot, MEAL_SLOTS, newMeal } from "./mealplan";
import { newWaitingOnItem } from "./waitingon";
import { addMemoryFact, forgetFactsMatching, MemoryFactCategory, MEMORY_FACT_CATEGORIES } from "./assistant";
import { computeRecommendation, computeWeekRecap, habitsAtRisk } from "./frontpage";
import { computeLifeScoreBreakdown } from "./lifescore";
import { questForDate, isQuestDone } from "./quest";

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
  "dec8",
  "cadence",
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
      const key = monthKey(now);
      const monthTx = data.finance.transactions.filter((t) => t.date.slice(0, 7) === key);
      return {
        totalBalance: data.finance.accounts.reduce((s, a) => s + a.balance, 0),
        monthIncome: monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
        monthExpense: Math.abs(monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
        budgets: data.finance.budgets,
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
      return data.mealPlan.meals.filter((m) => m.date >= todayKey(now)).slice(0, 20);
    case "dec8":
      return Object.fromEntries(
        Object.entries(data.year.transformations).map(([cat, goals]) => [
          cat,
          { done: goals.filter((g) => g.done).length, total: goals.length },
        ])
      );
    case "cadence":
      return {
        items: data.cadence.items.map((i) => ({ text: i.text, frequency: i.frequency, department: i.department })),
      };
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
  addListItemTool,
  addHealthAppointmentTool,
  addWorkEventTool,
  addMealTool,
  addDec8GoalTool,
  logExpenseTool,
  logIncomeTool,
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
