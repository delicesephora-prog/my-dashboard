"use client";

import { useState } from "react";
import { LetterToDecemberSeph, LETTER_UNLOCK_DATE } from "@/lib/warroom";
import { dateKey } from "@/lib/date";

function formatUnlockDate(): string {
  const [y, m, d] = LETTER_UNLOCK_DATE.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function LetterToDecemberSephCard({
  letter,
  onChange,
}: {
  letter: LetterToDecemberSeph;
  onChange: (updater: (l: LetterToDecemberSeph) => LetterToDecemberSeph) => void;
}) {
  const [draft, setDraft] = useState(letter.text);
  const [confirming, setConfirming] = useState(false);

  // Sealed + no text means either it's still locked (server redacted it)
  // or it was sealed empty, which sealing prevents - so this is safely
  // "locked" in practice.
  const isLocked = letter.sealed && letter.text === "";
  const isUnlocked = letter.sealed && letter.text !== "";

  function seal() {
    if (!draft.trim()) return;
    onChange((l) => ({ ...l, text: draft, sealed: true, sealedDate: dateKey(new Date()) }));
    setConfirming(false);
  }

  if (isLocked) {
    return (
      <div className="rounded-xl2 border border-paper-border bg-paper-surface2 p-5 text-center shadow-paper">
        <p className="mb-1 text-2xl">🔒</p>
        <p className="font-serif text-[1.05rem] text-paper-ink">Letter to December Seph</p>
        <p className="mt-1 text-[12px] text-paper-muted">
          Sealed{letter.sealedDate ? ` on ${letter.sealedDate}` : ""}. Opens {formatUnlockDate()}.
        </p>
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="rounded-xl2 border border-life bg-paper-surface p-5 shadow-paper-lg">
        <p className="mb-1 text-center text-2xl">🎉</p>
        <p className="mb-3 text-center font-serif text-[1.05rem] text-paper-ink">
          A letter from your past self
        </p>
        <p className="whitespace-pre-wrap font-serif text-[0.95rem] leading-relaxed text-paper-ink">
          {letter.text}
        </p>
        <p className="mt-3 text-center text-[11px] text-paper-muted">
          Written and sealed {letter.sealedDate}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Letter to December Seph
      </p>
      <p className="mb-3 text-[12px] text-paper-muted">
        Write to yourself now. Once sealed, it can&apos;t be opened again until {formatUnlockDate()}.
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        placeholder="Dear December Seph…"
        className="mb-3 w-full resize-none rounded-xl border border-paper-border bg-paper-surface2 p-3 font-serif text-[0.95rem] leading-relaxed text-paper-ink outline-none placeholder:italic placeholder:text-paper-faint"
      />

      {confirming ? (
        <div className="rounded-xl border border-life/40 bg-life-soft p-3">
          <p className="mb-2 text-[13px] text-paper-ink">
            Seal this letter? You won&apos;t be able to open it again until {formatUnlockDate()}.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-paper-border bg-paper-surface py-2 text-[13px] text-paper-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={seal}
              className="flex-1 rounded-lg bg-life py-2 text-[13px] font-medium text-paper-surface"
            >
              Yes, seal it
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!draft.trim()}
          className="w-full rounded-xl bg-work py-2.5 text-center text-[13px] font-medium text-paper-surface disabled:opacity-40"
        >
          Seal this letter
        </button>
      )}
    </div>
  );
}
