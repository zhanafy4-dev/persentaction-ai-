"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImgRow = { id: string; name: string; description: string };

export function ProjectEditor({
  projectId,
  title,
  images,
}: {
  projectId: string;
  title: string;
  images: ImgRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(images.map((i) => [i.id, i.description ?? ""])),
  );

  const list = useMemo(() => images.map((i) => ({ ...i, description: draft[i.id] ?? "" })), [images, draft]);

  async function saveDescriptions() {
    setBusy("save");
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          images: list.map((i, idx) => ({ id: i.id, order: idx + 1, description: i.description })),
        }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.set("projectId", projectId);
      fd.set("title", title);
      // initial descriptions empty
      fd.set("descriptions", JSON.stringify(arr.map(() => "")));
      for (const f of arr) fd.append("files", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.24em] text-white/60">PROJECT</div>
          <div className="mt-2 text-xl font-semibold text-white">{title}</div>
          <div className="mt-2 text-sm text-white/70">
            اكتب وصف لكل صورة (هيظهر جنبها في البرزنتيشن) ثم اضغط Save.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            Add images
          </button>
          <button
            disabled={busy !== null}
            onClick={() => void saveDescriptions()}
            className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-5 py-2 text-xs font-semibold text-black disabled:opacity-50 gpu"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files);
        }}
      />

      <div
        className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void uploadFiles(e.dataTransfer.files);
        }}
      >
        {list.map((img) => (
          <div key={img.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="truncate text-xs font-medium text-white/85">{img.name}</div>
            <textarea
              value={img.description}
              onChange={(e) => setDraft((d) => ({ ...d, [img.id]: e.target.value }))}
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
              placeholder="اكتب الوصف هنا…"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

