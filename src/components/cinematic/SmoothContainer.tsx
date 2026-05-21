"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createLenis } from "@/lib/lenis";
import { usePrefersNativeScroll } from "@/lib/use-prefers-native-scroll";
import { ensureGsap } from "@/lib/gsap";
import { LenisProvider } from "./LenisContext";
import type { LenisInstance } from "@/lib/lenis";

export function SmoothContainer({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [lenis, setLenis] = useState<LenisInstance | null>(null);
  const prefersNativeScroll = usePrefersNativeScroll();

  const { gsap, ScrollTrigger } = useMemo(() => ensureGsap(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || prefersNativeScroll) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    const lenis = createLenis();
    setLenis(lenis);
    gsap.ticker.lagSmoothing(0);
    const onGsapTick = (timeSeconds: number) => {
      lenis.raf(timeSeconds * 1000);
    };
    gsap.ticker.add(onGsapTick);

    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    const resize = () => lenis.resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(() => lenis.resize());
    if (rootRef.current) ro.observe(rootRef.current);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(onGsapTick);
      lenis.destroy();
      setLenis(null);
    };
  }, [gsap, ScrollTrigger, mounted, prefersNativeScroll]);

  useEffect(() => {
    if (!prefersNativeScroll) return;
    document.documentElement.classList.add("native-scroll");
    return () => document.documentElement.classList.remove("native-scroll");
  }, [prefersNativeScroll]);

  return (
    <LenisProvider lenis={prefersNativeScroll ? null : lenis}>
      <div ref={rootRef} className="w-full overflow-x-clip">
        {children}
      </div>
    </LenisProvider>
  );
}
