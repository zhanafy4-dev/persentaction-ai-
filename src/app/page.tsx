"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clearImages, putImages, type StoredImage } from "@/lib/imageStore";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

async function fileToDataUrl(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return `data:${file.type};base64,${base64}`;
}

async function getImageSize(dataUrl: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = dataUrl;
  // decode() avoids layout + yields to the browser’s decoder.
  await img.decode().catch(() => undefined);
  return { width: img.naturalWidth || undefined, height: img.naturalHeight || undefined };
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<StoredImage[]>([]);
  const canStart = items.length > 0 && !busy;

  const dropHint = useMemo(() => {
    if (busy) return "Optimizing & preparing scenes…";
    if (items.length === 0) return "Drag & drop images here (or click to browse)";
    return "Drop more images to add scenes";
  }, [busy, items.length]);

  async function ingestFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setBusy(true);
    try {
      const next: StoredImage[] = [];
      for (const f of list) {
        const dataUrl = await fileToDataUrl(f);
        const size = await getImageSize(dataUrl);
        next.push({ id: uid(), name: f.name, type: f.type, dataUrl, description: "", ...size });
      }
      setItems((prev) => [...prev, ...next]);
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    if (!canStart) return;
    setBusy(true);
    try {
      await clearImages();
      await putImages(items);
      router.push("/present");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.28),transparent_60%)] blur-3xl gpu" />
        <div className="absolute left-[10%] top-[55%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.18),transparent_60%)] blur-3xl gpu" />
        <div className="absolute right-[8%] top-[28%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,61,141,0.16),transparent_60%)] blur-3xl gpu" />
      </div>

      <main className="relative w-full max-w-5xl">
        <div className="glass-strong perspective-1200 mx-auto overflow-hidden rounded-3xl">
          <div className="flex flex-col gap-10 px-7 py-10 sm:px-10">
            <header className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs tracking-[0.24em] text-[color:var(--fg1)]">CINEMATIC STORY ENGINE</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-5 py-2.5 text-sm font-semibold text-black gpu"
                  >
                    Login / Sign up
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-sm text-white/90 gpu"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
              <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-5xl">
                Upload images. Get a premium, GPU-accelerated scrolling film.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--fg1)]">
                Quick preview below works without an account. To save projects, export video, and share links — use{" "}
                <Link href="/login" className="font-medium text-white underline underline-offset-4">
                  Login
                </Link>
                .
              </p>
            </header>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                void ingestFiles(e.dataTransfer.files);
              }}
              className="group relative flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center transition-colors hover:bg-white/7 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
            >
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.28),transparent_60%)] blur-2xl gpu" />
                <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.22),transparent_60%)] blur-2xl gpu" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="glass inline-flex h-12 w-12 items-center justify-center rounded-2xl gpu">
                  <span className="text-lg">⬆</span>
                </div>
                <div className="text-sm font-medium text-[color:var(--fg0)]">{dropHint}</div>
                <div className="text-xs text-[color:var(--fg1)]">
                  JPG / PNG / WebP • Lazy rendering • GPU transforms • No layout thrash
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void ingestFiles(e.target.files);
                }}
              />
            </button>

            {items.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-medium tracking-wide text-[color:var(--fg1)]">
                    Scenes ({items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[color:var(--fg1)] transition-colors hover:bg-white/8"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it) => (
                    <div key={it.id} className="glass rounded-2xl p-3 gpu">
                      <div className="flex gap-3">
                        <div className="relative h-24 w-32 flex-none overflow-hidden rounded-xl border border-white/10 bg-black/40 gpu">
                          <img
                            src={it.dataUrl}
                            alt={it.name}
                            className="absolute inset-0 h-full w-full object-cover opacity-90 gpu"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent gpu-opacity" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-white/85">{it.name}</div>
                          <div className="mt-2">
                            <label className="block text-[11px] text-white/55">Description (هيظهر جنب الصورة)</label>
                            <textarea
                              value={it.description ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setItems((prev) =>
                                  prev.map((p) => (p.id === it.id ? { ...p, description: v } : p)),
                                );
                              }}
                              rows={3}
                              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
                              placeholder="اكتب وصف الصورة أو الكلام اللي عايزه يظهر جنبها…"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[color:var(--fg1)]">
                Tip: more images = richer storytelling. The engine auto-builds transitions and depth.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <motion.button
                  type="button"
                  disabled={!canStart}
                  whileTap={canStart ? { scale: 0.98 } : undefined}
                  onClick={() => void onGenerate()}
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_55px_rgba(124,92,255,0.25)] disabled:cursor-not-allowed disabled:opacity-40 gpu"
                >
                  معاينة سريعة (بدون حساب)
                </motion.button>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/8 px-6 py-3 text-sm font-medium text-white/90 gpu"
                >
                  حساب + فيديو للتحميل →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
