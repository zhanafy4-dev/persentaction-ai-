"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DynamicPresentation } from "@/components/presentation-engine/DynamicPresentation";
import { ensureGsap } from "@/lib/gsap";
import type { PresentationImage } from "@/presentation-engine/types";
import { MotionOverlay } from "./MotionOverlay";
import { CinematicImage } from "./CinematicImage";

export type { PresentationImage };
export type ScrollSequenceVariant = "classic" | "dynamic";

/**
 * Presentation-style autoplay:
 * - Slide alternates RIGHT image + LEFT text, then LEFT image + RIGHT text.
 * - Only transforms + opacity.
 */
const CROSS_DURATION = 1.05;
const HOLD_RATIO = 3.2;
const HOLD_DURATION = Number((CROSS_DURATION * HOLD_RATIO).toFixed(2));
const LOOP_GAP = Number((CROSS_DURATION * 1.1).toFixed(2));

const PLACEHOLDER_COPY = "اكتب وصف للصورة من صفحة الرفع علشان يظهر هنا جنبها.";

type SlideCopy = { eyebrow: string; title: string; subtitle?: string };

function buildCopy(images: PresentationImage[]): SlideCopy[] {
  return images.map((img, i) => {
    const desc = img.description?.trim();
    return {
      eyebrow: `SLIDE ${String(i + 1).padStart(2, "0")}`,
      title: desc || PLACEHOLDER_COPY,
    };
  });
}

export function ScrollSequence({
  images,
  variant = "classic",
}: {
  images: PresentationImage[];
  variant?: ScrollSequenceVariant;
}) {
  if (variant === "dynamic") {
    return <DynamicPresentation images={images} />;
  }
  return <ClassicScrollSequence images={images} />;
}

