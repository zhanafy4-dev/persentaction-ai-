import { NextResponse } from "next/server";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const clear = { ...sessionCookieOptions, maxAge: 0 };
  res.cookies.set(sessionCookieName(), "", clear);
  res.cookies.set("next-auth.session-token", "", { ...clear, secure: false });
  res.cookies.set("__Secure-next-auth.session-token", "", clear);
  return res;
}
