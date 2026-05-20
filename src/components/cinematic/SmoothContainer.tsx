"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createLenis } from "@/lib/lenis";
import { ensureGsap } from "@/lib/gsap";
import { LenisProvider } from "./LenisContext";
import type { LenisInstance } from "@/lib/lenis";

export function SmoothContainer({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [lenis, setLenis] = useState<LenisInstance | null>(null);

  const { gsap, ScrollTrigger } = useMemo(() => ensureGsap(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = createLenis();
    setLenis(lenis);
    // Lenis + GSAP: drive Lenis from the same ticker as GSAP (ms clock).
    // See: https://github.com/darkroomengineering/lenis#gsap-scrolltrigger
    gsap.ticker.lagSmoothing(0);
    const onGsapTick = (timeSeconds: number) => {
      lenis.raf(timeSeconds * 1000);
    };
    gsap.ticker.add(onGsapTick);

    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(onGsapTick);
      lenis.destroy();
      setLenis(null);
    };
  }, [gsap, ScrollTrigger, mounted]);

  // Note: We intentionally keep native scroll (Lenis enhances it).
  // This preserves browser optimizations, avoids scrollerProxy complexity,
  // and keeps ScrollTrigger stable while still rendering ultra-smooth motion.
  return (
    <LenisProvider lenis={lenis}>
      <div ref={rootRef} className="min-h-screen w-full">
        {children}
      </div>
    </LenisProvider>
  );
}

