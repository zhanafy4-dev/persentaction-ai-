"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardActions({
  projectId,
  shareToken,
  latestRenderId,
  latestRenderStatus,
}: {
  projectId: string;
  shareToken: string | null;
  latestRenderId: string | null;
  latestRenderStatus: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        disabled={busy !== null}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
        onClick={() =>
          void run("render-mp4", async () => {
            await fetch("/api/render", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId, format: "mp4" }),
            });
          })
        }
      >
        Render MP4
      </button>
      <button
        disabled={busy !== null}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
        onClick={() =>
          void run("render-webm", async () => {
            await fetch("/api/render", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId, format: "webm" }),
            });
          })
        }
      >
        Render WebM
      </button>
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
      {latestRenderId && latestRenderStatus === "done" && (
        <a
          href={`/api/renders/${latestRenderId}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
        >
          Download
        </a>
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

