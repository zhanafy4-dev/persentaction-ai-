import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DashboardActions } from "./ui/DashboardActions";
import { NewProjectButton } from "./ui/NewProjectButton";

export default async function DashboardPage() {
  const u = await requireUser();
  if (!u) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="glass-strong rounded-3xl p-8 text-white/80">
          <div className="text-lg font-semibold">Unauthorized</div>
          <Link className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm" href="/login">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { userId: u.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      renders: { orderBy: { createdAt: "desc" }, take: 1 },
      shares: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="min-h-screen w-full px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.24em] text-white/60">DASHBOARD</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your projects</h1>
            <p className="mt-2 text-sm text-white/70">Render MP4/WebM with FFmpeg jobs and manage share links.</p>
          </div>
          <NewProjectButton />
        </div>

        {projects.length === 0 && (
          <p className="mt-6 text-sm text-white/60">
            لا يوجد مشاريع بعد. اضغط <strong className="text-white">مشروع جديد</strong> لرفع الصور وتصدير الفيديو.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const latestRender = p.renders[0];
            const share = p.shares[0];
            return (
              <div key={p.id} className="glass rounded-3xl p-5 gpu">
                <div className="text-sm font-semibold text-white">{p.title}</div>
                <div className="mt-1 text-xs text-white/60">{new Date(p.updatedAt).toLocaleString()}</div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-white/70">
                    Render:{" "}
                    <span className="text-white/90">
                      {latestRender ? `${latestRender.status} (${latestRender.progress}%)` : "none"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/project/${p.id}`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
                  >
                    Open
                  </Link>
                  <DashboardActions
                    projectId={p.id}
                    projectTitle={p.title}
                    shareToken={share?.token ?? null}
                    latestRenderId={latestRender?.id ?? null}
                    latestRenderStatus={latestRender?.status ?? null}
                    latestRenderProgress={latestRender?.progress ?? 0}
                    latestRenderFormat={latestRender?.format ?? "mp4"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

