import { NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { uploadsStorage } from "@/lib/storage/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extFromMime(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const projectId = String(form.get("projectId") ?? "").trim() || null;
  const title = String(form.get("title") ?? "").trim() || "Untitled project";

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

  // descriptions can be passed as a JSON array aligned with files order
  const descriptionsJson = String(form.get("descriptions") ?? "[]");
  const descriptions = (JSON.parse(descriptionsJson) as unknown[]).map((v) => String(v ?? ""));

  const project =
    projectId
      ? await prisma.project.findUnique({ where: { id: projectId } })
      : await prisma.project.create({ data: { userId: u.userId, title } });

  if (!project || project.userId !== u.userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const last = await prisma.projectImage.findFirst({
    where: { projectId: project.id },
    orderBy: { order: "desc" },
  });
  let order = (last?.order ?? 0) + 1;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const out = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i]!;
        const bytes = Buffer.from(await f.arrayBuffer());
        const id = crypto.randomUUID();
        const ext = extFromMime(f.type);
        const key = path.join(u.userId, project.id, `${id}.${ext}`).replace(/\\/g, "/");
        await uploadsStorage.putFile({ key, bytes, contentType: f.type });

        const img = await tx.projectImage.create({
          data: {
            id,
            projectId: project.id,
            order,
            originalName: f.name,
            storageKey: key,
            description: (descriptions[i] ?? "").slice(0, 2000),
          },
        });
        order += 1;
        out.push(img);
      }
      return out;
    });

    return NextResponse.json({ projectId: project.id, images: created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    // eslint-disable-next-line no-console
    console.error("[upload]", e);
    const isStorage = /cloudinary|storage|Missing CLOUDINARY/i.test(msg);
    return NextResponse.json(
      {
        error: isStorage
          ? "فشل التخزين. تأكد من إعداد Cloudinary على السيرفر (CLOUDINARY_*)."
          : msg.slice(0, 500),
      },
      { status: 500 },
    );
  }
}

