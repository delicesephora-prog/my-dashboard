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
import BooksView from "./life/BooksView";
import BucketListView from "./life/BucketListView";
import YearView from "./life/year/YearView";
import SaveIndicator, { SaveStatus } from "./SaveIndicator";

type World = "front" | "work" | "life";
type WorkView = "dashboard" | "backbeat" | "reference";
type LifeView =
  | "week"
  | "routines"
  | "manageRoutines"
  | "habits"
  | "manageHabits"
  | "quarter"
  | "books"
  | "bucketList"
  | "year";

const LOCAL_KEY = "dashboard-cache-v1";
const SAVE_DELAY_MS = 700;

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [world, setWorld] = useState<World>("front");
  const [workView, setWorkView] = useState<WorkView>("dashboard");
  const [lifeView, setLifeView] = useState<LifeView>("week");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [dailyReviewOpen, setDailyReviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`save failed (${res.status}): ${detail.slice(0, 500)}`);
        }
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(latestData.current));
        setStatus("saved");
      } catch (err) {
        console.error("[dashboard] save failed:", err);
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  }, []);

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

      <WorldToggle world={world} onChange={setWorld} counts={counts} />

      <main className="flex min-h-0 flex-1 flex-col px-5 pt-3">
        {world === "front" ? (
          <FrontPage
            data={data}
            oneThingText={oneThingText}
            onOneThingChange={setOneThing}
            counts={counts}
            onNavigate={handleFrontPageNavigate}
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
                  { key: "routines", label: "Routines" },
                  { key: "habits", label: "Habits" },
                  { key: "quarter", label: "Quarter" },
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
                onChange={updateLifeQuarterly}
              />
            )}
            {lifeView === "books" && <BooksView books={data.books} onChange={updateBooks} />}
            {lifeView === "bucketList" && (
              <BucketListView bucketList={data.bucketList} onChange={updateBucketList} />
            )}
            {lifeView === "year" && <YearView year={data.year} onChange={updateYear} />}
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
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
