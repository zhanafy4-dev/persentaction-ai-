import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { serveStorageObject } from "@/lib/storage/serve";
import { rendersStorage } from "@/lib/storage/storage";

export async function GET(_: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await ctx.params;
  const job = await prisma.renderJob.findUnique({ where: { id: jobId }, include: { project: true } });
  if (!job || job.project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "done" || !job.outputKey) return NextResponse.json({ error: "Not ready" }, { status: 409 });

  const filename = `${job.project.title.replace(/[^a-z0-9-_]+/gi, "-")}.${job.format}`;

  return serveStorageObject(rendersStorage, job.outputKey, {
    cacheControl: "private, max-age=3600",
    contentDisposition: `attachment; filename="${filename}"`,
    attachment: true,
  });
}
