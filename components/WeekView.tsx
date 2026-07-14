"use client";

import { useState } from "react";
import { Book, LifeWeekly, WeekData, WeekTask, weekDataFor } from "@/lib/types";
import { weekKeyFor, shiftWeekKey, formatWeekRange } from "@/lib/week";
import WeekNav from "./WeekNav";
import WeekChecklist from "./WeekChecklist";
import WorkoutTracker from "./WorkoutTracker";
import WeeklyFocusCard from "./WeeklyFocusCard";
import ReflectionCard from "./ReflectionCard";
import CurrentlyReadingCard from "./CurrentlyReadingCard";

export default function WeekView({
  lifeWeekly,
  currentlyReading,
  onChange,
}: {
  lifeWeekly: LifeWeekly;
  currentlyReading: Book | null;
  onChange: (updater: (lw: LifeWeekly) => LifeWeekly) => void;
}) {
  const [weekKey, setWeekKey] = useState(() => weekKeyFor(new Date()));
  const weekData = weekDataFor(lifeWeekly, weekKey);
  const isCurrent = weekKey === weekKeyFor(new Date());

  function updateWeek(updater: (w: WeekData) => WeekData) {
    onChange((lw) => ({
      ...lw,
      weeks: { ...lw.weeks, [weekKey]: updater(weekDataFor(lw, weekKey)) },
    }));
  }

  function addTask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const task: WeekTask = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
      createdAt: new Date().toISOString(),
    };
    updateWeek((w) => ({ ...w, tasks: [task, ...w.tasks] }));
  }

  function toggleTask(id: string) {
    updateWeek((w) => ({
      ...w,
      tasks: w.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }

  function removeTask(id: string) {
    updateWeek((w) => ({ ...w, tasks: w.tasks.filter((t) => t.id !== id) }));
  }

  function logWorkout() {
    updateWeek((w) => ({ ...w, workouts: [...w.workouts, new Date().toISOString()] }));
  }

  function undoWorkout() {
    updateWeek((w) => ({ ...w, workouts: w.workouts.slice(0, -1) }));
  }

  function setWeeklyFocus(index: number, text: string) {
    updateWeek((w) => {
      const focus = [...w.weeklyFocus];
      focus[index] = text;
      return { ...w, weeklyFocus: focus };
    });
  }

  function setReflection(text: string) {
    updateWeek((w) => ({ ...w, reflection: text }));
  }

  function setWorkoutGoal(goal: number) {
    onChange((lw) => ({ ...lw, workoutGoal: goal }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <WeekNav
        label={formatWeekRange(weekKey)}
        isCurrent={isCurrent}
        onPrev={() => setWeekKey((k) => shiftWeekKey(k, -1))}
        onNext={() => setWeekKey((k) => shiftWeekKey(k, 1))}
      />

      <div className="flex flex-col gap-3">
        <WeekChecklist
          tasks={weekData.tasks}
          onAdd={addTask}
          onToggle={toggleTask}
          onRemove={removeTask}
        />

        <WorkoutTracker
          workouts={weekData.workouts}
          goal={lifeWeekly.workoutGoal}
          onLog={logWorkout}
          onUndo={undoWorkout}
          onSetGoal={setWorkoutGoal}
        />

        <WeeklyFocusCard goals={weekData.weeklyFocus} onChange={setWeeklyFocus} />

        <ReflectionCard value={weekData.reflection} onChange={setReflection} />

        <CurrentlyReadingCard book={currentlyReading} />
      </div>
    </div>
  );
}
