"use client";

import { useState } from "react";
import {
  KnowledgeData,
  CardType,
  QuestionAngle,
  addSubject,
  addCards,
  addQuestions,
  newSubject,
  newTwoLayerBlock,
  newFlashcard,
  newQuestionToAsk,
} from "@/lib/knowledge";

export default function AddSubjectPanel({
  onChange,
  onBack,
  onCreated,
}: {
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  onBack: () => void;
  onCreated: (subjectId: string) => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    const trimmedName = name.trim();
    const trimmedNotes = notes.trim();
    if (!trimmedName || !trimmedNotes) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge/add-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, notes: trimmedNotes }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Couldn't generate that just now (${res.status}).`);

      const now = new Date();
      const blocks = (json.blocks as { heading: string; realWords: string; plainEnglish: string }[]).map((b) =>
        newTwoLayerBlock(b.heading, b.realWords, b.plainEnglish)
      );
      const subject = newSubject(trimmedName, json.pitch as string, blocks, now);
      const cards = (json.cards as { type: CardType; prompt: string; answer: string; choices?: string[] }[]).map((c) =>
        newFlashcard(subject.id, c.type, c.prompt, c.answer, c.choices ?? [], null, now)
      );
      const questions = (
        json.questions as { question: string; angle: QuestionAngle; whyGood: string; whatYoullLearn: string }[]
      ).map((q) => newQuestionToAsk(subject.id, q.question, q.angle, q.whyGood, q.whatYoullLearn, now));

      onChange((k) => addQuestions(addCards(addSubject(k, subject), cards), questions));
      onCreated(subject.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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
        <p className="font-serif text-[1.05rem] text-backdrop-ink">Add a Subject</p>
      </div>
      <p className="text-[12px] leading-relaxed text-paper-muted">
        Paste your own plain-English notes on a new subject (Aquapass, SmartValves, whatever&apos;s next) - the AI
        turns them into the same two-layer format and generates study cards and questions from what you give it.
      </p>
      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">{error}</div>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Subject name (e.g. Aquapass)"
        className="rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[14px] text-paper-ink outline-none focus:border-work"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={8}
        placeholder="Paste your notes here, in your own words…"
        className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[13.5px] text-paper-ink outline-none focus:border-work"
      />
      <button
        type="button"
        onClick={generate}
        disabled={loading || !name.trim() || !notes.trim()}
        className="rounded-xl2 bg-work py-3 text-center text-[14px] font-medium text-paper-surface active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? "Generating…" : "Generate Subject"}
      </button>
    </div>
  );
}
