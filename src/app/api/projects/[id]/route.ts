import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

async function assertOwner(projectId: string, userId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p || p.userId !== userId) return null;
  return p;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } }, renders: { orderBy: { createdAt: "desc" } }, shares: true },
  });
  if (!project || project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await assertOwner(id, u.userId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as
    | null
    | {
        title?: string;
        images?: Array<{ id: string; order?: number; description?: string }>;
      };

  const title = body?.title?.trim();
  const images = body?.images ?? [];

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.project.update({
      where: { id },
      data: title ? { title } : {},
    });
    for (const img of images) {
      await tx.projectImage.update({
        where: { id: img.id },
        data: {
          ...(typeof img.order === "number" ? { order: img.order } : {}),
          ...(typeof img.description === "string" ? { description: img.description } : {}),
        },
      });
    }
    return p;
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await assertOwner(id, u.userId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  // Local file cleanup is handled by a later storage cleanup step (MVP: best-effort).
  return NextResponse.json({ ok: true });
}

