"use client";

import { useState } from "react";
import {
  KnowledgeData,
  Subject,
  MasteryLevel,
  QuestionAngle,
  QUESTION_ANGLE_LABELS,
  markQuestionAsked,
  addQuestions,
  newQuestionToAsk,
  addBlockToSubject,
  newTwoLayerBlock,
  addCards,
  newFlashcard,
} from "@/lib/knowledge";

export default function QuestionsToAskPanel({
  subject,
  knowledge,
  onChange,
  mastery,
  onOpenAsk,
}: {
  subject: Subject;
  knowledge: KnowledgeData;
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  mastery: MasteryLevel;
  onOpenAsk: (seedText: string) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");

  const subjectQuestions = knowledge.questions.filter((q) => q.subjectId === subject.id);
  const unasked = subjectQuestions.filter((q) => !q.asked);
  const asked = subjectQuestions.filter((q) => q.asked).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge/refresh-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: { name: subject.name, pitch: subject.pitch, blocks: subject.blocks }, mastery }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Couldn't refresh questions just now (${res.status}).`);
      const newQs = (
        json.questions as { question: string; angle: QuestionAngle; whyGood: string; whatYoullLearn: string }[]
      ).map((q) => newQuestionToAsk(subject.id, q.question, q.angle, q.whyGood, q.whatYoullLearn));
      onChange((k) => addQuestions(k, newQs));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRefreshing(false);
    }
  }

  function logAnswer(id: string) {
    const answer = answerDraft.trim();
    if (!answer) return;
    const q = subjectQuestions.find((x) => x.id === id);
    onChange((k) => markQuestionAsked(k, id, answer));
    if (q) {
      onChange((k) => {
        const withBlock = addBlockToSubject(k, subject.id, newTwoLayerBlock(`Learned: ${q.question}`, answer, answer));
        return addCards(withBlock, [newFlashcard(subject.id, "explain", q.question, answer)]);
      });
    }
    setLoggingId(null);
    setAnswerDraft("");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] leading-relaxed text-paper-muted">
        Intelligent questions to bring to Silas or the team - the kind that show you&apos;ve been thinking. Mark one
        asked and log the answer to fold it straight into your Core Content.
      </p>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">{error}</div>
      )}

      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="self-start rounded-full border border-work px-3 py-1.5 text-[12px] font-medium text-work active:scale-95 disabled:opacity-50"
      >
        {refreshing ? "Thinking…" : "🔄 Refresh Questions"}
      </button>

      <div className="flex flex-col gap-2.5">
        {unasked.map((q) => (
          <div key={q.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
            <span className="mb-1.5 inline-block rounded-full bg-work-soft px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-work">
              {QUESTION_ANGLE_LABELS[q.angle]}
            </span>
            <p className="text-[13.5px] leading-snug text-paper-ink">{q.question}</p>
            <p className="mt-1.5 text-[11.5px] italic text-paper-muted">Why good: {q.whyGood}</p>
            <p className="mt-0.5 text-[11.5px] text-paper-muted">You&apos;ll learn: {q.whatYoullLearn}</p>

            {loggingId === q.id ? (
              <div className="mt-2.5 flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={answerDraft}
                  onChange={(e) => setAnswerDraft(e.target.value)}
                  placeholder="What did they say?"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoggingId(null);
                      setAnswerDraft("");
                    }}
                    className="flex-1 rounded-lg border border-paper-border py-1.5 text-[12px] text-paper-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => logAnswer(q.id)}
                    className="flex-1 rounded-lg bg-work py-1.5 text-[12px] font-medium text-paper-surface"
                  >
                    Save answer
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLoggingId(q.id)}
                  className="rounded-full bg-work px-3 py-1.5 text-[11.5px] font-medium text-paper-surface active:scale-95"
                >
                  ✓ Mark Asked
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAsk(q.question)}
                  className="rounded-full border border-paper-border px-3 py-1.5 text-[11.5px] text-paper-muted active:scale-95"
                >
                  Ask Deeper first
                </button>
              </div>
            )}
          </div>
        ))}
        {unasked.length === 0 && (
          <p className="py-4 text-center text-[13px] italic text-paper-muted">
            All caught up - refresh for a new batch as your mastery grows.
          </p>
        )}
      </div>

      {asked.length > 0 && (
        <div className="mt-1 flex flex-col gap-2 border-t border-paper-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-paper-muted">Already Asked</p>
          {asked.slice(0, 5).map((q) => (
            <div key={q.id} className="rounded-lg bg-paper-surface2 p-2.5">
              <p className="text-[12px] font-medium text-paper-ink">{q.question}</p>
              <p className="mt-1 text-[11.5px] text-paper-muted">{q.answerLogged}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
