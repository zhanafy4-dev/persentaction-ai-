import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ScrollSequence } from "@/components/cinematic/ScrollSequence";
import { PageToolbar, ToolbarLink } from "@/components/PageToolbar";
import { VideoRenderPanel } from "@/components/VideoRenderPanel";
import { ProjectEditor } from "./ui/ProjectEditor";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } }, renders: { orderBy: { createdAt: "desc" } }, shares: true },
  });

  if (!project || project.userId !== u.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="glass-strong rounded-3xl p-8 text-white/80">Project not found.</div>
      </div>
    );
  }

  // For the preview we keep Data URLs optional; server-stored images are served via /api/projects/:id/image?key=
  // MVP: render preview without images if not available as dataUrl.
  const imagesForPreview = project.images.map((img) => ({
    id: img.id,
    name: img.originalName,
    dataUrl: `/api/projects/${project.id}/images/${img.id}`,
    description: img.description,
  }));

  return (
    <div className="min-h-screen w-full">
      <PageToolbar title={project.title} subtitle={`${project.images.length} images`}>
        <ToolbarLink href="/dashboard">لوحة التحكم</ToolbarLink>
        <ToolbarLink href="/">رفع صور</ToolbarLink>
        <ToolbarLink href="/login" primary>
          Login
        </ToolbarLink>
      </PageToolbar>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:py-10">
        <VideoRenderPanel
          projectId={project.id}
          projectTitle={project.title}
          initialJob={
            project.renders[0]
              ? {
                  id: project.renders[0].id,
                  status: project.renders[0].status,
                  progress: project.renders[0].progress,
                  format: project.renders[0].format,
                  errorMessage: project.renders[0].errorMessage,
                }
              : null
          }
        />
        <ProjectEditor
          projectId={project.id}
          title={project.title}
          images={project.images.map((i) => ({ id: i.id, name: i.originalName, description: i.description }))}
        />
      </div>

      <ScrollSequence images={imagesForPreview} variant="dynamic" />
    </div>
  );
}

