import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { email?: string; password?: string };
  const email = body?.email?.toLowerCase().trim();
  const password = body?.password ?? "";

  if (!email || password.length < 8) {
    return NextResponse.json({ error: "Invalid email or password (min 8 chars)." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  return NextResponse.json({ id: user.id, email: user.email });
}

