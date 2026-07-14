"use client";

import { YearData } from "@/lib/types";
import ReflectionsSection from "./ReflectionsSection";
import YearBucketsSection from "./YearBucketsSection";
import December8Section from "./December8Section";
import QuarterlyGoalsSection from "../quarter/QuarterlyGoalsSection";

export default function YearView({
  year,
  onChange,
}: {
  year: YearData;
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

        <December8Section
          transformations={year.transformations}
          onChange={(updater) =>
            onChange((y) => ({ ...y, transformations: updater(y.transformations) }))
          }
        />
      </div>
    </div>
  );
}
