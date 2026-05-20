import "dotenv/config";
import { prisma } from "@/lib/db";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { contentTypeFromKey } from "@/lib/storage/contentType";
import { rendersStorage, uploadsStorage } from "@/lib/storage/storage";

type JobWithProject = Awaited<ReturnType<typeof prisma.renderJob.findFirst>> & {
  project: { id: string; userId: string; title: string };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeDrawtext(text: string) {
  // FFmpeg drawtext escaping: escape backslash, colon, apostrophe, percent.
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

async function claimJob(): Promise<JobWithProject | null> {
  return prisma.$transaction(async (tx) => {
    const job = await tx.renderJob.findFirst({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
      include: { project: true },
    });
    if (!job) return null;
    await tx.renderJob.update({
      where: { id: job.id },
      data: { status: "running", progress: 0, errorMessage: null },
    });
    return job as unknown as JobWithProject;
  });
}

async function buildFfmpegArgs(job: JobWithProject) {
  const images = await prisma.projectImage.findMany({
    where: { projectId: job.projectId },
    orderBy: { order: "asc" },
  });
  if (images.length === 0) throw new Error("No images to render.");

  const fps = 30;
  const w = 1920;
  const h = 1080;
  const cross = 1.05;
  const hold = 3.36; // should match UI defaults approximately
  const seg = hold + cross;
  const total = images.length * seg + 0.8;

  const args: string[] = ["-y"];
  for (const img of images) {
    const p = await uploadsStorage.materializeLocal(img.storageKey);
    args.push("-loop", "1", "-t", String(seg), "-i", p);
  }

  // Filter: create per-image zoompan stream, add drawtext overlay, then xfade chain.
  const filters: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const side = i % 2 === 0 ? "R" : "L";
    const desc = escapeDrawtext(images[i]!.description || "");
    const x = side === "R" ? "(w*0.58)" : "(w*0.08)";
    const y = "(h*0.74)";

    // zoompan: mild zoom-in
    // Use scale to target size then zoompan to avoid aspect mismatch issues.
    filters.push(
      `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},` +
        `zoompan=z='min(1.08,1.0+0.0008*n)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(
          seg * fps,
        )}:fps=${fps},format=yuv420p` +
        (desc
          ? `,drawtext=text='${desc}':x=${x}:y=${y}:fontsize=42:fontcolor=white@0.90:box=1:boxcolor=black@0.35:boxborderw=18`
          : "") +
        `[v${i}]`,
    );
  }

  // xfade chain
  let chain = "[v0]";
  for (let i = 1; i < images.length; i++) {
    const offset = i * seg - cross; // when to start the crossfade
    filters.push(`${chain}[v${i}]xfade=transition=fade:duration=${cross}:offset=${offset}[x${i}]`);
    chain = `[x${i}]`;
  }

  const filterComplex = [...filters].join(";");
  args.push("-filter_complex", filterComplex);
  args.push("-map", chain);

  // progress for parsing
  args.push("-progress", "pipe:1", "-nostats");

  const outId = crypto.randomUUID();
  const ext = job.format === "webm" ? "webm" : "mp4";
  const outKey = path.join(job.project.userId, job.project.id, `${outId}.${ext}`).replace(/\\/g, "/");
  const tmpDir = path.join(os.tmpdir(), "cinematic-story", "renders", job.id);
  await fs.mkdir(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, `output.${ext}`);

  if (job.format === "webm") {
    args.push("-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32");
    args.push("-pix_fmt", "yuv420p");
  } else {
    args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "20");
    args.push("-pix_fmt", "yuv420p");
    args.push("-movflags", "+faststart");
  }

  args.push(outPath);

  return { args, outKey, outPath, tmpDir, totalSeconds: total };
}

async function runJob(job: JobWithProject) {
  const { args, outKey, outPath, tmpDir, totalSeconds } = await buildFfmpegArgs(job);

  const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

  let lastProgressWrite = 0;
  let buffer = "";

  const updateProgress = async (pct: number) => {
    const now = Date.now();
    if (now - lastProgressWrite < 900) return;
    lastProgressWrite = now;
    await prisma.renderJob.update({ where: { id: job.id }, data: { progress: Math.max(0, Math.min(100, pct)) } });
  };

  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    // parse key=value lines from -progress
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      const [k, v] = line.split("=");
      if (k === "out_time_ms") {
        const ms = Number(v);
        if (!Number.isFinite(ms)) continue;
        const sec = ms / 1_000_000;
        const pct = Math.round((sec / totalSeconds) * 100);
        void updateProgress(pct);
      }
    }
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
    if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
  });

  const exitCode: number = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`FFmpeg failed (code ${exitCode}). ${stderr}`);
  }

  const bytes = await fs.readFile(outPath);
  await rendersStorage.putFile({
    key: outKey,
    bytes,
    contentType: contentTypeFromKey(outKey),
  });
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);

  await prisma.renderJob.update({
    where: { id: job.id },
    data: { status: "done", progress: 100, outputKey: outKey },
  });
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("Render worker started. Polling for jobs...");

  for (;;) {
    const job = await claimJob();
    if (!job) {
      await sleep(1200);
      continue;
    }

    try {
      await prisma.renderJob.update({ where: { id: job.id }, data: { status: "running", progress: 0 } });
      await runJob(job);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.renderJob.update({
        where: { id: job.id },
        data: { status: "error", errorMessage: msg.slice(0, 4000) },
      });
    }
  }
}

void main();

