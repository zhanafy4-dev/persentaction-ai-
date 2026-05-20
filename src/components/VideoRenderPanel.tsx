"use client";

import { useCallback, useEffect, useState } from "react";

type RenderJob = {
  id: string;
  status: string;
  progress: number;
  format: string;
  errorMessage?: string | null;
};

export function VideoRenderPanel({
  projectId,
  projectTitle,
  initialJob,
}: {
  projectId: string;
  projectTitle: string;
  initialJob: RenderJob | null;
}) {
  const [job, setJob] = useState<RenderJob | null>(initialJob);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const poll = useCallback(async () => {
    const q = job?.id ? `jobId=${job.id}` : `projectId=${projectId}`;
    const res = await fetch(`/api/render?${q}`);
    if (!res.ok) return;
    const data = (await res.json()) as { job?: RenderJob; jobs?: RenderJob[] };
    const next = data.job ?? data.jobs?.[0] ?? null;
    if (next) setJob(next);
  }, [job?.id, projectId]);

  useEffect(() => {
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    const t = setInterval(() => void poll(), 2000);
    return () => clearInterval(t);
  }, [job, poll]);

  async function startRender(format: "mp4" | "webm") {
    setBusy(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, format }),
      });
      if (!res.ok) throw new Error("Failed to start render");
      const { jobId } = (await res.json()) as { jobId: string };
      setJob({ id: jobId, status: "queued", progress: 0, format });
    } finally {
      setBusy(false);
    }
  }

  async function downloadVideo() {
    if (!job || job.status !== "done") return;
    setDownloading(true);
    try {
      const safeName = projectTitle.replace(/[^a-z0-9-_]+/gi, "-") || "video";
      const filename = `${safeName}.${job.format}`;
      const res = await fetch(`/api/renders/${job.id}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(`/api/renders/${job.id}`, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  const isActive = job?.status === "queued" || job?.status === "running";
  const isDone = job?.status === "done";
  const isError = job?.status === "error";

  return (
    <div className="glass rounded-3xl p-5 gpu">
      <div className="text-xs tracking-[0.24em] text-white/60">VIDEO EXPORT</div>
      <h2 className="mt-2 text-lg font-semibold text-white">تصدير وتحميل الفيديو</h2>
      <p className="mt-1 text-sm text-white/65">
        بعد ما الـ render يخلص، اضغط تحميل الفيديو. (يحتاج Worker شغّال على Railway)
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || isActive}
          onClick={() => void startRender("mp4")}
          className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50 gpu"
        >
          {busy ? "Starting…" : "Render MP4"}
        </button>
        <button
          type="button"
          disabled={busy || isActive}
          onClick={() => void startRender("webm")}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/80 disabled:opacity-50 gpu"
        >
          Render WebM
        </button>
      </div>

      {job && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/80">
            <span>
              الحالة: <strong className="text-white">{job.status}</strong>
              {isActive && ` — ${job.progress}%`}
            </span>
            <span className="text-xs text-white/50">{job.format.toUpperCase()}</span>
          </div>

          {isActive && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] transition-all duration-500"
                style={{ width: `${Math.max(2, job.progress)}%` }}
              />
            </div>
          )}

          {isError && job.errorMessage && (
            <p className="mt-3 text-sm text-red-300">{job.errorMessage}</p>
          )}

          {isDone && (
            <button
              type="button"
              disabled={downloading}
              onClick={() => void downloadVideo()}
              className="mt-4 w-full rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-3.5 text-sm font-semibold text-black disabled:opacity-50 gpu sm:w-auto"
            >
              {downloading ? "جاري التحميل…" : "⬇ تحميل الفيديو"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
