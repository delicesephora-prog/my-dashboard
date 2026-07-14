import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type OpenLibraryDoc = {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ ok: true, results: [] });
  }

  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(
      q
    )}&limit=12&fields=key,title,author_name,cover_i`;

    const res = await fetch(url, {
      headers: { "User-Agent": "my-dashboard-personal-app" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Search failed" }, { status: 502 });
    }

    const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
    const results = (data.docs ?? [])
      .filter((doc) => doc.title)
      .map((doc) => ({
        openLibraryKey: doc.key,
        title: doc.title ?? "",
        author: doc.author_name?.[0] ?? "Unknown author",
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
      }));

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: false, error: "Search failed" }, { status: 502 });
  }
}
