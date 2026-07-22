"use client";

import { useEffect, useState } from "react";
import { VERSE_BANK, verseForDate } from "@/lib/welcome";

export default function VersesView() {
  // Deferred to the client so "today's verse" reflects the visitor's own
  // clock, not the server's - same pattern as Greeting/FrontPage.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const todayId = now ? verseForDate(now).id : null;

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <div>
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">Verses</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">
          {VERSE_BANK.length} verses, one shown on the welcome screen each day.
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {VERSE_BANK.map((v) => {
          const isToday = v.id === todayId;
          return (
            <li
              key={v.id}
              className={`rounded-xl2 border p-4 shadow-paper ${
                isToday ? "border-gold bg-gold-soft/40" : "border-paper-border bg-paper-surface"
              }`}
            >
              {isToday && (
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Today
                </p>
              )}
              <p className="font-serif text-[1rem] italic leading-snug text-paper-ink">
                &ldquo;{v.verse}&rdquo;
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
                {v.reference}
              </p>
              <p className="mt-2 border-t border-paper-border pt-2 text-[12.5px] leading-relaxed text-paper-muted">
                {v.encouragement}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
