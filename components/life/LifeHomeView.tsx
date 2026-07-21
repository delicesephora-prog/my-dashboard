"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types";
import { lifePocketTiles } from "@/lib/lifehome";

export default function LifeHomeView({
  data,
  onNavigate,
}: {
  data: DashboardData;
  onNavigate: (key: string) => void;
}) {
  // Deferred to the client, same convention as FrontPage - several of these
  // stats (days-to-go counters, "today" completion) are timezone-sensitive.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const tiles = lifePocketTiles(data, now ?? new Date());

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Life
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => onNavigate(tile.key)}
            className="flex flex-col items-start gap-2 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 text-left shadow-paper transition active:scale-[0.97]"
          >
            <span className="text-xl">{tile.icon}</span>
            <div className="min-w-0">
              <p className="font-serif text-[0.95rem] leading-tight text-paper-ink">{tile.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-paper-muted">{tile.stat}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