function ClassicScrollSequence({ images }: { images: PresentationImage[] }) {
  const copy = useMemo(() => buildCopy(images), [images]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Two fixed slots (left and right). We toggle visibility + swap content.
  const frameLRef = useRef<HTMLDivElement | null>(null);
  const frameRRef = useRef<HTMLDivElement | null>(null);
  const imgLRef = useRef<HTMLImageElement | null>(null);
  const imgRRef = useRef<HTMLImageElement | null>(null);
  const overlayLRef = useRef<HTMLDivElement | null>(null);
  const overlayRRef = useRef<HTMLDivElement | null>(null);
  const textLRef = useRef<HTMLDivElement | null>(null);
  const textRRef = useRef<HTMLDivElement | null>(null);

  const progressRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const playingRef = useRef(true);

  const { gsap } = useMemo(() => ensureGsap(), []);

  const togglePlay = useCallback(() => {
    const tl = tlRef.current;
    if (!tl) return;
    playingRef.current = !playingRef.current;
    if (playingRef.current) tl.play();
    else tl.pause();
  }, []);

  const restart = useCallback(() => {
    const tl = tlRef.current;
    if (!tl) return;
    playingRef.current = true;
    tl.restart(true);
    tl.play();
  }, []);

  useLayoutEffect(() => {
    if (!rootRef.current || !stageRef.current || images.length === 0) return;
    const frameL = frameLRef.current;
    const frameR = frameRRef.current;
    const imgL = imgLRef.current;
    const imgR = imgRRef.current;
    const textL = textLRef.current;
    const textR = textRRef.current;
    const bar = progressRef.current;
    if (!frameL || !frameR || !imgL || !imgR || !textL || !textR) return;

    const ctx = gsap.context(() => {
      const n = images.length;

      const setBar = bar ? gsap.quickSetter(bar, "scaleX") : null;

      // Init hidden
      gsap.set([frameL, frameR], { opacity: 0, scale: 1.02, xPercent: 0, yPercent: 0, force3D: true });
      gsap.set([textL, textR], { opacity: 0, yPercent: 8, force3D: true });
      gsap.set([imgL, imgR], { scale: 1.02, xPercent: 0, yPercent: 0, rotation: 0, force3D: true });

      // Seed initial sources
      imgR.src = images[0]?.dataUrl ?? "";
      imgR.alt = images[0]?.description?.trim() || "Slide 1";
      imgL.src = images[1]?.dataUrl ?? images[0]?.dataUrl ?? "";
      imgL.alt = images[1]?.description?.trim() || images[0]?.description?.trim() || "Slide 2";

      const fillText = (node: HTMLElement, idx: number) => {
        const m = copy[idx] ?? copy[0];
        const eye = node.querySelector<HTMLElement>("[data-eye]");
        const title = node.querySelector<HTMLElement>("[data-title]");
        const sub = node.querySelector<HTMLElement>("[data-sub]");
        if (eye) eye.textContent = m.eyebrow;
        if (title) title.textContent = m.title ?? "";
        if (sub) sub.textContent = m.subtitle ?? "";
      };

      fillText(textL, 0);
      fillText(textR, 1);

      const reduceMotion =
        typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const crossDur = reduceMotion ? 0.2 : CROSS_DURATION;
      const holdDur = reduceMotion ? 0.6 : HOLD_DURATION;

      const tl = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        repeat: -1,
        repeatDelay: LOOP_GAP,
        onUpdate: () => setBar?.(tl.progress()),
      });
      tlRef.current = tl;

      // Start with RIGHT frame visible + LEFT text visible (presentation feel)
      gsap.set(frameR, { opacity: 1, scale: 1, force3D: true });
      gsap.set(textL, { opacity: 1, yPercent: 0, force3D: true });
      gsap.set(frameL, { opacity: 0, force3D: true });
      gsap.set(textR, { opacity: 0, force3D: true });

      let cursor = 0;
      setVisibleIndex(0);

      for (let i = 0; i < n; i++) {
        const side: "R" | "L" = i % 2 === 0 ? "R" : "L";
        const incomingFrame = side === "R" ? frameR : frameL;
        const outgoingFrame = side === "R" ? frameL : frameR;
        const incomingText = side === "R" ? textL : textR; // text opposite to image
        const outgoingText = side === "R" ? textR : textL;
        const incomingImg = side === "R" ? imgR : imgL;

        const crossStart = cursor;

        // Update content for the incoming side at crossStart (low frequency)
        tl.call(() => {
          const idx = i;
          setVisibleIndex(idx);
          if (side === "R") {
            imgR.src = images[idx]?.dataUrl ?? "";
            imgR.alt = images[idx]?.description?.trim() || `Slide ${idx + 1}`;
            fillText(textL, idx);
          } else {
            imgL.src = images[idx]?.dataUrl ?? "";
            imgL.alt = images[idx]?.description?.trim() || `Slide ${idx + 1}`;
            fillText(textR, idx);
          }
        }, [], crossStart);

        // Crossfade out the previous side and in the next side (opposite side)
        tl.to(
          [outgoingFrame, outgoingText],
          { opacity: 0, yPercent: -4, duration: crossDur * 0.85, force3D: true, ease: reduceMotion ? "none" : "power1.inOut" },
          crossStart,
        );

        tl.fromTo(
          incomingFrame,
          { opacity: 0, scale: 1.02, xPercent: side === "R" ? 4 : -4, force3D: true },
          { opacity: 1, scale: 1, xPercent: 0, duration: crossDur, force3D: true, ease: reduceMotion ? "none" : "power2.out" },
          crossStart,
        );
        tl.fromTo(
          incomingText,
          { opacity: 0, yPercent: 10, xPercent: side === "R" ? -3 : 3, force3D: true },
          { opacity: 1, yPercent: 0, xPercent: 0, duration: crossDur, force3D: true, ease: reduceMotion ? "none" : "power2.out" },
          crossStart + crossDur * 0.08,
        );

        // Hold: subtle Ken Burns inside the frame
        const kbDir = i % 2 === 0 ? 1 : -1;
        tl.to(
          incomingImg,
          { scale: 1.05, xPercent: 0.55 * kbDir, yPercent: -0.35 * kbDir, duration: holdDur, ease: "none", force3D: true },
          crossStart + crossDur,
        );

        cursor += crossDur + holdDur;
      }

      const onVisibility = () => {
        if (document.hidden) tl.pause();
        else if (playingRef.current) tl.play();
      };
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        tl.kill();
        tlRef.current = null;
        playingRef.current = true;
        setBar?.(0);
      };
    }, rootRef);

    return () => ctx.revert();
  }, [gsap, images, copy]);

  const total = images.length;

  return (
    <div ref={rootRef} className="w-full">
      <section className="relative isolate w-full overflow-hidden border-b border-white/6 [contain:inline-size] perspective-1200">
        <div ref={stageRef} className="relative min-h-dvh w-full overflow-hidden gpu" data-lenis-prevent-touch data-lenis-prevent-wheel>
          {/* Full-page cinematic background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(6,8,18,0.95),rgba(5,6,12,1))]" />
            <div className="absolute inset-0 bg-[radial-gradient(720px_540px_at_15%_20%,rgba(124,92,255,0.14),transparent_55%)] gpu" />
            <div className="absolute inset-0 bg-[radial-gradient(700px_460px_at_88%_35%,rgba(0,212,255,0.10),transparent_55%)] gpu" />
            <div className="absolute inset-0 bg-[radial-gradient(600px_540px_at_52%_90%,rgba(255,61,141,0.08),transparent_55%)] gpu" />
            <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.04)_2px,rgba(255,255,255,0.04)_3px)]" />
          </div>

          <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col px-4 pb-10 pt-6 sm:px-8 md:pb-14">
            <div className="flex shrink-0 flex-wrap justify-end gap-2 pointer-events-auto">
              <button type="button" onClick={togglePlay} className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/10 gpu">
                إيقاف / تشغيل
              </button>
              <button type="button" onClick={restart} className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/10 gpu">
                من البداية
              </button>
            </div>

            {/* Fixed presentation stage: LEFT region and RIGHT region (we crossfade between them) */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center py-6 sm:py-10">
              <div className="relative w-full max-w-6xl">
                <div className="grid grid-cols-12 items-center gap-6 md:gap-10">
                  {/* LEFT TEXT (for RIGHT image slides) */}
                  <div className="col-span-12 md:col-span-5">
                    <div ref={textLRef} className="glass-strong rounded-3xl p-6 sm:p-8">
                      <p data-eye className="text-[11px] font-medium tracking-[0.22em] text-white/60" />
                      <h2 data-title className="mt-2 text-balance text-2xl font-semibold text-white sm:text-4xl" />
                      <p data-sub className="mt-3 text-pretty text-sm leading-relaxed text-white/72 sm:text-base" />
                    </div>
                  </div>

                  {/* RIGHT FRAME */}
                  <div className="col-span-12 md:col-span-7">
                    <div
                      ref={frameRRef}
                      className="relative ml-auto w-full max-w-3xl overflow-hidden rounded-[clamp(1rem,3vw,1.75rem)] border border-white/12 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)_inset] gpu aspect-[16/10] max-h-[min(52vh,680px)]"
                      style={{ transform: "translateZ(0)" }}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                        <CinematicImage ref={imgRRef} src={images[0]?.dataUrl ?? ""} alt={images[0]?.description?.trim() || "Slide 1"} priority className="opacity-100 object-cover" />
                        <div ref={overlayRRef} className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.05),transparent_58%)] opacity-65 gpu-opacity" />
                        <MotionOverlay />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 hidden md:block" />

                <div className="grid grid-cols-12 items-center gap-6 md:gap-10">
                  {/* LEFT FRAME */}
                  <div className="col-span-12 md:col-span-7">
                    <div
                      ref={frameLRef}
                      className="relative mr-auto w-full max-w-3xl overflow-hidden rounded-[clamp(1rem,3vw,1.75rem)] border border-white/12 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)_inset] gpu aspect-[16/10] max-h-[min(52vh,680px)]"
                      style={{ transform: "translateZ(0)" }}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                        <CinematicImage ref={imgLRef} src={images[1]?.dataUrl ?? images[0]?.dataUrl ?? ""} alt={images[1]?.description?.trim() || images[0]?.description?.trim() || "Slide 2"} priority className="opacity-100 object-cover" />
                        <div ref={overlayLRef} className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.05),transparent_58%)] opacity-65 gpu-opacity" />
                        <MotionOverlay />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT TEXT (for LEFT image slides) */}
                  <div className="col-span-12 md:col-span-5">
                    <div ref={textRRef} className="glass-strong rounded-3xl p-6 sm:p-8">
                      <p data-eye className="text-[11px] font-medium tracking-[0.22em] text-white/60" />
                      <h2 data-title className="mt-2 text-balance text-2xl font-semibold text-white sm:text-4xl" />
                      <p data-sub className="mt-3 text-pretty text-sm leading-relaxed text-white/72 sm:text-base" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress footer */}
            <div className="mt-auto shrink-0">
              <div className="glass-strong mx-auto max-w-xl rounded-3xl p-6 sm:p-8 pointer-events-auto">
                <div className="text-[11px] font-medium tracking-[0.18em] text-white/60">
                  {visibleIndex + 1} / {total} — برزنتيشن يمين/شمال
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div ref={progressRef} className="h-full w-full origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] will-change-transform gpu" />
                </div>
                <div className="mt-3 text-[11px] text-white/50">
                  انتقال {CROSS_DURATION.toFixed(2)}ث · ثبات ~{HOLD_DURATION.toFixed(2)}ث
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
