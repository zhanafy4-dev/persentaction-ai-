import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: u.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { images: true, renders: true, shares: true } },
      renders: { orderBy: { createdAt: "desc" }, take: 1 },
      shares: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { title?: string };
  const title = body?.title?.trim() || "Untitled project";

  const project = await prisma.project.create({
    data: { userId: u.userId, title },
  });

  return NextResponse.json({ project });
}

