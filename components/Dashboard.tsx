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
  YearData,
  weekDataFor,
} from "@/lib/types";
import { RoutinesData } from "@/lib/routines";
import { LifeScoreData } from "@/lib/lifescore";
import { GroceryData, DumpData } from "@/lib/lists";
import { RhythmData } from "@/lib/rhythm";
import { GlowUpData } from "@/lib/glowup";
import { TextAlertsData } from "@/lib/textalerts";
import { PlannerData } from "@/lib/planner";
import BoardMeeting from "./BoardMeeting";
import QuickDump from "./QuickDump";
import { todayKey } from "@/lib/date";
import { weekKeyFor } from "@/lib/week";
import WorldToggle from "./WorldToggle";
import SubNav from "./SubNav";
import WeekView from "./WeekView";
import BrainDump from "./BrainDump";
import DailyReviewBar from "./DailyReviewBar";
import DailyReviewSheet from "./DailyReviewSheet";
import SettingsSheet from "./SettingsSheet";
import FrontPage from "./FrontPage";
import { FrontPageNavTarget } from "@/lib/frontpage";
import OperationsDashboard from "./work/OperationsDashboard";
import BackBeat from "./work/BackBeat";
import Reference from "./work/Reference";
import HabitsView from "./life/HabitsView";
import ManageHabits from "./life/ManageHabits";
import RoutinesView from "./life/routines/RoutinesView";
import ManageRoutines from "./life/routines/ManageRoutines";
import QuarterView from "./life/quarter/QuarterView";
import ListsView from "./life/lists/ListsView";
import RhythmView from "./life/rhythm/RhythmView";
import GlowUpView from "./life/glowup/GlowUpView";
import PlannerView from "./life/planner/PlannerView";
import BooksView from "./life/BooksView";
import BucketListView from "./life/BucketListView";
import YearView from "./life/year/YearView";
import SaveIndicator, { SaveStatus } from "./SaveIndicator";

type World = "front" | "work" | "life";
type WorkView = "dashboard" | "backbeat" | "reference";
type LifeView =
  | "week"
  | "planner"
  | "routines"
  | "manageRoutines"
  | "habits"
  | "manageHabits"
  | "quarter"
  | "lists"
  | "rhythm"
  | "glowUp"
  | "books"
  | "bucketList"
  | "year";

