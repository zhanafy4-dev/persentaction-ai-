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
    const res = await fetch(`/api/render?${q}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { job?: RenderJob; jobs?: RenderJob[] };
    const next = data.job ?? data.jobs?.[0] ?? null;
    if (next) setJob(next);
  }, [job?.id, projectId]);

  useEffect(() => {
    void poll();
  }, [poll]);

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
        credentials: "include",
        body: JSON.stringify({ projectId, format }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "Failed to start render");
      }
      const { jobId } = (await res.json()) as { jobId: string };
      setJob({ id: jobId, status: "queued", progress: 0, format });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Render failed");
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
      const res = await fetch(`/api/renders/${job.id}`, { credentials: "include" });
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
      window.open(`/api/renders/${job.id}`, "_blank", "noopener");
    } finally {
      setDownloading(false);
    }
  }

  const isActive = job?.status === "queued" || job?.status === "running";
  const isDone = job?.status === "done";
  const isError = job?.status === "error";

  return (
    <>
      {isDone && (
        <div className="fixed bottom-0 left-0 right-0 z-[200] border-t border-white/15 bg-black/90 px-4 py-4 pb-safe backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white">
              <span className="font-semibold text-emerald-300">الفيديو جاهز!</span> اضغط لتحميله على جهازك.
            </div>
            <button
              type="button"
              disabled={downloading}
              onClick={() => void downloadVideo()}
              className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-8 py-3.5 text-base font-bold text-black disabled:opacity-50 gpu"
            >
              {downloading ? "جاري التحميل…" : "⬇ تحميل الفيديو الآن"}
            </button>
          </div>
        </div>
      )}

      <div className={`glass rounded-3xl border-2 p-5 gpu ${isDone ? "border-emerald-400/40" : "border-white/10"}`}>
        <div className="text-xs tracking-[0.24em] text-white/60">VIDEO EXPORT</div>
        <h2 className="mt-2 text-xl font-semibold text-white">تصدير وتحميل الفيديو</h2>
        <p className="mt-1 text-sm text-white/65">
          1) Render MP4 — 2) انتظر done — 3) تحميل الفيديو (Worker على Railway). النصوص تظهر في العرض على الموقع؛ الفيديو = صور متحركة فقط.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || isActive}
            onClick={() => void startRender("mp4")}
            className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50 gpu"
          >
            {busy ? "Starting…" : "① Render MP4"}
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

        {job ? (
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

            {isError && job.errorMessage && <p className="mt-3 text-sm text-red-300">{job.errorMessage}</p>}

            {isDone && (
              <button
                type="button"
                disabled={downloading}
                onClick={() => void downloadVideo()}
                className="mt-4 w-full rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-4 text-base font-bold text-black disabled:opacity-50 gpu"
              >
                {downloading ? "جاري التحميل…" : "⬇ تحميل الفيديو"}
              </button>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/55">لم يبدأ أي render بعد. اضغط Render MP4.</p>
        )}
      </div>

      {isDone && <div className="h-24" aria-hidden />}
    </>
  );
}
