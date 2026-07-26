"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackBeat as BackBeatData,
  BooksData,
  BucketListData,
  DailyReviewData,
  DashboardData,
  HabitsData,
  LifeQuarterly,
  LifeWeekly,
  Reference as ReferenceData,
  WorkOps,
  WorldData,
  YearData,
  quarterDataFor,
  setHabitCompletion,
  weekDataFor,
} from "@/lib/types";
import { RoutineKey, RoutinesData } from "@/lib/routines";
import { CadenceData } from "@/lib/cadence";
import { LifeScoreData } from "@/lib/lifescore";
import { GroceryData, DumpData, guessGroceryCategory } from "@/lib/lists";
import { quarterKeyFor } from "@/lib/quarter";
import { RhythmData } from "@/lib/rhythm";
import { GlowUpData } from "@/lib/glowup";
import { TextAlertsData } from "@/lib/textalerts";
import { PlannerData } from "@/lib/planner";
import { HomeZonesData } from "@/lib/home";
import { TodayFocusItem } from "@/lib/frontpage";
import { WelcomeData, shouldShowWelcome, markWelcomeShown } from "@/lib/welcome";
import WelcomeScreen from "./WelcomeScreen";
import {
  DailyThemeData,
  DailyThemeDayKey,
  shouldShowDailyTheme,
  markDailyThemeShown,
  themeForDate,
  completedPromptIdsFor,
  togglePromptCompletion,
  dayKeyForDate,
} from "@/lib/dailytheme";
import DailyThemeScreen from "./DailyThemeScreen";
import DailyThemeEditor from "./DailyThemeEditor";
import { VendorsData } from "@/lib/vendors";
import { WorkShutdownData } from "@/lib/workshutdown";
import { MeetingOpsData } from "@/lib/meetingops";
import { PrincipalsData } from "@/lib/principals";
import { QuestionBankData } from "@/lib/questionbank";
import { TemplatesData } from "@/lib/templates";
import { PreMortemData } from "@/lib/premortem";
import { FireDrillLogData } from "@/lib/firedrill";
import { FridayLedgerData } from "@/lib/fridayledger";
import { EventsData } from "@/lib/events";
import OpsHub, { OpsTool } from "./work/OpsHub";
import WaitingOnView from "./work/WaitingOnView";
import WorkShutdownView from "./work/WorkShutdownView";
import VendorsView from "./work/VendorsView";
import MeetingOpsView from "./work/MeetingOpsView";
import PrincipalsView from "./work/PrincipalsView";
import QuestionBankView from "./work/QuestionBankView";
import TemplatesView from "./work/TemplatesView";
import MyNumbersView from "./work/MyNumbersView";
import PreMortemView from "./work/PreMortemView";
import FireDrillLogView from "./work/FireDrillLogView";
import FridayLedgerView from "./work/FridayLedgerView";
import EventsView from "./work/EventsView";
import { FocusData } from "@/lib/focus";
import FocusModeView from "./FocusModeView";
import { AssistantData, assistantDisplayName } from "@/lib/assistant";
import { AppearanceData, effectiveIsEvening } from "@/lib/appearance";
import { AmbianceData, setAmbianceSettings } from "@/lib/ambiance";
import AssistantView from "./AssistantView";
import { BecomingData } from "@/lib/becoming";
import { Celebration, CelebrationTier } from "@/lib/celebration";
import { QuestData } from "@/lib/quest";
import { MemosData } from "@/lib/memos";
import { HealthData } from "@/lib/health";
import { MealCalendarData } from "@/lib/mealcalendar";
import { FinanceData } from "@/lib/finance";
import { BudgetData } from "@/lib/budget";
import { TabUsageData, SystemCheckData, trackTabOpen, isTabHidden } from "@/lib/systemcheck";
import { WeddingData } from "@/lib/wedding";
import { TripsData } from "@/lib/trips";
import { VisionData } from "@/lib/vision";
import { MilestoneData } from "@/lib/milestones";
import { RewardsData, evaluateRewardTriggers } from "@/lib/rewards";
import { PaycheckPlanData } from "@/lib/paycheckplan";
import { KnowledgeData } from "@/lib/knowledge";
import KnowledgeView from "./work/knowledge/KnowledgeView";
import CelebrationOverlay from "./CelebrationOverlay";
import BoardMeeting from "./BoardMeeting";
import SystemCheckFlow from "./SystemCheckFlow";
import QuickDump from "./QuickDump";
import { todayKey } from "@/lib/date";
import { weekKeyFor } from "@/lib/week";
import WorldToggle from "./WorldToggle";
import SubNav from "./SubNav";
import WeekView from "./WeekView";
import LifeTasksView from "./life/LifeTasksView";
import BrainDump from "./BrainDump";
import DailyReviewBar from "./DailyReviewBar";
import DailyReviewSheet from "./DailyReviewSheet";
import SettingsSheet from "./SettingsSheet";
import FrontPage from "./FrontPage";
import { FrontPageNavTarget } from "@/lib/frontpage";
import OperationsDashboard from "./work/OperationsDashboard";
import CadenceView from "./work/CadenceView";
import BackBeat from "./work/BackBeat";
import Reference from "./work/Reference";
import LifeHomeView from "./life/LifeHomeView";
import RitualsView from "./life/RitualsView";
import ManageHabits from "./life/ManageHabits";
import ManageRoutines from "./life/routines/ManageRoutines";
import QuarterView from "./life/quarter/QuarterView";
import MoneyView from "./life/MoneyView";
import MealsView from "./life/meals/MealsView";
import ListsView from "./life/lists/ListsView";
import RhythmView from "./life/rhythm/RhythmView";
import GlowUpView from "./life/glowup/GlowUpView";
import HomeView from "./life/HomeView";
import PlannerView from "./life/planner/PlannerView";
import BooksView from "./life/BooksView";
import BucketListView from "./life/BucketListView";
import YearView from "./life/year/YearView";
import VersesView from "./life/VersesView";
import MemosView from "./life/MemosView";
import HealthView from "./life/HealthView";
import WeddingView from "./life/WeddingView";
import TripsView from "./life/TripsView";
import VisionView from "./life/VisionView";
import WarRoomSection from "./life/year/WarRoomSection";
import SaveIndicator, { SaveStatus } from "./SaveIndicator";
import Monogram from "./Monogram";
import TabErrorBoundary from "./TabErrorBoundary";

