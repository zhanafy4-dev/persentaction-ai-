import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | { email?: string; password?: string };
    const email = body?.email?.toLowerCase().trim();
    const password = body?.password ?? "";

    if (!email || password.length < 8) {
      return NextResponse.json({ error: "Invalid email or password (min 8 chars)." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signup failed";
    // eslint-disable-next-line no-console
    console.error("[signup]", e);
    const isDb =
      /connect|timeout|ECONNREFUSED|ENOTFOUND|SSL|password authentication/i.test(msg) ||
      msg.includes("DATABASE_URL");
    return NextResponse.json(
      {
        error: isDb
          ? "Database connection failed. Check DATABASE_URL on Railway (Postgres + sslmode=require)."
          : msg.slice(0, 500),
      },
      { status: 503 },
    );
  }
}
