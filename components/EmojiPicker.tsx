"use client";

export default function EmojiPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; emoji: string; label: string }[];
  value: T | null;
  onChange: (key: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        {label}
      </p>
      <div className="flex justify-between gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl2 py-2.5 transition ${
              value === opt.key ? "bg-life text-paper-surface" : "bg-paper-surface2 text-paper-muted"
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-[9.5px] font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
