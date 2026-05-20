import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | { email?: string; password?: string };
    const email = body?.email?.toLowerCase().trim();
    const password = body?.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const token = await createSessionToken(user.id, user.email);
    const res = NextResponse.json({ ok: true, email: user.email });
    res.cookies.set(sessionCookieName(), token, sessionCookieOptions);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    // eslint-disable-next-line no-console
    console.error("[auth/login]", e);
    return NextResponse.json({ error: msg.slice(0, 500) }, { status: 500 });
  }
}