type World = "front" | "work" | "planner" | "life" | "assistant";
type WorkView = "dashboard" | "cadence" | "backbeat" | "ops" | "knowledge" | "reference";
type OpsSubView =
  | "hub"
  | "waitingOn"
  | "workShutdown"
  | "vendors"
  | "meetingOps"
  | "principals"
  | "questionBank"
  | "templates"
  | "myNumbers"
  | "preMortem"
  | "fireDrillLog"
  | "fridayLedger"
  | "events";
type LifeView =
  | "hub"
  | "tasks"
  | "week"
  | "rituals"
  | "manageRoutines"
  | "manageHabits"
  | "money"
  | "meals"
  | "quarter"
  | "lists"
  | "rhythm"
  | "glowUp"
  | "home"
  | "books"
  | "bucketList"
  | "year"
  | "dec8"
  | "verses"
  | "memos"
  | "health"
  | "wedding"
  | "trips"
  | "vision";

const SAVE_DELAY_MS = 700;

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [world, setWorld] = useState<World>("front");
  const [workView, setWorkView] = useState<WorkView>("dashboard");
  const [opsView, setOpsView] = useState<OpsSubView>("hub");
  const [lifeView, setLifeView] = useState<LifeView>("hub");
  const [manageRoutinesTarget, setManageRoutinesTarget] = useState<RoutineKey | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dailyReviewOpen, setDailyReviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardMeetingOpen, setBoardMeetingOpen] = useState(false);
  const [systemCheckOpen, setSystemCheckOpen] = useState(false);
  const [quickDumpOpen, setQuickDumpOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDailyTheme, setShowDailyTheme] = useState(false);
  const [dailyThemeEditorDay, setDailyThemeEditorDay] = useState<DailyThemeDayKey | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  // Deferred to the client (server-rendered markup has no clock to check),
  // then re-checked on an interval so a session left open across sunset
  // still transitions into Evening Luxe without a reload. Set on <html>
  // directly (not a nested div) since that's what the :root CSS variable
  // override in globals.css targets, and :root only ever means <html>.
  const [isEvening, setIsEvening] = useState(false);
  useEffect(() => {
    const recompute = () => setIsEvening(effectiveIsEvening(data.appearance.themeMode));
    recompute();
    const interval = setInterval(recompute, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [data.appearance.themeMode]);

  useEffect(() => {
    document.documentElement.dataset.theme = isEvening ? "evening" : "light";
  }, [isEvening]);

  // Checked once on mount only - re-running this on every data change
  // would re-show the screen the moment updateWelcome's own save lands.
  useEffect(() => {
    if (shouldShowWelcome(initialData.welcome, new Date())) {
      setShowWelcome(true);
    }
    if (shouldShowDailyTheme(initialData.dailyTheme, new Date())) {
      setShowDailyTheme(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A slow save from an earlier edit can still be in flight when a newer
  // edit's save fires - without tracking this, whichever response happens
  // to arrive last wins, even if it's the older one. saveSeq is sent to
  // the server (which enforces the real ordering guarantee at the database
  // level); the abort controller additionally stops the client from acting
  // on a response that's already been superseded.
  const saveSeq = useRef(0);
  const activeAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const runSave = useCallback(() => {
    // A tab sitting in the background can hold data that's gone stale
    // while edits happen elsewhere (another tab, another device) - never
    // let a hidden tab write anything. Once it's actually visible again,
    // the visibilitychange handler below either lets this pending save
    // through (if something genuinely changed while hidden) or pulls
    // fresh data first (if nothing did).
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      saveTimer.current = setTimeout(runSave, SAVE_DELAY_MS);
      return;
    }

    activeAbort.current?.abort();
    const controller = new AbortController();
    activeAbort.current = controller;
    const mySeq = Date.now();
    saveSeq.current = mySeq;

    (async () => {
      try {
        const res = await fetch("/api/dashboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Save-Seq": String(mySeq) },
          body: JSON.stringify(latestData.current),
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`save failed (${res.status}): ${detail.slice(0, 500)}`);
        }
        // A newer save may have started (and possibly already finished)
        // while this one was in flight - its result is stale even though
        // this request itself succeeded, so don't let it override state.
        if (mySeq !== saveSeq.current) return;
        setStatus("saved");
        setSaveError(null);
        setLastSavedAt(new Date());
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (mySeq !== saveSeq.current) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("[dashboard] save failed:", err);
        setStatus("error");
        setSaveError(message);
      }
    })();
  }, []);

  const scheduleSave = useCallback(() => {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(runSave, SAVE_DELAY_MS);
  }, [runSave]);

  // A tab that's been sitting hidden in the background is the classic way
  // stale data creeps back in: it never sent anything while hidden (see
  // runSave above), but its in-memory state can still be minutes or hours
  // old. The moment it's visible again, if nothing here is actually
  // waiting to be saved, pull the current server state instead of letting
  // this tab keep operating on an old snapshot.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (saveTimer.current || status === "saving") return;
      fetch("/api/dashboard", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.ok && json.data) setData(json.data);
        })
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [status]);

  function setOneThing(text: string) {
    setData((prev) => ({ ...prev, oneThing: { text, date: todayKey() } }));
    scheduleSave();
  }

  function setBrainDump(text: string) {
    setData((prev) => ({ ...prev, brainDump: text }));
    scheduleSave();
  }

  function updateLifeWeekly(updater: (lw: LifeWeekly) => LifeWeekly) {
    setData((prev) => ({ ...prev, lifeWeekly: updater(prev.lifeWeekly) }));
    scheduleSave();
  }

  function updateLife(updater: (w: WorldData) => WorldData) {
    setData((prev) => ({ ...prev, life: updater(prev.life) }));
    scheduleSave();
  }

  function updateWorkOps(updater: (wo: WorkOps) => WorkOps) {
    setData((prev) => ({ ...prev, workOps: updater(prev.workOps) }));
    scheduleSave();
  }

  function updateCadence(updater: (c: CadenceData) => CadenceData) {
    setData((prev) => ({ ...prev, cadence: updater(prev.cadence) }));
    scheduleSave();
  }

  function updateBackBeat(updater: (b: BackBeatData) => BackBeatData) {
    setData((prev) => ({ ...prev, backBeat: updater(prev.backBeat) }));
    scheduleSave();
  }

  function updateRoutines(updater: (r: RoutinesData) => RoutinesData) {
    setData((prev) => ({ ...prev, routines: updater(prev.routines) }));
    scheduleSave();
  }

  function updateLifeScore(updater: (l: LifeScoreData) => LifeScoreData) {
    setData((prev) => ({ ...prev, lifeScore: updater(prev.lifeScore) }));
    scheduleSave();
  }

  // For flows that touch several domains at once (e.g. the Board Meeting,
  // which writes to boardMeetings, lifeQuarterly, lifeWeekly, and year in
  // a single step) rather than threading a separate updater for each.
  function updateData(updater: (d: DashboardData) => DashboardData) {
    setData(updater);
    scheduleSave();
  }

  function updateRhythm(updater: (r: RhythmData) => RhythmData) {
    setData((prev) => ({ ...prev, rhythm: updater(prev.rhythm) }));
    scheduleSave();
  }

  function updateGlowUp(updater: (g: GlowUpData) => GlowUpData) {
    setData((prev) => ({ ...prev, glowUp: updater(prev.glowUp) }));
    scheduleSave();
  }

  function updateTextAlerts(updater: (t: TextAlertsData) => TextAlertsData) {
    setData((prev) => ({ ...prev, textAlerts: updater(prev.textAlerts) }));
    scheduleSave();
  }

  function updatePlanner(updater: (p: PlannerData) => PlannerData) {
    setData((prev) => ({ ...prev, planner: updater(prev.planner) }));
    scheduleSave();
  }

  function updateHomeZones(updater: (h: HomeZonesData) => HomeZonesData) {
    setData((prev) => ({ ...prev, homeZones: updater(prev.homeZones) }));
    scheduleSave();
  }

  function updateQuest(updater: (q: QuestData) => QuestData) {
    setData((prev) => ({ ...prev, quest: updater(prev.quest) }));
    scheduleSave();
  }

  function updateMemos(updater: (m: MemosData) => MemosData) {
    setData((prev) => ({ ...prev, memos: updater(prev.memos) }));
    scheduleSave();
  }

  function updateHealth(updater: (h: HealthData) => HealthData) {
    setData((prev) => ({ ...prev, health: updater(prev.health) }));
    scheduleSave();
  }

  function updateMealCalendar(updater: (m: MealCalendarData) => MealCalendarData) {
    setData((prev) => ({ ...prev, mealCalendar: updater(prev.mealCalendar) }));
    scheduleSave();
  }

  function updateFinance(updater: (f: FinanceData) => FinanceData) {
    setData((prev) => ({ ...prev, finance: updater(prev.finance) }));
    scheduleSave();
  }

  function updateBudget(updater: (b: BudgetData) => BudgetData) {
    setData((prev) => ({ ...prev, budget: updater(prev.budget) }));
    scheduleSave();
  }

  function updateTabUsage(updater: (t: TabUsageData) => TabUsageData) {
    setData((prev) => ({ ...prev, tabUsage: updater(prev.tabUsage) }));
    scheduleSave();
  }

  function updateSystemCheck(updater: (s: SystemCheckData) => SystemCheckData) {
    setData((prev) => ({ ...prev, systemCheck: updater(prev.systemCheck) }));
    scheduleSave();
  }

  function trackTabOpenNow(key: string) {
    setData((prev) => ({ ...prev, tabUsage: trackTabOpen(prev.tabUsage, key) }));
    scheduleSave();
  }

  function updateWedding(updater: (w: WeddingData) => WeddingData) {
    setData((prev) => ({ ...prev, wedding: updater(prev.wedding) }));
    scheduleSave();
  }

  function updateTrips(updater: (t: TripsData) => TripsData) {
    setData((prev) => ({ ...prev, trips: updater(prev.trips) }));
    scheduleSave();
  }

  function updateVision(updater: (v: VisionData) => VisionData) {
    setData((prev) => ({ ...prev, vision: updater(prev.vision) }));
    scheduleSave();
  }

  function updateKnowledge(updater: (k: KnowledgeData) => KnowledgeData) {
    setData((prev) => ({ ...prev, knowledge: updater(prev.knowledge) }));
    scheduleSave();
  }

  function updateMilestones(updater: (m: MilestoneData) => MilestoneData) {
    setData((prev) => ({ ...prev, milestones: updater(prev.milestones) }));
    scheduleSave();
  }

  function updateRewards(updater: (r: RewardsData) => RewardsData) {
    setData((prev) => ({ ...prev, rewards: updater(prev.rewards) }));
    scheduleSave();
  }

  function updatePaycheckPlans(updater: (p: PaycheckPlanData) => PaycheckPlanData) {
    setData((prev) => ({ ...prev, paycheckPlans: updater(prev.paycheckPlans) }));
    scheduleSave();
  }

  function updateWelcome(updater: (w: WelcomeData) => WelcomeData) {
    setData((prev) => ({ ...prev, welcome: updater(prev.welcome) }));
    scheduleSave();
  }

  function dismissWelcome() {
    updateWelcome((w) => markWelcomeShown(w, new Date()));
    setShowWelcome(false);
  }

  function updateDailyTheme(updater: (d: DailyThemeData) => DailyThemeData) {
    setData((prev) => ({ ...prev, dailyTheme: updater(prev.dailyTheme) }));
    scheduleSave();
  }

  function dismissDailyTheme() {
    updateDailyTheme((d) => markDailyThemeShown(d, new Date()));
    setShowDailyTheme(false);
  }

  // Fuzzy soft-link, same rule as findLinkedVault/findLinkedDebt in
  // CommandCenter - a prompt like "Reach out to someone I love" only needs
  // to roughly match a habit label ("Reach out to family") for a check
  // here to also check off today's habit cell, and a rename on either
  // side doesn't silently break the link.
  function findLinkedHabitByPrompt(habits: HabitsData, promptText: string) {
    const needle = promptText.trim().toLowerCase();
    if (!needle) return undefined;
    return (
      habits.habits.find((h) => h.label.trim().toLowerCase() === needle) ??
      habits.habits.find(
        (h) => h.label.trim().toLowerCase().includes(needle) || needle.includes(h.label.trim().toLowerCase())
      )
    );
  }

  function handleToggleDailyThemePrompt(promptId: string, promptText: string) {
    const now = new Date();
    const wasCompleted = completedPromptIdsFor(data.dailyTheme, now).includes(promptId);
    const nowCompleted = !wasCompleted;
    updateDailyTheme((d) => togglePromptCompletion(d, now, promptId));

    const linkedHabit = findLinkedHabitByPrompt(data.habits, promptText);
    if (linkedHabit) {
      const habitId = linkedHabit.id;
      const todayStorageIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
      updateHabits((h) => setHabitCompletion(h, weekKeyFor(now), habitId, todayStorageIndex, nowCompleted));
    }
  }

  function updateVendors(updater: (v: VendorsData) => VendorsData) {
    setData((prev) => ({ ...prev, vendors: updater(prev.vendors) }));
    scheduleSave();
  }

  function updateWorkShutdown(updater: (w: WorkShutdownData) => WorkShutdownData) {
    setData((prev) => ({ ...prev, workShutdown: updater(prev.workShutdown) }));
    scheduleSave();
  }

  function updateMeetingOps(updater: (m: MeetingOpsData) => MeetingOpsData) {
    setData((prev) => ({ ...prev, meetingOps: updater(prev.meetingOps) }));
    scheduleSave();
  }

  function updatePrincipals(updater: (p: PrincipalsData) => PrincipalsData) {
    setData((prev) => ({ ...prev, principals: updater(prev.principals) }));
    scheduleSave();
  }

  function updateQuestionBank(updater: (q: QuestionBankData) => QuestionBankData) {
    setData((prev) => ({ ...prev, questionBank: updater(prev.questionBank) }));
    scheduleSave();
  }

  function updateTemplates(updater: (t: TemplatesData) => TemplatesData) {
    setData((prev) => ({ ...prev, templates: updater(prev.templates) }));
    scheduleSave();
  }

  function updatePreMortem(updater: (p: PreMortemData) => PreMortemData) {
    setData((prev) => ({ ...prev, preMortem: updater(prev.preMortem) }));
    scheduleSave();
  }

  function updateFireDrillLog(updater: (f: FireDrillLogData) => FireDrillLogData) {
    setData((prev) => ({ ...prev, fireDrillLog: updater(prev.fireDrillLog) }));
    scheduleSave();
  }

  function updateFridayLedger(updater: (f: FridayLedgerData) => FridayLedgerData) {
    setData((prev) => ({ ...prev, fridayLedger: updater(prev.fridayLedger) }));
    scheduleSave();
  }

  function updateEvents(updater: (e: EventsData) => EventsData) {
    setData((prev) => ({ ...prev, events: updater(prev.events) }));
    scheduleSave();
  }

  function handleOpenOpsTool(tool: OpsTool) {
    setOpsView(tool);
  }

  function toggleTodayFocusTask(item: TodayFocusItem) {
    if (item.source === "workOps") {
      updateWorkOps((wo) => ({
        ...wo,
        tasks: wo.tasks.map((t) =>
          t.id === item.id
            ? { ...t, status: t.status === "completed" ? "in_progress" : "completed" }
            : t
        ),
      }));
    } else if (item.source === "week") {
      updateLifeWeekly((lw) => {
        const weekKey = weekKeyFor(new Date());
        const week = weekDataFor(lw, weekKey);
        return {
          ...lw,
          weeks: {
            ...lw.weeks,
            [weekKey]: {
              ...week,
              tasks: week.tasks.map((t) => (t.id === item.id ? { ...t, done: !t.done } : t)),
            },
          },
        };
      });
    } else {
      updateLife((w) => ({
        ...w,
        tasks: w.tasks.map((t) => (t.id === item.id ? { ...t, done: !t.done } : t)),
      }));
    }
  }

  function updateGrocery(updater: (g: GroceryData) => GroceryData) {
    setData((prev) => ({ ...prev, lists: { ...prev.lists, grocery: updater(prev.lists.grocery) } }));
    scheduleSave();
  }

  function updateDump(updater: (d: DumpData) => DumpData) {
    setData((prev) => ({ ...prev, lists: { ...prev.lists, dump: updater(prev.lists.dump) } }));
    scheduleSave();
  }

  function updateFocus(updater: (f: FocusData) => FocusData) {
    setData((prev) => ({ ...prev, focus: updater(prev.focus) }));
    scheduleSave();
  }

  function updateAssistant(updater: (a: AssistantData) => AssistantData) {
    setData((prev) => ({ ...prev, assistant: updater(prev.assistant) }));
    scheduleSave();
  }

  function updateAppearance(updater: (a: AppearanceData) => AppearanceData) {
    setData((prev) => ({ ...prev, appearance: updater(prev.appearance) }));
    scheduleSave();
  }

  function updateAmbiance(updater: (a: AmbianceData) => AmbianceData) {
    setData((prev) => ({ ...prev, ambiance: updater(prev.ambiance) }));
    scheduleSave();
  }

  // lib/sound.ts reads ambiance settings from this module-level cache
  // rather than a prop, since check-off sound is triggered from dozens of
  // CheckCircle/HabitCell call sites across the app.
  useEffect(() => {
    setAmbianceSettings(data.ambiance);
  }, [data.ambiance]);

  // Re-checks every reward's trigger whenever anything it could depend on
  // changes (a milestone log, a debt payment, a Scholar streak, opening the
  // app on a new day). evaluateRewardTriggers only ever moves "active"
  // rewards forward to "readyToClaim" and never re-touches one that's
  // already left "active", so re-running this after our own setData below
  // is always a no-op the second time - safe to keep rewards.rewards itself
  // in the dependency list (needed to catch a brand-new reward whose
  // trigger is already met the moment she creates it).
  useEffect(() => {
    const now = new Date();
    const result = evaluateRewardTriggers(data.rewards.rewards, {
      now,
      milestoneEntries: data.milestones.entries,
      debts: data.lifeQuarterly.money.debts,
      scholarStreakCurrent: data.knowledge.scholarStreak.current,
      appOpenDateKeys: Object.keys(data.lifeScore.history),
    });
    if (!result.changed) return;
    setData((prev) => ({ ...prev, rewards: { ...prev.rewards, rewards: result.rewards } }));
    scheduleSave();
    if (result.newlyReady.length > 0) {
      triggerCelebration("big", `🎁 ${result.newlyReady[0].name} is ready to claim!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.rewards.rewards,
    data.milestones.entries,
    data.lifeQuarterly.money.debts,
    data.knowledge.scholarStreak.current,
    data.lifeScore.history,
  ]);

  // The Assistant's tools can touch any part of the dashboard (tasks,
  // planner, lists, health, events, meals, finance, waiting-on, Dec 8
  // goals, her own memory) - one generic updater covers all of them
  // instead of threading a narrow per-domain callback through for each.
  function updateDashboardData(updater: (d: DashboardData) => DashboardData) {
    setData(updater);
    scheduleSave();
  }

  function updateBecoming(updater: (b: BecomingData) => BecomingData) {
    setData((prev) => ({ ...prev, becoming: updater(prev.becoming) }));
    scheduleSave();
  }

  function triggerCelebration(tier: CelebrationTier, message: string) {
    setCelebration({ tier, message });
  }

  function sendDumpItemToWork(text: string) {
    setData((prev) => ({
      ...prev,
      workOps: {
        tasks: [
          ...prev.workOps.tasks,
          {
            id: crypto.randomUUID(),
            title: text,
            status: "not_started",
            priority: "medium",
            category: "Administration",
            dueDate: "",
            notes: "",
            topPriority: false,
            createdAt: new Date().toISOString(),
            progressPct: 0,
            progressLog: [],
            stallSnoozedUntil: "",
          },
        ],
      },
    }));
    scheduleSave();
  }

  function sendDumpItemToLife(text: string) {
    setData((prev) => ({
      ...prev,
      life: {
        ...prev.life,
        tasks: [
          ...prev.life.tasks,
          { id: crypto.randomUUID(), text, done: false, focus: false, createdAt: new Date().toISOString() },
        ],
      },
    }));
    scheduleSave();
  }

  function sendDumpItemToGrocery(text: string) {
    setData((prev) => ({
      ...prev,
      lists: {
        ...prev.lists,
        grocery: {
          ...prev.lists.grocery,
          items: [
            ...prev.lists.grocery.items,
            {
              id: crypto.randomUUID(),
              text,
              category: guessGroceryCategory(text),
              done: false,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    }));
    scheduleSave();
  }

  function sendDumpItemToParkingLot(text: string) {
    setData((prev) => {
      const quarterKey = quarterKeyFor(new Date());
      const quarterData = quarterDataFor(prev.lifeQuarterly, quarterKey);
      return {
        ...prev,
        lifeQuarterly: {
          ...prev.lifeQuarterly,
          quarters: {
            ...prev.lifeQuarterly.quarters,
            [quarterKey]: {
              ...quarterData,
              parkingLot: [...quarterData.parkingLot, { id: crypto.randomUUID(), text }],
            },
          },
        },
      };
    });
    scheduleSave();
  }

  function updateHabits(updater: (h: HabitsData) => HabitsData) {
    setData((prev) => ({ ...prev, habits: updater(prev.habits) }));
    scheduleSave();
  }

  function updateReference(updater: (r: ReferenceData) => ReferenceData) {
    setData((prev) => ({ ...prev, reference: updater(prev.reference) }));
    scheduleSave();
  }

  function updateLifeQuarterly(updater: (lq: LifeQuarterly) => LifeQuarterly) {
    setData((prev) => ({ ...prev, lifeQuarterly: updater(prev.lifeQuarterly) }));
    scheduleSave();
  }

  function updateBooks(updater: (b: BooksData) => BooksData) {
    setData((prev) => ({ ...prev, books: updater(prev.books) }));
    scheduleSave();
  }

  function updateBucketList(updater: (b: BucketListData) => BucketListData) {
    setData((prev) => ({ ...prev, bucketList: updater(prev.bucketList) }));
    scheduleSave();
  }

  function updateYear(updater: (y: YearData) => YearData) {
    setData((prev) => ({ ...prev, year: updater(prev.year) }));
    scheduleSave();
  }

  function updateDailyReview(updater: (d: DailyReviewData) => DailyReviewData) {
    setData((prev) => ({ ...prev, dailyReview: updater(prev.dailyReview) }));
    scheduleSave();
  }

  const oneThingText = data.oneThing.date === todayKey() ? data.oneThing.text : "";
  const thisWeekTasks = weekDataFor(data.lifeWeekly, weekKeyFor(new Date())).tasks;
  const counts = {
    work: data.workOps.tasks.filter((t) => t.status !== "completed").length,
    life: thisWeekTasks.filter((t) => !t.done).length,
  };

  function handleFrontPageNavigate(target: FrontPageNavTarget) {
    setWorld(target.world);
    if (target.world === "work" && target.workView) setWorkView(target.workView);
    if (target.world === "work" && target.opsView) setOpsView(target.opsView);
    if (target.world === "life" && target.lifeView) setLifeView(target.lifeView);
    if (target.world === "life" && target.openBoardMeeting) setBoardMeetingOpen(true);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper-bg">
      {showWelcome && <WelcomeScreen onDone={dismissWelcome} />}
      {!showWelcome && showDailyTheme && (
        <DailyThemeScreen
          theme={themeForDate(data.dailyTheme, new Date())}
          completedPromptIds={completedPromptIdsFor(data.dailyTheme, new Date())}
          onTogglePrompt={handleToggleDailyThemePrompt}
          onDismiss={dismissDailyTheme}
          onEdit={() => setDailyThemeEditorDay(dayKeyForDate(new Date()))}
          onChangeImage={(updater) =>
            updateDailyTheme((d) => ({
              ...d,
              themes: {
                ...d.themes,
                [dayKeyForDate(new Date())]: {
                  ...d.themes[dayKeyForDate(new Date())],
                  image: updater(d.themes[dayKeyForDate(new Date())].image),
                },
              },
            }))
          }
        />
      )}
      {dailyThemeEditorDay && (
        <DailyThemeEditor
          data={data.dailyTheme}
          initialDayKey={dailyThemeEditorDay}
          onChange={updateDailyTheme}
          onClose={() => setDailyThemeEditorDay(null)}
        />
      )}
      <header className="safe-top px-5 pb-2 pt-2">
        <div className="flex items-center justify-between gap-2">
          <Monogram />
          <div className="flex items-center gap-2">
            <SaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={scheduleSave} />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="text-base leading-none text-paper-muted"
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      {status === "error" && saveError && (
        <div className="mx-5 mb-2 rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2">
          <p className="text-[11px] leading-snug text-backdrop-ink">
            <span className="font-semibold">Save error (screenshot or copy this for support):</span>{" "}
            {saveError}
          </p>
        </div>
      )}

      <WorldToggle
        world={world}
        onChange={(w) => {
          // Tapping "Life" again while already there returns to the tile-
          // grid map, since the SubNav itself has no dedicated entry for it.
          if (w === "life" && world === "life") {
            setLifeView("hub");
          } else {
            setWorld(w);
          }
        }}
        counts={counts}
        assistantName={assistantDisplayName(data.assistant)}
      />

      <main className="flex min-h-0 flex-1 flex-col px-5 pt-3">
       <TabErrorBoundary key={`${world}-${workView}-${opsView}-${lifeView}`}>
        {world === "front" ? (
          <FrontPage
            data={data}
            oneThingText={oneThingText}
            onOneThingChange={setOneThing}
            onNavigate={handleFrontPageNavigate}
            onChangeLifeScore={updateLifeScore}
            onChangeRhythm={updateRhythm}
            onOpenQuickDump={() => setQuickDumpOpen(true)}
            onOpenFocus={() => setFocusOpen(true)}
            onToggleFocusTask={toggleTodayFocusTask}
            onChangeHomeZones={updateHomeZones}
            onChangeQuest={updateQuest}
            onChangeKnowledge={updateKnowledge}
            onCelebrate={triggerCelebration}
          />
        ) : world === "work" ? (
          <>
            <SubNav
              items={[
                { key: "dashboard", label: "Dashboard" },
                { key: "cadence", label: "Cadence" },
                { key: "backbeat", label: "BackBeat" },
                { key: "ops", label: "Ops" },
                { key: "knowledge", label: "Knowledge" },
                { key: "reference", label: "Reference" },
              ].filter((i) => !isTabHidden(data.tabUsage, `work:${i.key}`)) as { key: WorkView; label: string }[]}
              active={workView}
              onChange={(v: WorkView) => {
                setWorkView(v);
                if (v === "ops") setOpsView("hub");
                trackTabOpenNow(`work:${v}`);
              }}
              accentClass="bg-work"
            />
            {workView === "dashboard" && (
              <OperationsDashboard workOps={data.workOps} onChange={updateWorkOps} />
            )}
            {workView === "cadence" && (
              <CadenceView
                data={data.cadence}
                onChange={updateCadence}
                onStartSystemCheck={() => setSystemCheckOpen(true)}
              />
            )}
            {workView === "backbeat" && (
              <BackBeat backBeat={data.backBeat} onChange={updateBackBeat} />
            )}
            {workView === "ops" && opsView === "hub" && (
              <OpsHub data={data} onOpenTool={handleOpenOpsTool} />
            )}
            {workView === "ops" && opsView === "waitingOn" && (
              <WaitingOnView
                waitingOn={data.waitingOn}
                onChangeData={updateData}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "workShutdown" && (
              <WorkShutdownView
                workShutdown={data.workShutdown}
                onChange={updateWorkShutdown}
                onBack={() => setOpsView("hub")}
                onCelebrate={triggerCelebration}
              />
            )}
            {workView === "ops" && opsView === "vendors" && (
              <VendorsView
                vendors={data.vendors}
                onChange={updateVendors}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "meetingOps" && (
              <MeetingOpsView
                meetingOps={data.meetingOps}
                onChange={updateMeetingOps}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "principals" && (
              <PrincipalsView
                principals={data.principals}
                onChange={updatePrincipals}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "questionBank" && (
              <QuestionBankView
                questionBank={data.questionBank}
                onChange={updateQuestionBank}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "templates" && (
              <TemplatesView
                templates={data.templates}
                onChange={updateTemplates}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "myNumbers" && (
              <MyNumbersView data={data} onBack={() => setOpsView("hub")} />
            )}
            {workView === "ops" && opsView === "preMortem" && (
              <PreMortemView
                preMortem={data.preMortem}
                onChange={updatePreMortem}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "fireDrillLog" && (
              <FireDrillLogView
                fireDrillLog={data.fireDrillLog}
                onChange={updateFireDrillLog}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "fridayLedger" && (
              <FridayLedgerView
                data={data}
                onChange={updateFridayLedger}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "ops" && opsView === "events" && (
              <EventsView
                events={data.events}
                onChange={updateEvents}
                onBack={() => setOpsView("hub")}
              />
            )}
            {workView === "knowledge" && (
              <KnowledgeView knowledge={data.knowledge} onChange={updateKnowledge} onCelebrate={triggerCelebration} />
            )}
            {workView === "reference" && (
              <Reference reference={data.reference} onChange={updateReference} />
            )}
          </>
        ) : world === "planner" ? (
          <PlannerView
            data={data.planner}
            routinesData={data.routines}
            lifeScore={data.lifeScore}
            onChange={updatePlanner}
            onChangeRoutines={updateRoutines}
            onEditRoutineTemplate={(routineKey) => {
              setManageRoutinesTarget(routineKey);
              setWorld("life");
              setLifeView("manageRoutines");
            }}
          />
        ) : world === "assistant" ? (
          <AssistantView data={data} onChangeData={updateDashboardData} />
        ) : (
          <>
            {lifeView !== "manageHabits" && lifeView !== "manageRoutines" && (
              <SubNav
                items={[
                  { key: "tasks", label: "Tasks" },
                  { key: "week", label: "This Week" },
                  { key: "rituals", label: "Rituals" },
                  { key: "money", label: "Money" },
                  { key: "meals", label: "Meals" },
                  { key: "quarter", label: "Quarter" },
                  { key: "lists", label: "Lists" },
                  { key: "rhythm", label: "Rhythm" },
                  { key: "glowUp", label: "Glow Up" },
                  { key: "home", label: "Home" },
                  { key: "books", label: "Books" },
                  { key: "bucketList", label: "Bucket List" },
                  { key: "year", label: "Year" },
                  { key: "dec8", label: "Dec 8" },
                  { key: "verses", label: "Verses" },
                  { key: "memos", label: "Memos" },
                  { key: "health", label: "Health" },
                  { key: "wedding", label: "Wedding" },
                  { key: "trips", label: "Trips" },
                  { key: "vision", label: "Vision" },
                ].filter((i) => !isTabHidden(data.tabUsage, `life:${i.key}`)) as { key: LifeView; label: string }[]}
                active={lifeView}
                onChange={(v: LifeView) => {
                  setLifeView(v);
                  trackTabOpenNow(`life:${v}`);
                }}
                accentClass="bg-life"
              />
            )}
            {lifeView === "hub" && (
              <LifeHomeView data={data} onNavigate={(key) => setLifeView(key as LifeView)} />
            )}
            {lifeView === "tasks" && <LifeTasksView world={data.life} onChange={updateLife} />}
            {lifeView === "week" && (
              <WeekView
                lifeWeekly={data.lifeWeekly}
                currentlyReading={data.books.currentlyReading}
                onChange={updateLifeWeekly}
              />
            )}
            {lifeView === "rituals" && (
              <RitualsView
                routinesData={data.routines}
                onChangeRoutines={updateRoutines}
                onManageRoutines={() => setLifeView("manageRoutines")}
                habitsData={data.habits}
                onChangeHabits={updateHabits}
                onManageHabits={() => setLifeView("manageHabits")}
                onCelebrate={triggerCelebration}
              />
            )}
            {lifeView === "manageRoutines" && (
              <ManageRoutines
                routinesData={data.routines}
                onChange={updateRoutines}
                habitsData={data.habits}
                initialRoutineKey={manageRoutinesTarget ?? undefined}
                onBack={() => {
                  setManageRoutinesTarget(null);
                  setLifeView("rituals");
                }}
              />
            )}
            {lifeView === "manageHabits" && (
              <ManageHabits
                habitsData={data.habits}
                onChange={updateHabits}
                onBack={() => setLifeView("rituals")}
              />
            )}
            {lifeView === "money" && (
              <MoneyView
                lifeQuarterly={data.lifeQuarterly}
                onChange={updateLifeQuarterly}
                finance={data.finance}
                onChangeFinance={updateFinance}
                budget={data.budget}
                onChangeBudget={updateBudget}
                paycheckPlans={data.paycheckPlans}
                onChangePaycheckPlans={updatePaycheckPlans}
                milestones={data.milestones}
                rewards={data.rewards}
                onChangeRewards={updateRewards}
                scholarStreakCurrent={data.knowledge.scholarStreak.current}
                appOpenDateKeys={Object.keys(data.lifeScore.history)}
                onCelebrate={triggerCelebration}
              />
            )}
            {lifeView === "meals" && (
              <MealsView
                mealCalendar={data.mealCalendar}
                onChange={updateMealCalendar}
                recipeBank={data.recipes}
                onCelebrate={triggerCelebration}
              />
            )}
            {lifeView === "quarter" && (
              <QuarterView
                lifeQuarterly={data.lifeQuarterly}
                lifeWeekly={data.lifeWeekly}
                boardMeetings={data.boardMeetings}
                onChange={updateLifeQuarterly}
                onStartBoardMeeting={() => setBoardMeetingOpen(true)}
              />
            )}
            {lifeView === "lists" && (
              <ListsView
                grocery={data.lists.grocery}
                dump={data.lists.dump}
                onChangeGrocery={updateGrocery}
                onChangeDump={updateDump}
                onSendToWork={sendDumpItemToWork}
                onSendToLife={sendDumpItemToLife}
                onSendToGrocery={sendDumpItemToGrocery}
                onSendToParkingLot={sendDumpItemToParkingLot}
              />
            )}
            {lifeView === "rhythm" && (
              <RhythmView rhythmData={data.rhythm} onChange={updateRhythm} />
            )}
            {lifeView === "glowUp" && (
              <GlowUpView
                data={data.glowUp}
                onChange={updateGlowUp}
                becoming={data.becoming}
                onChangeBecoming={updateBecoming}
              />
            )}
            {lifeView === "home" && (
              <HomeView data={data.homeZones} onChange={updateHomeZones} />
            )}
            {lifeView === "books" && <BooksView books={data.books} onChange={updateBooks} />}
            {lifeView === "bucketList" && (
              <BucketListView bucketList={data.bucketList} onChange={updateBucketList} />
            )}
            {lifeView === "year" && (
              <YearView
                year={data.year}
                onChange={updateYear}
                milestones={data.milestones}
                onChangeMilestones={updateMilestones}
                onCelebrate={triggerCelebration}
              />
            )}
            {lifeView === "dec8" && (
              <WarRoomSection
                transformations={data.year.transformations}
                warRoom={data.year.warRoom}
                paydayAnchorDate={data.lifeQuarterly.paydayChecklist.anchorDate}
                onChangeTransformations={(updater) =>
                  updateYear((y) => ({ ...y, transformations: updater(y.transformations) }))
                }
                onChangeWarRoom={(updater) => updateYear((y) => ({ ...y, warRoom: updater(y.warRoom) }))}
              />
            )}
            {lifeView === "verses" && <VersesView />}
            {lifeView === "memos" && <MemosView data={data.memos} onChange={updateMemos} />}
            {lifeView === "health" && (
              <HealthView health={data.health} onChange={updateHealth} />
            )}
            {lifeView === "wedding" && <WeddingView wedding={data.wedding} onChange={updateWedding} />}
            {lifeView === "trips" && <TripsView trips={data.trips} onChange={updateTrips} />}
            {lifeView === "vision" && <VisionView data={data.vision} onChange={updateVision} />}
          </>
        )}
       </TabErrorBoundary>
      </main>

      <DailyReviewBar dailyReview={data.dailyReview} onOpen={() => setDailyReviewOpen(true)} />

      {dailyReviewOpen && (
        <DailyReviewSheet
          dailyReview={data.dailyReview}
          onChange={updateDailyReview}
          onClose={() => setDailyReviewOpen(false)}
        />
      )}

      <BrainDump value={data.brainDump} onChange={setBrainDump} />

      {settingsOpen && (
        <SettingsSheet
          data={data}
          onImported={(imported) => {
            setData(imported);
            setStatus("saved");
            setLastSavedAt(new Date());
          }}
          onChangeLifeScoreWeights={(updater) =>
            updateLifeScore((l) => ({ ...l, weights: updater(l.weights) }))
          }
          onChangeTextAlerts={(updater) =>
            updateTextAlerts((t) => ({ ...t, settings: updater(t.settings) }))
          }
          onChangeAssistant={updateAssistant}
          onChangeTabUsage={updateTabUsage}
          onChangeAppearance={updateAppearance}
          onChangeAmbiance={updateAmbiance}
          onChangeDailyTheme={updateDailyTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {boardMeetingOpen && (
        <BoardMeeting
          data={data}
          onChangeData={updateData}
          onClose={() => setBoardMeetingOpen(false)}
        />
      )}

      {systemCheckOpen && (
        <SystemCheckFlow
          data={data}
          onChangeData={updateData}
          onClose={() => setSystemCheckOpen(false)}
        />
      )}

      {quickDumpOpen && (
        <QuickDump onChange={updateDump} onClose={() => setQuickDumpOpen(false)} />
      )}

      {focusOpen && (
        <FocusModeView
          oneThingText={oneThingText}
          focus={data.focus}
          onChange={updateFocus}
          onClose={() => setFocusOpen(false)}
        />
      )}

      <CelebrationOverlay celebration={celebration} onDismiss={() => setCelebration(null)} />
    </div>
  );
}
