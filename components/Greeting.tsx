"use client";

import { useEffect, useState } from "react";
import { greetingForHour, formatElegantDate } from "@/lib/date";
import { DAY_TYPE_LABELS, dayTypeForDate } from "@/lib/routines";

const NAME = "Sephora";
const NBSP = "\u00A0";

export default function Greeting() {
  // Computed after mount (not on the server) so the greeting and date
  // reflect the visitor's own clock and time zone, not the server's.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return (
    <div className="min-w-0">
      <h1 className="truncate font-serif text-[1.35rem] font-medium leading-tight text-paper-ink">
        {now ? (
          <>
            {greetingForHour(now.getHours())}, <span className="text-work">{NAME}</span>
          </>
        ) : (
          NBSP
        )}
      </h1>
      <div className="mt-0.5 flex items-center gap-2">
        <p className="font-serif text-[0.85rem] italic text-paper-muted">
          {now ? formatElegantDate(now) : NBSP}
        </p>
        {now && (
          <span className="shrink-0 rounded-full border border-paper-border bg-paper-surface2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-paper-muted">
            {DAY_TYPE_LABELS[dayTypeForDate(now)]}
          </span>
        )}
      </div>
    </div>
  );
}
