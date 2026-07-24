"use client";

import { KnowledgeData, unaskedQuestions, QUESTION_ANGLE_LABELS } from "@/lib/knowledge";

export default function PrepFor1on1({
  knowledge,
  onBack,
  onOpenSubject,
}: {
  knowledge: KnowledgeData;
  onBack: () => void;
  onOpenSubject: (id: string) => void;
}) {
  const all = unaskedQuestions(knowledge).slice(0, 8);

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
        <p className="font-serif text-[1.05rem] text-backdrop-ink">Prep for 1:1</p>
      </div>
      <p className="text-[12px] text-paper-muted">
        Your best unasked questions across every subject - a quick glance before a meeting.
      </p>
      <div className="flex flex-col gap-2.5">
        {all.map((q) => {
          const subject = knowledge.subjects.find((s) => s.id === q.subjectId);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => subject && onOpenSubject(subject.id)}
              className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 text-left shadow-paper active:scale-[0.98]"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-work">{subject?.name}</span>
                <span className="shrink-0 rounded-full bg-paper-surface2 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-paper-muted">
                  {QUESTION_ANGLE_LABELS[q.angle]}
                </span>
              </div>
              <p className="text-[13px] leading-snug text-paper-ink">{q.question}</p>
            </button>
          );
        })}
        {all.length === 0 && (
          <p className="py-6 text-center text-[13px] italic text-paper-muted">
            Nothing queued - open a subject to generate questions.
          </p>
        )}
      </div>
    </div>
  );
}
