"use client";

import { useState } from "react";
import { Book, BooksData, FinishedBook } from "@/lib/types";
import { todayKey } from "@/lib/date";
import { quarterKeyFor, formatQuarterLabel } from "@/lib/quarter";

type SearchResult = {
  openLibraryKey: string;
  title: string;
  author: string;
  coverUrl: string;
};

function quarterSortValue(key: string): number {
  const [y, q] = key.split("-Q").map(Number);
  return y * 4 + q;
}

export default function BooksView({
  books,
  onChange,
}: {
  books: BooksData;
  onChange: (updater: (b: BooksData) => BooksData) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("failed");
      setResults(data.results);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function setCurrentlyReading(result: SearchResult) {
    const book: Book = {
      id: crypto.randomUUID(),
      openLibraryKey: result.openLibraryKey,
      title: result.title,
      author: result.author,
      coverUrl: result.coverUrl,
    };
    onChange((b) => ({ ...b, currentlyReading: book }));
  }

  function markFinished() {
    onChange((b) => {
      if (!b.currentlyReading) return b;
      const finished: FinishedBook = {
        ...b.currentlyReading,
        finishedDate: todayKey(),
        quarterKey: quarterKeyFor(new Date()),
      };
      return { currentlyReading: null, read: [finished, ...b.read] };
    });
  }

  function removeFinished(id: string) {
    onChange((b) => ({ ...b, read: b.read.filter((x) => x.id !== id) }));
  }

  const quarterGroups = Array.from(new Set(books.read.map((b) => b.quarterKey))).sort(
    (a, c) => quarterSortValue(c) - quarterSortValue(a)
  );

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="flex flex-col gap-3">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Currently Reading
          </p>
          {books.currentlyReading ? (
            <div className="flex items-center gap-3">
              <BookCover url={books.currentlyReading.coverUrl} title={books.currentlyReading.title} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[1.05rem] italic text-paper-ink">
                  {books.currentlyReading.title}
                </p>
                <p className="truncate text-[12px] text-paper-muted">{books.currentlyReading.author}</p>
                <button
                  type="button"
                  onClick={markFinished}
                  className="mt-1.5 rounded-full bg-life px-3 py-1 text-[11px] font-medium text-paper-surface"
                >
                  Mark as Finished
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[0.9rem] font-serif italic text-paper-muted">
              Nothing set - search below and pick one.
            </p>
          )}
        </div>

        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Find a Book
          </p>
          <div className="mb-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder="Search by title…"
              className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none focus:border-life"
            />
            <button
              type="button"
              onClick={runSearch}
              className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
            >
              Search
            </button>
          </div>

          {loading && (
            <p className="py-2 text-center text-xs italic text-paper-muted">Searching…</p>
          )}
          {error && (
            <p className="py-2 text-center text-xs italic text-paper-muted">
              Couldn&apos;t reach the book search right now. Try again in a moment.
            </p>
          )}
          {!loading && !error && searched && results.length === 0 && (
            <p className="py-2 text-center text-xs italic text-paper-muted">No results.</p>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <div key={r.openLibraryKey} className="flex items-center gap-3">
                  <BookCover url={r.coverUrl} title={r.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-paper-ink">{r.title}</p>
                    <p className="truncate text-[11px] text-paper-muted">{r.author}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentlyReading(r)}
                    className="shrink-0 rounded-full border border-life px-2.5 py-1 text-[11px] font-medium text-life"
                  >
                    Set Reading
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Books Read
          </p>
          {quarterGroups.length === 0 ? (
            <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">
              Finish a book and it&apos;ll show up here.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {quarterGroups.map((qKey) => (
                <div key={qKey}>
                  <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
                    {formatQuarterLabel(qKey)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {books.read
                      .filter((b) => b.quarterKey === qKey)
                      .sort((a, b) => b.finishedDate.localeCompare(a.finishedDate))
                      .map((book) => (
                        <div key={book.id} className="flex items-center gap-3">
                          <BookCover url={book.coverUrl} title={book.title} small />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] text-paper-ink">{book.title}</p>
                            <p className="truncate text-[11px] text-paper-muted">{book.author}</p>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove from books read"
                            onClick={() => removeFinished(book.id)}
                            className="shrink-0 text-paper-faint"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookCover({ url, title, small }: { url: string; title: string; small?: boolean }) {
  const dims = small ? "h-10 w-7" : "h-16 w-11";
  if (!url) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded bg-paper-surface2 text-paper-faint ${dims}`}
      >
        <span className="text-[9px]">No cover</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={title} className={`shrink-0 rounded object-cover shadow-sm ${dims}`} />;
}
