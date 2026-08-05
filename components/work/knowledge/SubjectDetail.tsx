"use client";

import { useState } from "react";
import { KnowledgeData, Subject, computeMastery, dueCardsForSubject } from "@/lib/knowledge";
import MasteryBadge from "./MasteryBadge";
import StudySession from "./StudySession";
import AskDeeperPanel from "./AskDeeperPanel";
import QuestionsToAskPanel from "./QuestionsToAskPanel";
import SilasTestPanel from "./SilasTestPanel";

type SubTab = "content" | "study" | "ask" | "questions" | "silas";

export default function SubjectDetail({
  subject,
  knowledge,
  onChange,
  onBack,
  onMasteryChanged,
}: {
  subject: Subject;
  knowledge: KnowledgeData;
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  onBack: () => void;
  onMasteryChanged: () => void;
}) {
  const [tab, setTab] = useState<SubTab>("content");
  const [askSeed, setAskSeed] = useState<string | null>(null);
  const mastery = computeMastery(subject.id, knowledge);
  const dueCount = dueCardsForSubject(knowledge.cards, subject.id, new Date(), 100).length;

  function openAsk(seedText: string) {
    setAskSeed(seedText);
    setTab("ask");
  }

  const tabs: { key: SubTab; label: string }[] = [
    { key: "content", label: "Core Content" },
    { key: "study", label: dueCount > 0 ? `Study (${dueCount})` : "Study" },
    { key: "ask", label: "Ask Deeper" },
    { key: "questions", label: "Questions to Ask" },
    { key: "silas", label: "The Silas Test" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted"
          aria-label="Back to subjects"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[1.05rem] text-backdrop-ink">{subject.name}</p>
        </div>
        <MasteryBadge level={mastery.level} score={mastery.score} />
      </div>

      <div className="scroll-quiet flex gap-1.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition ${
              tab === t.key ? "bg-work text-paper-surface" : "border border-paper-border text-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "content" && <CoreContentTab subject={subject} />}
      {tab === "study" && <StudySession subject={subject} knowledge={knowledge} onChange={onChange} onSessionComplete={onMasteryChanged} />}
      {tab === "ask" && (
        <AskDeeperPanel
          subject={subject}
          knowledge={knowledge}
          onChange={onChange}
          onSaved={onMasteryChanged}
          seedText={askSeed}
          onSeedConsumed={() => setAskSeed(null)}
        />
      )}
      {tab === "questions" && (
        <QuestionsToAskPanel subject={subject} knowledge={knowledge} onChange={onChange} mastery={mastery.level} onOpenAsk={openAsk} />
      )}
      {tab === "silas" && (
        <SilasTestPanel subject={subject} knowledge={knowledge} onChange={onChange} onGraded={onMasteryChanged} onOpenAsk={openAsk} />
      )}
    </div>
  );
}

function CoreContentTab({ subject }: { subject: Subject }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 bg-work p-4 shadow-paper-lg">
        <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E6B98A]">The Pitch (memorize this)</p>
        <p className="font-serif text-[14.5px] leading-relaxed text-paper-surface">{subject.pitch}</p>
      </div>

      {subject.blocks.map((b) => (
        <div key={b.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-2.5 text-[12.5px] font-semibold text-paper-ink">{b.heading}</p>
          <div className="flex flex-col gap-2.5">
            <div className="rounded-xl border-l-[3px] border-work bg-work-soft/40 p-3">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-work">The Real Words</p>
              <p className="text-[13px] leading-relaxed text-paper-ink">{b.realWords}</p>
            </div>
            <div className="rounded-xl border-l-[3px] border-sage bg-sage-soft/40 p-3">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-sage">In Plain English</p>
              <p className="text-[13px] leading-relaxed text-paper-ink">{b.plainEnglish}</p>
            </div>
            {(b.citations?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-1 border-t border-paper-border pt-2">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-paper-muted">Sources</p>
                {b.citations!.map((c, i) => (
                  <a
                    key={i}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11.5px] leading-snug text-work underline decoration-work/40 underline-offset-2"
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
