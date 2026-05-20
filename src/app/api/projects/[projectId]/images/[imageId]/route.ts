import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { serveStorageObject } from "@/lib/storage/serve";
import { uploadsStorage } from "@/lib/storage/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ projectId: string; imageId: string }> }) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, imageId } = await ctx.params;

  const img = await prisma.projectImage.findUnique({
    where: { id: imageId },
    include: { project: true },
  });
  if (!img || img.projectId !== projectId || img.project.userId !== u.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return serveStorageObject(uploadsStorage, img.storageKey, {
    cacheControl: "private, max-age=3600",
  });
}
