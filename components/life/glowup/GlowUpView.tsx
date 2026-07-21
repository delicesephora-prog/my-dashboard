"use client";

import { useState } from "react";
import { GlowUpData } from "@/lib/glowup";
import { BecomingData } from "@/lib/becoming";
import DailySection from "./DailySection";
import WeeklySection from "./WeeklySection";
import MonthlySection from "./MonthlySection";
import DiySection from "./DiySection";
import BecomingSection from "./BecomingSection";

type SubView = "daily" | "weekly" | "monthly" | "diy" | "becoming";

const TABS: { key: SubView; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Sunday Reset" },
  { key: "monthly", label: "Monthly" },
  { key: "diy", label: "DIY Bank" },
  { key: "becoming", label: "Becoming" },
];

export default function GlowUpView({
  data,
  onChange,
  becoming,
  onChangeBecoming,
}: {
  data: GlowUpData;
  onChange: (updater: (g: GlowUpData) => GlowUpData) => void;
  becoming: BecomingData;
  onChangeBecoming: (updater: (b: BecomingData) => BecomingData) => void;
}) {
  const [sub, setSub] = useState<SubView>("daily");

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Glow Up
        </p>
        <p className="font-serif text-[1.05rem] text-paper-ink">Self-Care Maintenance</p>
      </div>

      <div className="scroll-quiet mb-3 flex gap-1.5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSub(tab.key)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition ${
              sub === tab.key ? "bg-glow text-paper-surface" : "border border-paper-border text-paper-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sub === "daily" && <DailySection data={data} onChange={onChange} />}
      {sub === "weekly" && <WeeklySection data={data} onChange={onChange} />}
      {sub === "monthly" && <MonthlySection data={data} onChange={onChange} />}
      {sub === "diy" && <DiySection data={data} onChange={onChange} />}
      {sub === "becoming" && <BecomingSection becoming={becoming} onChange={onChangeBecoming} />}
    </div>
  );
}
