"use client";

export default function SubNav<T extends string>({
  items,
  active,
  onChange,
  accentClass,
}: {
  items: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  accentClass: string;
}) {
  return (
    <div className="scroll-quiet -mx-5 mb-3 flex gap-1.5 overflow-x-auto px-5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            active === item.key
              ? `${accentClass} text-paper-surface`
              : "border border-paper-border bg-paper-surface text-paper-muted"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
