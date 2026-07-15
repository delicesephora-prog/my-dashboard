"use client";

import { YearData } from "@/lib/types";
import ReflectionsSection from "./ReflectionsSection";
import YearBucketsSection from "./YearBucketsSection";
import WarRoomSection from "./WarRoomSection";
import QuarterlyGoalsSection from "../quarter/QuarterlyGoalsSection";

export default function YearView({
  year,
  paydayAnchorDate,
  onChange,
}: {
  year: YearData;
  paydayAnchorDate: string;
  onChange: (updater: (y: YearData) => YearData) => void;
}) {
  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="flex flex-col gap-3">
        <ReflectionsSection
          reflections={year.reflections}
          onChange={(reflections) => onChange((y) => ({ ...y, reflections }))}
        />

        <YearBucketsSection
          buckets={year.buckets}
          onChange={(updater) => onChange((y) => ({ ...y, buckets: updater(y.buckets) }))}
        />

        <QuarterlyGoalsSection
          title="Yearly Goals"
          goals={year.goals}
          onChange={(updater) => onChange((y) => ({ ...y, goals: updater(y.goals) }))}
        />

        <WarRoomSection
          transformations={year.transformations}
          warRoom={year.warRoom}
          paydayAnchorDate={paydayAnchorDate}
          onChangeTransformations={(updater) =>
            onChange((y) => ({ ...y, transformations: updater(y.transformations) }))
          }
          onChangeWarRoom={(updater) => onChange((y) => ({ ...y, warRoom: updater(y.warRoom) }))}
        />
      </div>
    </div>
  );
}
