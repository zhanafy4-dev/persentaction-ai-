import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { prisma } from "@/lib/db";
import { uploadsStorage } from "@/lib/storage/storage";

export async function GET(_: Request, ctx: { params: Promise<{ token: string; imageId: string }> }) {
  const { token, imageId } = await ctx.params;
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: true },
  });
  if (!link || !link.isPublic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Expired" }, { status: 404 });
  }

  const img = await prisma.projectImage.findUnique({ where: { id: imageId } });
  if (!img || img.projectId !== link.projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = uploadsStorage.resolvePath(img.storageKey);
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) return NextResponse.json({ error: "Missing file" }, { status: 404 });

  const ct = img.storageKey.endsWith(".png")
    ? "image/png"
    : img.storageKey.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  const stream = createReadStream(filePath);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "content-type": ct,
      "content-length": String(stat.size),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

