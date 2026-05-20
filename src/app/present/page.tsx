"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getAllImages, type StoredImage } from "@/lib/imageStore";
import { ScrollSequence } from "@/components/cinematic/ScrollSequence";

function preloadDataUrls(urls: string[]) {
  urls.forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}

export default function PresentationPage() {
  const [images, setImages] = useState<StoredImage[] | null>(null);

  useEffect(() => {
    let alive = true;
    getAllImages()
      .then((imgs) => {
        if (!alive) return;
        setImages(imgs);
        preloadDataUrls(imgs.map((i) => i.dataUrl));
      })
      .catch(() => {
        if (!alive) return;
        setImages([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  const hasImages = (images?.length ?? 0) > 0;

  const header = useMemo(() => {
    if (images === null) return "Preparing scenes…";
    if (!hasImages) return "No images found.";
    return `${images.length} scenes loaded`;
  }, [images, hasImages]);

  return (
    <div className="min-h-screen w-full">
      <div className="fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-8">
          <div className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[linear-gradient(135deg,var(--accent0),var(--accent1))] gpu" />
              <div className="flex flex-col leading-tight">
                <div className="text-sm font-semibold text-white">Cinematic Presentation</div>
                <div className="text-[11px] text-white/65">{header}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/8 gpu"
              >
                Upload
              </Link>
              <motion.a
                href="#"
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "auto" });
                }}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/14 gpu"
              >
                Top
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20 sm:h-24" />

      {images === null ? (
        <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-24">
          <div className="glass rounded-3xl px-8 py-8 text-sm text-white/70">Loading…</div>
        </div>
      ) : !hasImages ? (
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
          <div className="glass rounded-3xl px-8 py-8">
            <div className="text-lg font-semibold text-white">Upload images to begin</div>
            <div className="mt-2 text-sm text-white/65">
              We store your images locally (IndexedDB) to render the cinematic presentation across routes.
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-3 text-sm font-semibold text-black gpu"
            >
              Go to upload
            </Link>
          </div>
        </div>
      ) : (
        <ScrollSequence images={images} />
      )}
    </div>
  );
}

