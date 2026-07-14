"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackBeat as BackBeatData,
  DashboardData,
  HabitsData,
  LifeWeekly,
  WorkOps,
  weekDataFor,
} from "@/lib/types";
import { todayKey } from "@/lib/date";
import { weekKeyFor } from "@/lib/week";
import Greeting from "./Greeting";
import OneThing from "./OneThing";
import WorldToggle from "./WorldToggle";
import SubNav from "./SubNav";
import WeekView from "./WeekView";
import OperationsDashboard from "./work/OperationsDashboard";
import BackBeat from "./work/BackBeat";
import HabitsView from "./life/HabitsView";
import ManageHabits from "./life/ManageHabits";
import SaveIndicator, { SaveStatus } from "./SaveIndicator";

type World = "work" | "life";
type WorkView = "dashboard" | "backbeat";
type LifeView = "week" | "habits" | "manageHabits";

const LOCAL_KEY = "dashboard-cache-v1";
const SAVE_DELAY_MS = 700;

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [world, setWorld] = useState<World>("work");
  const [workView, setWorkView] = useState<WorkView>("dashboard");
  const [lifeView, setLifeView] = useState<LifeView>("week");
  const [status, setStatus] = useState<SaveStatus>("idle");

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
        if (!res.ok) throw new Error("save failed");
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(latestData.current));
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  }, []);

  function setOneThing(text: string) {
    setData((prev) => ({ ...prev, oneThing: { text, date: todayKey() } }));
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

  function updateHabits(updater: (h: HabitsData) => HabitsData) {
    setData((prev) => ({ ...prev, habits: updater(prev.habits) }));
    scheduleSave();
  }

  const oneThingText = data.oneThing.date === todayKey() ? data.oneThing.text : "";
  const thisWeekTasks = weekDataFor(data.lifeWeekly, weekKeyFor(new Date())).tasks;
  const counts = {
    work: data.workOps.tasks.filter((t) => t.status !== "completed").length,
    life: thisWeekTasks.filter((t) => !t.done).length,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper-bg">
      <header className="safe-top px-5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <Greeting />
          <div className="pt-1">
            <SaveIndicator status={status} />
          </div>
        </div>
      </header>

      <div className="px-5 pb-3">
        <OneThing value={oneThingText} onChange={setOneThing} />
      </div>

      <WorldToggle world={world} onChange={setWorld} counts={counts} />

      <main className="flex min-h-0 flex-1 flex-col px-5 pt-3">
        {world === "work" ? (
          <>
            <SubNav
              items={[
                { key: "dashboard", label: "Dashboard" },
                { key: "backbeat", label: "BackBeat" },
              ]}
              active={workView}
              onChange={setWorkView}
              accentClass="bg-work"
            />
            {workView === "dashboard" ? (
              <OperationsDashboard workOps={data.workOps} onChange={updateWorkOps} />
            ) : (
              <BackBeat backBeat={data.backBeat} onChange={updateBackBeat} />
            )}
          </>
        ) : (
          <>
            {lifeView !== "manageHabits" && (
              <SubNav
                items={[
                  { key: "week", label: "This Week" },
                  { key: "habits", label: "Habits" },
                ]}
                active={lifeView}
                onChange={setLifeView}
                accentClass="bg-life"
              />
            )}
            {lifeView === "week" && (
              <WeekView lifeWeekly={data.lifeWeekly} onChange={updateLifeWeekly} />
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
          </>
        )}
      </main>
    </div>
  );
}
