"use client";

type World = "front" | "work" | "planner" | "life" | "assistant";

export default function WorldToggle({
  world,
  onChange,
  counts,
  assistantName,
}: {
  world: World;
  onChange: (w: World) => void;
  counts: { work: number; life: number };
  assistantName: string;
}) {
  return (
    <div className="px-5">
      <div className="scroll-quiet flex gap-6 overflow-x-auto border-b border-paper-border">
        <Tab
          label="Front Page"
          active={world === "front"}
          underline="border-work"
          onClick={() => onChange("front")}
        />
        <Tab
          label="Planner"
          active={world === "planner"}
          underline="border-gold"
          onClick={() => onChange("planner")}
        />
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
        <Tab
          label={assistantName}
          active={world === "assistant"}
          underline="border-life"
          onClick={() => onChange("assistant")}
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
  count?: number;
  underline: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px flex shrink-0 items-baseline gap-1.5 border-b-2 py-2.5 transition-colors ${
        active ? underline : "border-transparent"
      }`}
    >
      <span
        className={`font-serif text-[1.05rem] ${
          active ? "text-backdrop-ink" : "text-backdrop-muted"
        }`}
      >
        {label}
      </span>
      {count !== undefined && <span className="text-xs text-backdrop-faint">{count}</span>}
    </button>
  );
}
