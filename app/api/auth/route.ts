import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  const expectedPin = process.env.DASHBOARD_PIN;

  if (!expectedPin) {
    return NextResponse.json({ ok: true });
  }

  if (!pin || pin !== expectedPin) {
    return NextResponse.json({ ok: false, error: "Wrong PIN" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
