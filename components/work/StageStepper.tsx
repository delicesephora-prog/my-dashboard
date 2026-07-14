"use client";

export default function StageStepper({
  stages,
  completed,
  onToggle,
}: {
  stages: { key: string; label: string }[];
  completed: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex items-start">
      {stages.map((stage, i) => {
        const done = Boolean(completed[stage.key]);
        return (
          <div key={stage.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className="h-px flex-1"
                  style={{ backgroundColor: done || completed[stages[i - 1].key] ? "#4B5A24" : "#E7DFCF" }}
                />
              )}
              <button
                type="button"
                onClick={() => onToggle(stage.key)}
                aria-label={stage.label}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  done ? "border-transparent bg-work" : "border-paper-faint bg-paper-surface"
                }`}
              >
                {done && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-paper-surface" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              {i < stages.length - 1 && (
                <div
                  className="h-px flex-1"
                  style={{ backgroundColor: done ? "#4B5A24" : "#E7DFCF" }}
                />
              )}
            </div>
            <span className="mt-1 text-center text-[9px] leading-tight text-paper-muted">
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
