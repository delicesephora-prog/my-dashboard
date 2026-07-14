"use client";

export default function WeekNav({
  label,
  isCurrent,
  onPrev,
  onNext,
}: {
  label: string;
  isCurrent: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        aria-label="Previous week"
        onClick={onPrev}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted active:scale-90"
      >
        ‹
      </button>

      <div className="flex flex-col items-center">
        <span className="font-serif text-[1.05rem] text-paper-ink">{label}</span>
        {isCurrent && (
          <span className="text-[0.65rem] uppercase tracking-[0.14em] text-life">
            This week
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label="Next week"
        onClick={onNext}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted active:scale-90"
      >
        ›
      </button>
    </div>
  );
}
