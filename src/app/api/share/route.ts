import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { projectId?: string };
  const projectId = body?.projectId ?? "";
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = crypto.randomUUID().replace(/-/g, "");
  const link = await prisma.shareLink.create({ data: { projectId, token, isPublic: true } });
  return NextResponse.json({ token: link.token });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as null | { token?: string };
  const token = body?.token ?? "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const link = await prisma.shareLink.findUnique({ where: { token }, include: { project: true } });
  if (!link || link.project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.shareLink.delete({ where: { token } });
  return NextResponse.json({ ok: true });
}

