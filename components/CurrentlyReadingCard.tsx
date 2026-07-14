"use client";

import { Book } from "@/lib/types";

export default function CurrentlyReadingCard({ book }: { book: Book | null }) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Currently Reading
      </p>
      {book ? (
        <div className="flex items-center gap-3">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-14 w-10 shrink-0 rounded object-cover shadow-sm"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-serif text-[1.1rem] italic text-paper-ink">{book.title}</p>
            <p className="truncate text-sm text-paper-muted">{book.author}</p>
          </div>
        </div>
      ) : (
        <p className="font-serif text-[0.95rem] italic text-paper-faint">
          Nothing set - pick one in Books.
        </p>
      )}
    </div>
  );
}