const SAVE_DELAY_MS = 700;

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [world, setWorld] = useState<World>("front");
  const [workView, setWorkView] = useState<WorkView>("dashboard");
  const [lifeView, setLifeView] = useState<LifeView>("week");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [debugPanel, setDebugPanel] = useState<{
    lastSave?: {
      dbHost: string;
      brainDumpReceived: string;
      brainDumpConfirmedByDb: string;
      dumpItemCountReceived: number;
      dumpLatestItemReceived: string;
    };
    dbCheck?: {
      dbHost: string;
      brainDumpNow: string;
      dumpItemCount: number;
      dumpLatestItem: string;
      updatedAt: string | null;
    };
    dbCheckLoading?: boolean;
  } | null>(null);
  const [dailyReviewOpen, setDailyReviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardMeetingOpen, setBoardMeetingOpen] = useState(false);
  const [quickDumpOpen, setQuickDumpOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const scheduleSave = useCallback(() => {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/dashboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestData.current),
          cache: "no-store",
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`save failed (${res.status}): ${detail.slice(0, 500)}`);
        }
        const body = await res.json().catch(() => null);
        if (body?.debug) {
          setDebugPanel((prev) => ({ ...prev, lastSave: body.debug }));
        }
        setStatus("saved");
        setSaveError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[dashboard] save failed:", err);
        setStatus("error");
        setSaveError(message);
      }
    }, SAVE_DELAY_MS);
  }, []);

  async function checkDbNow() {
    setDebugPanel((prev) => ({ ...prev, dbCheckLoading: true }));
    try {
      const res = await fetch("/api/dashboard?debug=1", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.debug) {
        setDebugPanel((prev) => ({ ...prev, dbCheck: body.debug, dbCheckLoading: false }));
      } else {
        setDebugPanel((prev) => ({
          ...prev,
          dbCheck: {
            dbHost: "(error)",
            brainDumpNow: body?.error ?? "unknown error",
            dumpItemCount: 0,
            dumpLatestItem: "(error)",
            updatedAt: null,
          },
          dbCheckLoading: false,
        }));
      }
    } catch (err) {
      setDebugPanel((prev) => ({
        ...prev,
        dbCheck: {
          dbHost: "(error)",
          brainDumpNow: err instanceof Error ? err.message : String(err),
          dumpItemCount: 0,
          dumpLatestItem: "(error)",
          updatedAt: null,
        },
        dbCheckLoading: false,
      }));
    }
  }

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

  function updateWorkOps(updater: (wo: WorkOps) => WorkOps) {
    setData((prev) => ({ ...prev, workOps: updater(prev.workOps) }));
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

  function updateGrocery(updater: (g: GroceryData) => GroceryData) {
    setData((prev) => ({ ...prev, lists: { ...prev.lists, grocery: updater(prev.lists.grocery) } }));
    scheduleSave();
  }

  function updateDump(updater: (d: DumpData) => DumpData) {
    setData((prev) => ({ ...prev, lists: { ...prev.lists, dump: updater(prev.lists.dump) } }));
    scheduleSave();
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
            status: "in_progress",
            priority: "medium",
            category: "Administration",
            dueDate: "",
            notes: "",
            topPriority: false,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }));
    scheduleSave();
  }

  function sendDumpItemToLife(text: string) {
    setData((prev) => {
      const weekKey = weekKeyFor(new Date());
      const weekData = weekDataFor(prev.lifeWeekly, weekKey);
      return {
        ...prev,
        lifeWeekly: {
          ...prev.lifeWeekly,
          weeks: {
            ...prev.lifeWeekly.weeks,
            [weekKey]: {
              ...weekData,
              tasks: [
                ...weekData.tasks,
                { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() },
              ],
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
    if (target.world === "life" && target.lifeView) setLifeView(target.lifeView);
    if (target.world === "life" && target.openBoardMeeting) setBoardMeetingOpen(true);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper-bg">
      <header className="safe-top px-5 pb-2 pt-2">
        <div className="flex items-center justify-end gap-2">
          <SaveIndicator status={status} onRetry={scheduleSave} />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="text-base leading-none text-paper-muted"
          >
            ⚙
          </button>
        </div>
      </header>

      {status === "error" && saveError && (
        <div className="mx-5 mb-2 rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2">
          <p className="text-[11px] leading-snug text-paper-ink">
            <span className="font-semibold">Save error (screenshot or copy this for support):</span>{" "}
            {saveError}
          </p>
        </div>
      )}

      <div className="mx-5 mb-2 rounded-xl border border-[#C7A46B] bg-[#C7A46B]/10 px-3 py-2.5">
        <p className="mb-1.5 text-[11px] font-semibold text-paper-ink">
          Temporary Debug Panel (screenshot this whole box)
        </p>
        <button
          type="button"
          onClick={checkDbNow}
          className="mb-2 rounded-full bg-[#C7A46B] px-3 py-1 text-[11px] font-medium text-paper-surface"
        >
          {debugPanel?.dbCheckLoading ? "Checking…" : "Check Database Now"}
        </button>
        <div className="space-y-1 text-[10.5px] leading-snug text-paper-ink">
          <p>
            <span className="font-semibold">Last save sent to server:</span>{" "}
            {debugPanel?.lastSave ? JSON.stringify(debugPanel.lastSave) : "(no save yet this session)"}
          </p>
          <p>
            <span className="font-semibold">Database right now (tap button above):</span>{" "}
            {debugPanel?.dbCheck ? JSON.stringify(debugPanel.dbCheck) : "(not checked yet)"}
          </p>
        </div>
      </div>

      <WorldToggle world={world} onChange={setWorld} counts={counts} />

      <main className="flex min-h-0 flex-1 flex-col px-5 pt-3">
        {world === "front" ? (
          <FrontPage
            data={data}
            oneThingText={oneThingText}
            onOneThingChange={setOneThing}
            counts={counts}
            onNavigate={handleFrontPageNavigate}
            onChangeLifeScore={updateLifeScore}
            onChangeRhythm={updateRhythm}
            onOpenQuickDump={() => setQuickDumpOpen(true)}
          />
        ) : world === "work" ? (
          <>
            <SubNav
              items={[
                { key: "dashboard", label: "Dashboard" },
                { key: "backbeat", label: "BackBeat" },
                { key: "reference", label: "Reference" },
              ]}
              active={workView}
              onChange={setWorkView}
              accentClass="bg-work"
            />
            {workView === "dashboard" && (
              <OperationsDashboard workOps={data.workOps} onChange={updateWorkOps} />
            )}
            {workView === "backbeat" && (
              <BackBeat backBeat={data.backBeat} onChange={updateBackBeat} />
            )}
            {workView === "reference" && (
              <Reference reference={data.reference} onChange={updateReference} />
            )}
          </>
        ) : (
          <>
            {lifeView !== "manageHabits" && lifeView !== "manageRoutines" && (
              <SubNav
                items={[
                  { key: "week", label: "This Week" },
                  { key: "planner", label: "Planner" },
                  { key: "routines", label: "Routines" },
                  { key: "habits", label: "Habits" },
                  { key: "quarter", label: "Quarter" },
                  { key: "lists", label: "Lists" },
                  { key: "rhythm", label: "Rhythm" },
                  { key: "glowUp", label: "Glow Up" },
                  { key: "books", label: "Books" },
                  { key: "bucketList", label: "Bucket List" },
                  { key: "year", label: "Year" },
                ]}
                active={lifeView}
                onChange={setLifeView}
                accentClass="bg-life"
              />
            )}
            {lifeView === "week" && (
              <WeekView
                lifeWeekly={data.lifeWeekly}
                currentlyReading={data.books.currentlyReading}
                onChange={updateLifeWeekly}
              />
            )}
            {lifeView === "planner" && (
              <PlannerView
                data={data.planner}
                routinesConfig={data.routines.config}
                onChange={updatePlanner}
              />
            )}
            {lifeView === "routines" && (
              <RoutinesView
                routinesData={data.routines}
                onChange={updateRoutines}
                onManage={() => setLifeView("manageRoutines")}
              />
            )}
            {lifeView === "manageRoutines" && (
              <ManageRoutines
                routinesData={data.routines}
                onChange={updateRoutines}
                onBack={() => setLifeView("routines")}
              />
            )}
            {lifeView === "habits" && (
              <HabitsView
                habitsData={data.habits}
                onChange={updateHabits}
                onManage={() => setLifeView("manageHabits")}
              />
            )}
            {lifeView === "manageHabits" && (
              <ManageHabits
                habitsData={data.habits}
                onChange={updateHabits}
                onBack={() => setLifeView("habits")}
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
              />
            )}
            {lifeView === "rhythm" && (
              <RhythmView rhythmData={data.rhythm} onChange={updateRhythm} />
            )}
            {lifeView === "glowUp" && (
              <GlowUpView data={data.glowUp} onChange={updateGlowUp} />
            )}
            {lifeView === "books" && <BooksView books={data.books} onChange={updateBooks} />}
            {lifeView === "bucketList" && (
              <BucketListView bucketList={data.bucketList} onChange={updateBucketList} />
            )}
            {lifeView === "year" && (
              <YearView
                year={data.year}
                paydayAnchorDate={data.lifeQuarterly.paydayChecklist.anchorDate}
                onChange={updateYear}
              />
            )}
          </>
        )}
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
          }}
          onChangeLifeScoreWeights={(updater) =>
            updateLifeScore((l) => ({ ...l, weights: updater(l.weights) }))
          }
          onChangeTextAlerts={(updater) =>
            updateTextAlerts((t) => ({ ...t, settings: updater(t.settings) }))
          }
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

      {quickDumpOpen && (
        <QuickDump onChange={updateDump} onClose={() => setQuickDumpOpen(false)} />
      )}
    </div>
  );
}
