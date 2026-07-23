"use client";

import { useEffect, useRef, useState } from "react";
import { FocusData, addSession, completeSession, newFocusSession, totalFocusMinutesToday } from "@/lib/focus";
import { burstConfettiFrom } from "@/lib/confetti";
import { playPopSound } from "@/lib/pop-sound";
import { startAmbient, stopAmbient } from "@/lib/sound";
import { getAmbianceSettings } from "@/lib/ambiance";
import ProgressRing from "./ProgressRing";

const DURATIONS = [15, 25, 45, 60];

type Stage = "setup" | "active" | "complete";

export default function FocusModeView({
  oneThingText,
  focus,
  onChange,
  onClose,
}: {
  oneThingText: string;
  focus: FocusData;
  onChange: (updater: (f: FocusData) => FocusData) => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("setup");
  const [taskText, setTaskText] = useState(oneThingText);
  const [minutes, setMinutes] = useState(25);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const completedMinutesRef = useRef(minutes);

  useEffect(() => {
    if (stage !== "active" || endTime === null) return;
    const tick = () => {
      const remaining = endTime - Date.now();
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0 && sessionId) {
        onChange((f) => completeSession(f, sessionId, new Date()));
        setStage("complete");
        if (ringRef.current) burstConfettiFrom(ringRef.current);
        playPopSound();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, endTime, sessionId]);

  useEffect(() => {
    const settings = getAmbianceSettings();
    if (stage === "active" && settings.focusSoundEnabled) {
      startAmbient(settings.focusTrack);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [stage]);

  function begin() {
    const now = new Date();
    const session = newFocusSession(taskText.trim() || "Focused work", minutes, now);
    completedMinutesRef.current = minutes;
    onChange((f) => addSession(f, session));
    setSessionId(session.id);
    setEndTime(now.getTime() + minutes * 60000);
    setRemainingMs(minutes * 60000);
    setStage("active");
  }

  const totalMs = completedMinutesRef.current * 60000;
  const pct = totalMs > 0 ? Math.round(((totalMs - remainingMs) / totalMs) * 100) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-bg">
      <div className="safe-top flex items-center justify-between px-5 pt-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold">Focus Mode</p>
        {stage !== "active" && (
          <button type="button" onClick={onClose} aria-label="Close" className="text-lg text-paper-muted">
            ×
          </button>
        )}
      </div>

      {stage === "setup" && (
        <div className="flex flex-1 flex-col justify-center gap-5 px-7">
          <div>
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              What are you focusing on?
            </p>
            <textarea
              autoFocus
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="One thing, undivided attention"
              rows={2}
              className="w-full resize-none rounded-xl2 border border-paper-border bg-paper-surface px-4 py-3 font-serif text-[1.05rem] text-paper-ink outline-none focus:border-work"
            />
          </div>

          <div>
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              For how long?
            </p>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMinutes(d)}
                  className={`flex-1 rounded-xl2 border py-3 text-center text-[14px] font-medium transition ${
                    minutes === d
                      ? "border-work bg-work text-paper-surface"
                      : "border-paper-border bg-paper-surface text-paper-muted"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={begin}
            className="mt-2 rounded-xl2 bg-work py-4 text-center text-[15px] font-medium text-paper-surface shadow-paper-lg active:scale-[0.98]"
          >
            Begin
          </button>
        </div>
      )}

      {stage === "active" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-7">
          <div ref={ringRef} className="relative">
            <ProgressRing pct={pct} size={220} strokeWidth={10} color="#5B2333" label="" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-[2.6rem] leading-none text-paper-ink">
                {mm}:{ss}
              </span>
            </div>
          </div>
          <p className="max-w-[260px] text-center font-serif text-[1.1rem] italic text-paper-ink">
            {taskText.trim() || "Focused work"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-paper-faint underline decoration-paper-faint underline-offset-2"
          >
            End early
          </button>
        </div>
      )}

      {stage === "complete" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
          <p className="font-serif text-[1.4rem] text-paper-ink">Nice work.</p>
          <p className="text-[13.5px] text-paper-muted">
            {completedMinutesRef.current} focused minutes on &ldquo;{taskText.trim() || "Focused work"}&rdquo;.
          </p>
          <p className="text-[11.5px] text-paper-faint">
            {totalFocusMinutesToday(focus, new Date())} minutes total today.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 rounded-xl2 bg-work px-8 py-3 text-[14px] font-medium text-paper-surface active:scale-95"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
