import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await requireUser();
  if (!u) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: u.userId, email: u.email } });
}
