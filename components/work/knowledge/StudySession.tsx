"use client";

import { useMemo, useState } from "react";
import { KnowledgeData, Subject, Flashcard, dueCardsForSubject, answerCard, markSessionDone, CARD_TYPE_LABELS } from "@/lib/knowledge";

export default function StudySession({
  subject,
  knowledge,
  onChange,
  onSessionComplete,
}: {
  subject: Subject;
  knowledge: KnowledgeData;
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  onSessionComplete: () => void;
}) {
  const now = useMemo(() => new Date(), []);
  const [queue] = useState<Flashcard[]>(() => dueCardsForSubject(knowledge.cards, subject.id, now, 8));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const card = queue[index];

  function isCorrectGuess(): boolean {
    if (!card) return false;
    if (card.type === "multiple_choice" || card.type === "true_false") return selected === card.answer;
    if (card.type === "fill_blank") {
      const guess = textAnswer.trim().toLowerCase();
      const answer = card.answer.trim().toLowerCase();
      return guess === answer || (guess.length > 2 && answer.includes(guess));
    }
    return true;
  }

  function grade(correct: boolean) {
    onChange((k) => ({ ...k, cards: answerCard(k.cards, card.id, correct, now) }));
    if (correct) setCorrectCount((c) => c + 1);
    advance();
  }

  function advance() {
    setRevealed(false);
    setSelected(null);
    setTextAnswer("");
    if (index + 1 >= queue.length) {
      onChange((k) => markSessionDone(k, now));
      setDone(true);
      onSessionComplete();
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-6 text-center shadow-paper">
        <p className="font-serif text-[1rem] italic text-paper-muted">Nothing due right now - you&apos;re caught up.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-6 text-center shadow-paper">
        <p className="font-serif text-[1.1rem] text-paper-ink">Session complete.</p>
        <p className="mt-1 text-[13px] text-paper-muted">
          {correctCount} of {queue.length} correct.
        </p>
      </div>
    );
  }

  const canCheck =
    card.type === "multiple_choice" || card.type === "true_false" ? !!selected : card.type === "fill_blank" ? !!textAnswer.trim() : true;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-paper-muted">
        Card {index + 1} of {queue.length} · {CARD_TYPE_LABELS[card.type]}
      </p>
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 font-serif text-[15px] leading-relaxed text-paper-ink">{card.prompt}</p>

        {card.type === "multiple_choice" && (
          <div className="flex flex-col gap-2">
            {card.choices.map((c) => {
              const isAnswer = c === card.answer;
              const isSelected = c === selected;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(c)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-[13.5px] transition ${
                    revealed && isAnswer
                      ? "border-sage bg-sage-soft text-[#3E4F31]"
                      : revealed && isSelected && !isAnswer
                        ? "border-[#B5574A] bg-[#B5574A]/10 text-[#8A3F35]"
                        : isSelected
                          ? "border-work bg-work-soft text-work"
                          : "border-paper-border bg-paper-surface2 text-paper-ink"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {card.type === "true_false" && (
          <div className="flex gap-2">
            {["True", "False"].map((c) => {
              const isAnswer = c === card.answer;
              const isSelected = c === selected;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(c)}
                  className={`flex-1 rounded-xl border py-2.5 text-center text-[13.5px] font-medium transition ${
                    revealed && isAnswer
                      ? "border-sage bg-sage-soft text-[#3E4F31]"
                      : revealed && isSelected && !isAnswer
                        ? "border-[#B5574A] bg-[#B5574A]/10 text-[#8A3F35]"
                        : isSelected
                          ? "border-work bg-work-soft text-work"
                          : "border-paper-border bg-paper-surface2 text-paper-ink"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {(card.type === "fill_blank" || card.type === "explain") && (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={revealed}
            rows={card.type === "explain" ? 3 : 1}
            placeholder={card.type === "fill_blank" ? "Type the term…" : "Explain it in your own words…"}
            className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13.5px] text-paper-ink outline-none focus:border-work"
          />
        )}

        {revealed && (
          <div className="mt-3 rounded-lg bg-paper-surface2 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-paper-muted">Answer</p>
            <p className="mt-0.5 text-[13px] text-paper-ink">{card.answer}</p>
          </div>
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={!canCheck}
          className="rounded-xl2 bg-work py-3 text-center text-[14px] font-medium text-paper-surface active:scale-[0.98] disabled:opacity-40"
        >
          {card.type === "explain" ? "Show Model Answer" : "Check Answer"}
        </button>
      ) : card.type === "explain" ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => grade(false)}
            className="flex-1 rounded-xl2 border border-paper-border py-3 text-[13.5px] font-medium text-paper-muted active:scale-[0.98]"
          >
            Missed it
          </button>
          <button
            type="button"
            onClick={() => grade(true)}
            className="flex-1 rounded-xl2 bg-sage py-3 text-[13.5px] font-medium text-paper-surface active:scale-[0.98]"
          >
            Nailed it
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => grade(isCorrectGuess())}
          className="rounded-xl2 bg-work py-3 text-center text-[14px] font-medium text-paper-surface active:scale-[0.98]"
        >
          Next
        </button>
      )}
    </div>
  );
}
