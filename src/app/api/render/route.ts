import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { projectId?: string; format?: "mp4" | "webm" };
  const projectId = body?.projectId ?? "";
  const format = body?.format === "webm" ? "webm" : "mp4";
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const job = await prisma.renderJob.create({
    data: { projectId, status: "queued", progress: 0, format },
  });

  return NextResponse.json({ jobId: job.id });
}

export async function GET(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const projectId = searchParams.get("projectId");

  if (jobId) {
    const job = await prisma.renderJob.findUnique({ where: { id: jobId }, include: { project: true } });
    if (!job || job.project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ job });
  }

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== u.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const jobs = await prisma.renderJob.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10 });
    return NextResponse.json({ jobs });
  }

  return NextResponse.json({ error: "Provide jobId or projectId" }, { status: 400 });
}

