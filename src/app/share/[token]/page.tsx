import Link from "next/link";
import { prisma } from "@/lib/db";
import { ScrollSequence } from "@/components/cinematic/ScrollSequence";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: { include: { images: { orderBy: { order: "asc" } } } } },
  });

  if (!link || !link.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="glass-strong rounded-3xl p-8 text-white/80">Shared link not found.</div>
      </div>
    );
  }

  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="glass-strong rounded-3xl p-8 text-white/80">This shared link has expired.</div>
      </div>
    );
  }

  const project = link.project;
  const images = project.images.map((img) => ({
    id: img.id,
    name: img.originalName,
    dataUrl: `/api/share/${token}/images/${img.id}`,
    description: img.description,
  }));

  return (
    <div className="min-h-screen w-full">
      <div className="fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-8">
          <div className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="flex flex-col leading-tight">
              <div className="text-sm font-semibold text-white">{project.title}</div>
              <div className="text-[11px] text-white/65">Shared presentation</div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/8 gpu"
              >
                Create yours
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20 sm:h-24" />
      <ScrollSequence images={images} />
    </div>
  );
}

