"use client";

type World = "work" | "life";

export default function NotesSheet({
  world,
  value,
  onChange,
  onClose,
}: {
  world: World;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
}) {
  const accent = world === "work" ? "focus:border-work" : "focus:border-life";

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-paper-ink/25 animate-fade-in">
      <div className="safe-bottom flex max-h-[80dvh] w-full flex-col rounded-t-xl3 bg-paper-surface p-5 shadow-paper-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium text-paper-ink">
            {world === "work" ? "Work" : "Life"} notes
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-paper-surface2 px-3 py-1.5 text-sm font-medium text-paper-muted"
          >
            Done
          </button>
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Brain dump anything here - it saves automatically…"
          className={`min-h-[40vh] flex-1 resize-none rounded-xl2 border border-paper-border bg-paper-surface2 p-4 text-[15px] text-paper-ink outline-none transition-colors ${accent}`}
        />
      </div>
    </div>
  );
}
