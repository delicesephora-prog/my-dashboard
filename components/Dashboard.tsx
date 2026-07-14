"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardData, TaskItem, WorldData } from "@/lib/types";
import { todayKey } from "@/lib/date";
import Greeting from "./Greeting";
import OneThing from "./OneThing";
import WorldToggle from "./WorldToggle";
import FocusStrip from "./FocusStrip";
import QuickAdd from "./QuickAdd";
import TaskList from "./TaskList";
import NotesSheet from "./NotesSheet";
import SaveIndicator, { SaveStatus } from "./SaveIndicator";

type World = "work" | "life";

const LOCAL_KEY = "dashboard-cache-v1";
const SAVE_DELAY_MS = 700;

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [world, setWorld] = useState<World>("work");
  const [notesOpen, setNotesOpen] = useState(false);
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

  function updateWorld(w: World, updater: (world: WorldData) => WorldData) {
    setData((prev) => ({ ...prev, [w]: updater(prev[w]) }));
    scheduleSave();
  }

  function addTask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const task: TaskItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
      focus: false,
      createdAt: new Date().toISOString(),
    };
    updateWorld(world, (w) => ({ ...w, tasks: [task, ...w.tasks] }));
  }

  function toggleDone(id: string) {
    updateWorld(world, (w) => ({
      ...w,
      tasks: w.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }

  function toggleFocus(id: string) {
    updateWorld(world, (w) => {
      const focusCount = w.tasks.filter((t) => t.focus).length;
      return {
        ...w,
        tasks: w.tasks.map((t) => {
          if (t.id !== id) return t;
          if (!t.focus && focusCount >= 3) return t;
          return { ...t, focus: !t.focus };
        }),
      };
    });
  }

  function removeTask(id: string) {
    updateWorld(world, (w) => ({ ...w, tasks: w.tasks.filter((t) => t.id !== id) }));
  }

  function setNotes(text: string) {
    updateWorld(world, (w) => ({ ...w, notes: text }));
  }

  function setOneThing(text: string) {
    setData((prev) => ({ ...prev, oneThing: { text, date: todayKey() } }));
    scheduleSave();
  }

  const current = data[world];
  const oneThingText = data.oneThing.date === todayKey() ? data.oneThing.text : "";
  const counts = {
    work: data.work.tasks.filter((t) => !t.done).length,
    life: data.life.tasks.filter((t) => !t.done).length,
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
        <FocusStrip world={world} tasks={current.tasks} onToggleDone={toggleDone} />
        <QuickAdd world={world} onAdd={addTask} />
        <TaskList
          world={world}
          tasks={current.tasks}
          onToggleDone={toggleDone}
          onToggleFocus={toggleFocus}
          onRemove={removeTask}
        />
      </main>

      <button
        onClick={() => setNotesOpen(true)}
        className="safe-bottom mx-5 mb-3 mt-2 rounded-xl2 border border-paper-border bg-paper-surface px-4 py-3 text-left text-sm text-paper-muted shadow-paper"
      >
        {world === "work" ? "Work" : "Life"} notes
        {current.notes ? " · has notes" : ""}
      </button>

      {notesOpen && (
        <NotesSheet
          world={world}
          value={current.notes}
          onChange={setNotes}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </div>
  );
}
