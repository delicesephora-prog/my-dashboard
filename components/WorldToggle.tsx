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
      <div className="flex gap-2 rounded-xl2 bg-base-border/60 p-1.5">
        <Segment
          label="Work"
          emoji="💼"
          active={world === "work"}
          count={counts.work}
          activeClass="bg-work text-white shadow-sm"
          onClick={() => onChange("work")}
        />
        <Segment
          label="Life"
          emoji="🌿"
          active={world === "life"}
          count={counts.life}
          activeClass="bg-life text-white shadow-sm"
          onClick={() => onChange("life")}
        />
      </div>
    </div>
  );
}

function Segment({
  label,
  emoji,
  active,
  count,
  activeClass,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  count: number;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
        active ? activeClass : "text-base-muted"
      }`}
    >
      <span aria-hidden>{emoji}</span>
      <span>{label}</span>
      <span
        className={`min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-xs font-bold ${
          active ? "bg-white/25" : "bg-base-surface text-base-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
