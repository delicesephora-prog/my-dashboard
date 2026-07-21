"use client";

import { useState } from "react";
import {
  QuestionBankData,
  addQuestion,
  deleteQuestion,
  newQuestion,
  sortedQuestions,
  toggleFavorite,
} from "@/lib/questionbank";

export default function QuestionBankView({
  questionBank,
  onChange,
  onBack,
}: {
  questionBank: QuestionBankData;
  onChange: (updater: (q: QuestionBankData) => QuestionBankData) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const all = sortedQuestions(questionBank);
  const tags = Array.from(new Set(all.map((q) => q.tag).filter(Boolean))).sort();
  const shown = tagFilter ? all.filter((q) => q.tag === tagFilter) : all;

  function addNew() {
    if (!text.trim()) return;
    onChange((q) => addQuestion(q, newQuestion(text.trim(), tag.trim())));
    setText("");
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to Ops"
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> Ops
      </button>

      <div>
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Question Bank</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Good questions worth asking again, saved so you don&apos;t have to remember them cold.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A question worth reusing"
          rows={2}
          className="mb-2 w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
        />
        <div className="flex gap-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addNew();
            }}
            placeholder="Tag (e.g. Vendor Negotiation)"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
          />
          <button
            type="button"
            onClick={addNew}
            className="shrink-0 rounded-lg bg-work px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Add
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition ${
              tagFilter === null ? "bg-work text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter((f) => (f === t ? null : t))}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition ${
                tagFilter === t ? "bg-work text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No questions saved yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((q) => (
            <div key={q.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => onChange((data) => toggleFavorite(data, q.id))}
                  aria-label={q.favorite ? "Unfavorite" : "Favorite"}
                  className={`shrink-0 text-[16px] ${q.favorite ? "text-gold" : "text-paper-faint"}`}
                >
                  {q.favorite ? "★" : "☆"}
                </button>
                <p className="min-w-0 flex-1 text-[14px] leading-snug text-paper-ink">{q.text}</p>
                <button
                  type="button"
                  onClick={() => onChange((data) => deleteQuestion(data, q.id))}
                  aria-label="Delete question"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </div>
              {q.tag && (
                <span className="ml-7 mt-1.5 inline-block rounded-full bg-paper-surface2 px-2 py-0.5 text-[10px] text-paper-muted">
                  {q.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
