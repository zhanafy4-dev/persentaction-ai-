"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImgRow = { id: string; name: string; description: string };

type PendingFile = {
  key: string;
  file: File;
  preview: string;
  description: string;
};

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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(images.map((i) => [i.id, i.description ?? ""])),
  );

  useEffect(() => {
    setDraft((prev) => {
      const next: Record<string, string> = {};
      for (const img of images) {
        next[img.id] = prev[img.id] ?? img.description ?? "";
      }
      return next;
    });
  }, [images]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const list = useMemo(() => images.map((i) => ({ ...i, description: draft[i.id] ?? "" })), [images, draft]);

  async function saveDescriptions() {
    setError(null);
    setBusy("save");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          images: list.map((i, idx) => ({ id: i.id, order: idx + 1, description: i.description })),
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "فشل الحفظ");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setBusy(null);
    }
  }

  function addPendingFiles(files: FileList | File[]) {
    setError(null);
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) {
      setError("اختر ملفات صور (JPG / PNG / WebP).");
      return;
    }
    setPending((prev) => [
      ...prev,
      ...arr.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
        description: "",
      })),
    ]);
  }

  async function uploadPending() {
    if (pending.length === 0) return;
    setError(null);
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.set("projectId", projectId);
      fd.set("title", title);
      fd.set("descriptions", JSON.stringify(pending.map((p) => p.description)));
      for (const p of pending) fd.append("files", p.file);

      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? `فشل الرفع (${res.status})`);

      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل رفع الصور");
    } finally {
      setBusy(null);
    }
  }

  function removePending(key: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.key !== key);
    });
  }

  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.24em] text-white/60">PROJECT</div>
          <div className="mt-2 text-xl font-semibold text-white">{title}</div>
          <div className="mt-2 text-sm text-white/70">
            1) اختر الصور واكتب وصف كل صورة · 2) اضغط <strong className="text-white">رفع الصور</strong> · 3) احفظ
            التعديلات إن لزم
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            إضافة صور
          </button>
          {pending.length > 0 && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void uploadPending()}
              className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-5 py-2 text-xs font-semibold text-black disabled:opacity-50 gpu"
            >
              {busy === "upload" ? "جاري الرفع…" : `رفع ${pending.length} صورة`}
            </button>
          )}
          {list.length > 0 && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void saveDescriptions()}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
            >
              {busy === "save" ? "جاري الحفظ…" : "حفظ الأوصاف"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addPendingFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* منطقة رفع */}
      <div
        className="mt-6 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-8 text-center transition-colors hover:bg-white/8"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) addPendingFiles(e.dataTransfer.files);
        }}
      >
        <div className="text-sm font-medium text-white/85">اسحب الصور هنا أو اضغط للاختيار</div>
        <div className="mt-1 text-xs text-white/55">JPG · PNG · WebP</div>
      </div>

      {/* صور قبل الرفع — مع وصف */}
      {pending.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-white/80">قبل الرفع ({pending.length})</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {pending.map((p) => (
              <div key={p.key} className="rounded-2xl border border-amber-400/25 bg-black/30 p-3">
                <div className="flex gap-3">
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <img src={p.preview} alt="" className="h-full w-full object-cover gpu" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate text-xs text-white/70">{p.file.name}</div>
                      <button
                        type="button"
                        className="text-xs text-red-300 hover:text-red-200"
                        onClick={() => removePending(p.key)}
                      >
                        حذف
                      </button>
                    </div>
                    <label className="mt-2 block text-[11px] text-white/55">النص جنب الصورة في العرض</label>
                    <textarea
                      value={p.description}
                      onChange={(e) =>
                        setPending((prev) =>
                          prev.map((x) => (x.key === p.key ? { ...x, description: e.target.value } : x)),
                        )
                      }
                      rows={3}
                      className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)]"
                      placeholder="اكتب وصف الصورة…"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* صور مرفوعة */}
      {list.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-white/80">الصور المرفوعة ({list.length})</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {list.map((img) => (
              <div key={img.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex gap-3">
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                    <img
                      src={`/api/projects/${projectId}/images/${img.id}`}
                      alt=""
                      className="h-full w-full object-cover gpu"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-white/50">مرفوعة</div>
                    <label className="mt-2 block text-[11px] text-white/55">تعديل الوصف</label>
                    <textarea
                      value={img.description}
                      onChange={(e) => setDraft((d) => ({ ...d, [img.id]: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)]"
                      placeholder="اكتب الوصف هنا…"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
