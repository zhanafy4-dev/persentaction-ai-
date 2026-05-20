"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type RenderJob = {
  id: string;
  status: string;
  progress: number;
  format: string;
};

export function DashboardActions({
  projectId,
  projectTitle,
  shareToken,
  latestRenderId,
  latestRenderStatus,
  latestRenderProgress,
  latestRenderFormat,
}: {
  projectId: string;
  projectTitle: string;
  shareToken: string | null;
  latestRenderId: string | null;
  latestRenderStatus: string | null;
  latestRenderProgress: number;
  latestRenderFormat: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [job, setJob] = useState<RenderJob | null>(
    latestRenderId
      ? {
          id: latestRenderId,
          status: latestRenderStatus ?? "queued",
          progress: latestRenderProgress,
          format: latestRenderFormat,
        }
      : null,
  );

  const poll = useCallback(async () => {
    if (!job?.id) return;
    const res = await fetch(`/api/render?jobId=${job.id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { job: RenderJob };
    if (data.job) setJob(data.job);
  }, [job?.id]);

  useEffect(() => {
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    const t = setInterval(() => void poll(), 2000);
    return () => clearInterval(t);
  }, [job, poll]);

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(null);
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
    } finally {
      setDownloading(false);
    }
  }

  const isActive = job?.status === "queued" || job?.status === "running";
  const isDone = job?.status === "done";

  return (
    <>
      <button
        disabled={busy !== null || isActive}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
        onClick={() =>
          void run("render-mp4", async () => {
            const res = await fetch("/api/render", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId, format: "mp4" }),
            });
            if (res.ok) {
              const { jobId } = (await res.json()) as { jobId: string };
              setJob({ id: jobId, status: "queued", progress: 0, format: "mp4" });
            }
          })
        }
      >
        Render MP4
      </button>
      <button
        disabled={busy !== null || isActive}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
        onClick={() =>
          void run("render-webm", async () => {
            const res = await fetch("/api/render", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId, format: "webm" }),
            });
            if (res.ok) {
              const { jobId } = (await res.json()) as { jobId: string };
              setJob({ id: jobId, status: "queued", progress: 0, format: "webm" });
            }
          })
        }
      >
        Render WebM
      </button>
      {isActive && (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          {job?.progress ?? 0}%
        </span>
      )}
      {isDone && job && (
        <button
          type="button"
          disabled={downloading}
          onClick={() => void downloadVideo()}
          className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
        >
          {downloading ? "Downloading…" : "⬇ Download video"}
        </button>
      )}
      <button
        disabled={busy !== null}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
        onClick={() =>
          void run("share", async () => {
            await fetch("/api/share", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          })
        }
      >
        Share
      </button>
      {shareToken && (
        <Link
          href={`/share/${shareToken}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
        >
          View share
        </Link>
      )}
      <button
        disabled={busy !== null}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
        onClick={() =>
          void run("delete", async () => {
            await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
          })
        }
      >
        Delete
      </button>
    </>
  );
}
