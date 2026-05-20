import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serveStorageObject } from "@/lib/storage/serve";
import { uploadsStorage } from "@/lib/storage/storage";

export async function GET(_: Request, ctx: { params: Promise<{ token: string; imageId: string }> }) {
  const { token, imageId } = await ctx.params;
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: true },
  });
  if (!link || !link.isPublic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const img = await prisma.projectImage.findUnique({ where: { id: imageId } });
  if (!img || img.projectId !== link.projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return serveStorageObject(uploadsStorage, img.storageKey, {
    cacheControl: "public, max-age=31536000, immutable",
  });
}
