"use client";

import { YearData } from "@/lib/types";
import { MilestoneData } from "@/lib/milestones";
import { CelebrationTier } from "@/lib/celebration";
import ReflectionsSection from "./ReflectionsSection";
import YearBucketsSection from "./YearBucketsSection";
import QuarterlyGoalsSection from "../quarter/QuarterlyGoalsSection";
import MilestonesSection from "./MilestonesSection";

export default function YearView({
  year,
  onChange,
  milestones,
  onChangeMilestones,
  onCelebrate,
}: {
  year: YearData;
  onChange: (updater: (y: YearData) => YearData) => void;
  milestones: MilestoneData;
  onChangeMilestones: (updater: (m: MilestoneData) => MilestoneData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
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

        <MilestonesSection milestones={milestones} onChange={onChangeMilestones} onCelebrate={onCelebrate} />
      </div>
    </div>
  );
}
