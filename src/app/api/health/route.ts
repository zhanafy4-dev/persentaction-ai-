import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    database_url: process.env.DATABASE_URL ? "set" : "missing",
    nextauth_secret: process.env.NEXTAUTH_SECRET ? "set" : "missing",
    nextauth_url: process.env.NEXTAUTH_URL ? "set" : "missing",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (e) {
    checks.database = e instanceof Error ? e.message.slice(0, 200) : "error";
    return NextResponse.json({ ok: false, checks }, { status: 503 });
  }

  const ok =
    checks.database === "ok" &&
    checks.database_url === "set" &&
    checks.nextauth_secret === "set" &&
    checks.nextauth_url === "set";

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
