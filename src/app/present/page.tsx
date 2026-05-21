"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllImages, type StoredImage } from "@/lib/imageStore";
import { ScrollSequence } from "@/components/cinematic/ScrollSequence";
import { PageToolbar, ToolbarLink } from "@/components/PageToolbar";

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

  const subtitle = useMemo(() => {
    if (images === null) return "Preparing scenes…";
    if (!hasImages) return "No images found.";
    return `${images.length} scenes loaded`;
  }, [images, hasImages]);

  return (
    <div className="min-h-screen w-full pb-safe">
      <PageToolbar title="Cinematic Presentation" subtitle={subtitle}>
        <ToolbarLink href="/">رفع صور</ToolbarLink>
        <ToolbarLink href="/dashboard">لوحة التحكم</ToolbarLink>
        <ToolbarLink href="/login" primary>
          Login
        </ToolbarLink>
      </PageToolbar>

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
        <>
          <ScrollSequence images={images} variant="dynamic" />
          <div className="h-8 w-full shrink-0" aria-hidden />
        </>
      )}
    </div>
  );
}
