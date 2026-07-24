"use client";

import { useState } from "react";
import { KnowledgeData, Subject, addSilasTest, silasTestsForSubject } from "@/lib/knowledge";

type GradeResult = { score: number; nailed: string[]; missed: string[]; modelAnswer: string };

export default function SilasTestPanel({
  subject,
  knowledge,
  onChange,
  onGraded,
  onOpenAsk,
}: {
  subject: Subject;
  knowledge: KnowledgeData;
  onChange: (updater: (k: KnowledgeData) => KnowledgeData) => void;
  onGraded: () => void;
  onOpenAsk: (seedText: string) => void;
}) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GradeResult | null>(null);

  const history = silasTestsForSubject(knowledge, subject.id);

  async function submit() {
    const text = response.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge/grade-silas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: { name: subject.name, pitch: subject.pitch, blocks: subject.blocks },
          response: text,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Couldn't grade that just now (${res.status}).`);

      const now = new Date();
      const result: GradeResult = { score: json.score, nailed: json.nailed, missed: json.missed, modelAnswer: json.modelAnswer };
      onChange((k) =>
        addSilasTest(k, {
          id: crypto.randomUUID(),
          subjectId: subject.id,
          date: now.toISOString().slice(0, 10),
          prompt: `30 seconds: describe ${subject.name} and what it does.`,
          response: text,
          ...result,
        })
      );
      setLastResult(result);
      setResponse("");
      onGraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 bg-work p-4 shadow-paper-lg">
        <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E6B98A]">The Silas Test</p>
        <p className="font-serif text-[14px] leading-relaxed text-paper-surface">
          30 seconds: describe {subject.name} and what it does. Type it or dictate it, exactly as you&apos;d say it out
          loud.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 px-3 py-2 text-[12px] text-paper-ink">{error}</div>
      )}

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={5}
        placeholder="Go - don't overthink it, just describe it like you would out loud…"
        className="w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5 text-[13.5px] text-paper-ink outline-none focus:border-work"
      />
      <button
        type="button"
        onClick={submit}
        disabled={loading || !response.trim()}
        className="rounded-xl2 bg-work py-3 text-center text-[14px] font-medium text-paper-surface active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? "Grading…" : "Submit"}
      </button>

      {lastResult && (
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-paper-ink">Score</p>
            <p className="font-serif text-2xl text-work">{lastResult.score}</p>
          </div>
          {lastResult.nailed.length > 0 && (
            <div className="mb-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-sage">Nailed</p>
              <ul className="flex flex-col gap-1">
                {lastResult.nailed.map((n, i) => (
                  <li key={i} className="text-[12.5px] text-paper-ink">
                    • {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lastResult.missed.length > 0 && (
            <div className="mb-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#B5574A]">Missed</p>
              <ul className="flex flex-col gap-1.5">
                {lastResult.missed.map((m, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 text-[12.5px] text-paper-ink">
                    <span>• {m}</span>
                    <button
                      type="button"
                      onClick={() => onOpenAsk(`I missed this on the Silas Test: "${m}". Can you help me understand it?`)}
                      className="shrink-0 text-[11px] font-medium text-work underline"
                    >
                      Ask about it
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 border-t border-paper-border pt-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-paper-muted">Model Answer</p>
            <p className="text-[12.5px] leading-relaxed italic text-paper-muted">{lastResult.modelAnswer}</p>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-paper-muted">Score History</p>
          <div className="flex gap-1.5 overflow-x-auto">
            {history.slice(0, 10).map((t) => (
              <div key={t.id} className="shrink-0 rounded-lg bg-paper-surface2 px-2.5 py-1.5 text-center">
                <p className="text-[13px] font-semibold text-paper-ink">{t.score}</p>
                <p className="text-[9px] text-paper-muted">{t.date.slice(5)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
