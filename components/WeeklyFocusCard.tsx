"use client";

export default function WeeklyFocusCard({
  goals,
  onChange,
}: {
  goals: string[];
  onChange: (index: number, text: string) => void;
}) {
  return (
    <div className="rounded-xl2 border-l-4 border-life bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Weekly Focus
      </p>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="font-serif text-sm text-paper-faint">0{i + 1}</span>
            <input
              value={goals[i] ?? ""}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={i < 2 ? "Add a goal…" : "Add a goal (optional)…"}
              className="flex-1 border-b border-paper-border bg-transparent py-1 text-[15px] text-paper-ink outline-none focus:border-life"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
