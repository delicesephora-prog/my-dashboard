import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!login|api/auth|api/cron|manifest.webmanifest|icon|apple-icon|favicon.ico|_next/static|_next/image).*)",
  ],
};

export async function middleware(req: NextRequest) {
  // If no PIN has been configured yet, don't lock the app out - this
  // keeps local development (`npm run dev`) working with zero setup.
  if (!process.env.DASHBOARD_PIN) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
