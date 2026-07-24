"use client";

import { useState } from "react";
import { KnowledgeData, Subject, computeMastery, MASTERY_LEVELS, setCelebratedLevel } from "@/lib/knowledge";
import { CelebrationTier } from "@/lib/celebration";
import SubjectHub from "./SubjectHub";
import SubjectDetail from "./SubjectDetail";
import PrepFor1on1 from "./PrepFor1on1";
import AddSubjectPanel from "./AddSubjectPanel";

type Panel = "hub" | "subject" | "prep" | "add";

export default function KnowledgeView({
  knowledge,
  onChange,
  onCelebrate,
}: {
  knowledge: KnowledgeData;
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const [panel, setPanel] = useState<Panel>("hub");
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  const activeSubject = knowledge.subjects.find((s) => s.id === activeSubjectId) ?? null;

  function openSubject(id: string) {
    setActiveSubjectId(id);
    setPanel("subject");
  }

  // Fires the level-up celebration the moment a fresh mastery computation
  // crosses above whatever's already been celebrated for this subject -
  // checked passively after anything that could move the needle (a card
  // answer, a saved Ask Deeper answer, a graded Silas Test), so it isn't
  // tied to any one specific action.
  function checkCelebration(subject: Subject) {
    const { level } = computeMastery(subject.id, knowledge);
    const celebratedIdx = subject.celebratedLevel ? MASTERY_LEVELS.indexOf(subject.celebratedLevel) : -1;
    const currentIdx = MASTERY_LEVELS.indexOf(level);
    if (currentIdx > celebratedIdx) {
      onChange((k) => setCelebratedLevel(k, subject.id, level));
      const tier: CelebrationTier = level === "expert" ? "big" : "medium";
      const label = level.charAt(0).toUpperCase() + level.slice(1);
      const message = level === "expert" ? `Expert on ${subject.name}. You could teach this.` : `Leveled up to ${label} on ${subject.name}.`;
      onCelebrate(tier, message);
    }
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
      {panel === "hub" && (
        <SubjectHub knowledge={knowledge} onOpenSubject={openSubject} onOpenPrep={() => setPanel("prep")} onOpenAdd={() => setPanel("add")} />
      )}
      {panel === "subject" && activeSubject && (
        <SubjectDetail
          subject={activeSubject}
          knowledge={knowledge}
          onChange={onChange}
          onBack={() => setPanel("hub")}
          onMasteryChanged={() => checkCelebration(activeSubject)}
        />
      )}
      {panel === "prep" && <PrepFor1on1 knowledge={knowledge} onBack={() => setPanel("hub")} onOpenSubject={openSubject} />}
      {panel === "add" && <AddSubjectPanel onChange={onChange} onBack={() => setPanel("hub")} onCreated={(id) => openSubject(id)} />}
    </div>
  );
}
