import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { uploadsStorage } from "@/lib/storage/storage";

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

  const filePath = uploadsStorage.resolvePath(img.storageKey);
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) return NextResponse.json({ error: "Missing file" }, { status: 404 });

  // best-effort content-type from extension
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
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}

