"use client";

type World = "work" | "life";

export default function WorldToggle({
  world,
  onChange,
  counts,
}: {
  world: World;
  onChange: (w: World) => void;
  counts: { work: number; life: number };
}) {
  return (
    <div className="px-5">
      <div className="flex gap-6 border-b border-paper-border">
        <Tab
          label="Work"
          active={world === "work"}
          count={counts.work}
          underline="border-work"
          onClick={() => onChange("work")}
        />
        <Tab
          label="Life"
          active={world === "life"}
          count={counts.life}
          underline="border-life"
          onClick={() => onChange("life")}
        />
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  count,
  underline,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  underline: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px flex items-baseline gap-1.5 border-b-2 py-2.5 transition-colors ${
        active ? underline : "border-transparent"
      }`}
    >
      <span
        className={`font-serif text-[1.05rem] ${
          active ? "text-paper-ink" : "text-paper-muted"
        }`}
      >
        {label}
      </span>
      <span className="text-xs text-paper-faint">{count}</span>
    </button>
  );
}
