"use client";

import { useEffect, useRef } from "react";
import { StudyOverview } from "@/lib/types";

const FIELDS: { key: keyof StudyOverview; label: string; placeholder: string }[] = [
  { key: "protocolSummary", label: "Protocol Summary", placeholder: "Brief summary of the protocol…" },
  { key: "primaryEndpoint", label: "Primary Endpoint", placeholder: "What are we measuring…" },
  { key: "enrollmentStatus", label: "Enrollment Status", placeholder: "Where enrollment stands…" },
  { key: "importantDates", label: "Important Dates", placeholder: "Key milestones and deadlines…" },
];

export default function StudyOverviewCard({
  overview,
  onChange,
}: {
  overview: StudyOverview;
  onChange: (next: StudyOverview) => void;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Study Overview
      </p>
      <div className="flex flex-col gap-3">
        {FIELDS.map((field) => (
          <AutoField
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={overview[field.key]}
            onChange={(text) => onChange({ ...overview, [field.key]: text })}
          />
        ))}
      </div>
    </div>
  );
}

function AutoField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  return (
    <div>
      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
        {label}
      </p>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none overflow-hidden rounded-lg border border-paper-border bg-paper-surface2 p-2.5 text-[14px] leading-relaxed text-paper-ink outline-none placeholder:text-paper-faint"
      />
    </div>
  );
}
