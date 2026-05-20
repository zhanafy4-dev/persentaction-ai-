import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rendersStorage } from "@/lib/storage/storage";

export async function GET(_: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await ctx.params;
  const job = await prisma.renderJob.findUnique({ where: { id: jobId }, include: { project: true } });
  if (!job || job.project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "done" || !job.outputKey) return NextResponse.json({ error: "Not ready" }, { status: 409 });

  const filePath = rendersStorage.resolvePath(job.outputKey);
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) return NextResponse.json({ error: "Missing file" }, { status: 404 });

  const contentType = job.format === "webm" ? "video/webm" : "video/mp4";
  const stream = createReadStream(filePath);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "content-type": contentType,
      "content-length": String(stat.size),
      "content-disposition": `attachment; filename="${job.project.title.replace(/[^a-z0-9-_]+/gi, "-")}.${job.format}"`,
    },
  });
}

