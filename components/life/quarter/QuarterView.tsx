"use client";

import { useState } from "react";
import { LifeQuarterly, LifeWeekly, MoneyData, QuarterData, quarterDataFor } from "@/lib/types";
import { quarterKeyFor, shiftQuarterKey, formatQuarterLabel } from "@/lib/quarter";
import WeekNav from "../../WeekNav";
import MoneySection from "./MoneySection";
import QuarterlyGoalsSection from "./QuarterlyGoalsSection";
import AchievementsSection from "./AchievementsSection";
import ParkingLotSection from "./ParkingLotSection";
import WorkoutConsistencyChart from "./WorkoutConsistencyChart";

export default function QuarterView({
  lifeQuarterly,
  lifeWeekly,
  onChange,
}: {
  lifeQuarterly: LifeQuarterly;
  lifeWeekly: LifeWeekly;
  onChange: (updater: (lq: LifeQuarterly) => LifeQuarterly) => void;
}) {
  const [quarterKey, setQuarterKey] = useState(() => quarterKeyFor(new Date()));
  const quarterData = quarterDataFor(lifeQuarterly, quarterKey);
  const isCurrent = quarterKey === quarterKeyFor(new Date());

  function updateQuarterData(updater: (q: QuarterData) => QuarterData) {
    onChange((lq) => ({
      ...lq,
      quarters: { ...lq.quarters, [quarterKey]: updater(quarterDataFor(lq, quarterKey)) },
    }));
  }

  function updateMoney(updater: (m: MoneyData) => MoneyData) {
    onChange((lq) => ({ ...lq, money: updater(lq.money) }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <WeekNav
        label={formatQuarterLabel(quarterKey)}
        isCurrent={isCurrent}
        unit="quarter"
        currentLabel="This quarter"
        onPrev={() => setQuarterKey((k) => shiftQuarterKey(k, -1))}
        onNext={() => setQuarterKey((k) => shiftQuarterKey(k, 1))}
      />

      <div className="flex flex-col gap-3">
        <MoneySection money={lifeQuarterly.money} onChange={updateMoney} />

        <QuarterlyGoalsSection
          goals={quarterData.goals}
          onChange={(updater) => updateQuarterData((q) => ({ ...q, goals: updater(q.goals) }))}
        />

        <AchievementsSection
          achievements={quarterData.achievements}
          onChange={(updater) =>
            updateQuarterData((q) => ({ ...q, achievements: updater(q.achievements) }))
          }
        />

        <ParkingLotSection
          items={quarterData.parkingLot}
          onChange={(updater) =>
            updateQuarterData((q) => ({ ...q, parkingLot: updater(q.parkingLot) }))
          }
        />

        <WorkoutConsistencyChart lifeWeekly={lifeWeekly} />
      </div>
    </div>
  );
}
