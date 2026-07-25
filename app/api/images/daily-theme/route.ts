import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type UnsplashPhoto = {
  urls?: { regular?: string; small?: string };
  user?: { name?: string; links?: { html?: string } };
  links?: { html?: string; download_location?: string };
};

export async function GET(req: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { ok: false, error: "Daily Theme photos aren't set up yet - UNSPLASH_ACCESS_KEY is missing from the environment." },
      { status: 503 }
    );
  }

  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });
  }

  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
      query
    )}&orientation=portrait&content_filter=high`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Photo search failed (${res.status}): ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const photo = (await res.json()) as UnsplashPhoto;
    if (!photo.urls?.regular) {
      return NextResponse.json({ ok: false, error: "No photo found for that search" }, { status: 502 });
    }

    // Unsplash's API guidelines require registering a download event for
    // any photo actually used (not just previewed) in an app - fired here,
    // once, the moment a photo is chosen as the day's hero image, not on
    // every screen open. Best-effort: never block or fail the response on it.
    if (photo.links?.download_location) {
      fetch(`${photo.links.download_location}&client_id=${accessKey}`).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      url: photo.urls.regular,
      thumbUrl: photo.urls.small ?? photo.urls.regular,
      photographer: photo.user?.name ?? "Unsplash",
      photographerUrl: photo.user?.links?.html
        ? `${photo.user.links.html}?utm_source=my-dashboard&utm_medium=referral`
        : "https://unsplash.com",
      sourceUrl: photo.links?.html
        ? `${photo.links.html}?utm_source=my-dashboard&utm_medium=referral`
        : "https://unsplash.com",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Photo search failed" },
      { status: 500 }
    );
  }
}
