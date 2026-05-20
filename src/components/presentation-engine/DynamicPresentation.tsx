"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PresentationImage } from "@/presentation-engine/types";
import { CinematicImage } from "@/components/cinematic/CinematicImage";
import { GPUScene } from "@/components/cinematic/GPUScene";
import { MotionOverlay } from "@/components/cinematic/MotionOverlay";
import { DepthLayer } from "@/components/cinematic/DepthLayer";
import { ensureGsap } from "@/lib/gsap";
import {
  buildPresentationScenes,
  buildSceneTimeline,
  ENGINE_CROSS_DURATION,
  ENGINE_HOLD_DURATION,
  layoutLabel,
} from "@/presentation-engine";
import "./presentation-layouts.css";

type Props = {
  images: PresentationImage[];
};

/**
 * Dynamic presentation engine (isolated).
 * Classic ScrollSequence remains default; enable via variant="dynamic".
 */
export function DynamicPresentation({ images }: Props) {
  const scenes = useMemo(() => buildPresentationScenes(images), [images]);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [layoutName, setLayoutName] = useState("");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const layoutRootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const floatLayerRef = useRef<HTMLDivElement | null>(null);
  const textPanelRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<ReturnType<typeof import("gsap").default.timeline> | null>(null);
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
    if (!rootRef.current || images.length === 0) return;
    const layoutRoot = layoutRootRef.current;
    const stage = stageRef.current;
    const imageFrame = imageFrameRef.current;
    const image = imageRef.current;
    const floatLayer = floatLayerRef.current;
    const textPanel = textPanelRef.current;
    const bar = progressRef.current;
    if (!layoutRoot || !stage || !imageFrame || !image || !floatLayer || !textPanel) return;

    const ctx = gsap.context(() => {
      const setBar = bar ? gsap.quickSetter(bar, "scaleX") : null;

      const tl = buildSceneTimeline(gsap, scenes, {
        layoutRoot,
        stage,
        imageFrame,
        image,
        floatLayer,
        textPanel,
      }, {
        onIndexChange: (idx) => {
          setVisibleIndex(idx);
          setLayoutName(layoutLabel(scenes[idx]!.layout));
        },
        onProgress: (p) => setBar?.(p),
      });

      tlRef.current = tl;
      tl.play();

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
  }, [gsap, images, scenes]);

  const total = images.length;
  const first = images[0];

  return (
    <div ref={rootRef} className="w-full">
      <GPUScene className="border-b border-white/6">
        <div
          ref={stageRef}
          className="relative min-h-dvh w-full overflow-hidden gpu"
          data-lenis-prevent-touch
          data-lenis-prevent-wheel
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(6,8,18,0.95),rgba(5,6,12,1))]" />
            <div className="absolute inset-0 bg-[radial-gradient(720px_540px_at_15%_20%,rgba(124,92,255,0.14),transparent_55%)] gpu" />
            <div className="absolute inset-0 bg-[radial-gradient(700px_460px_at_88%_35%,rgba(0,212,255,0.10),transparent_55%)] gpu" />
          </div>

          <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col px-4 pb-10 pt-6 sm:px-8">
            <div className="flex shrink-0 flex-wrap justify-end gap-2 pointer-events-auto">
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-2 text-[10px] tracking-wide text-white/55">
                Dynamic engine
              </span>
              <button
                type="button"
                onClick={togglePlay}
                className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md gpu"
              >
                إيقاف / تشغيل
              </button>
              <button
                type="button"
                onClick={restart}
                className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md gpu"
              >
                من البداية
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center py-6">
              <div className="relative w-full max-w-6xl">
                <div
                  ref={layoutRootRef}
                  className="pe-layout-root"
                  data-layout="split-right"
                >
                  <div ref={textPanelRef} className="pe-text glass-strong rounded-3xl p-6 sm:p-8">
                    <p data-eye className="text-[11px] font-medium tracking-[0.22em] text-white/60" />
                    <h2 data-title className="mt-2 text-balance text-2xl font-semibold text-white sm:text-4xl" />
                    <p data-sub className="mt-3 text-pretty text-sm leading-relaxed text-white/72 sm:text-base" />
                  </div>

                  <div ref={imageFrameRef} className="pe-image-wrap gpu">
                    <DepthLayer>
                      <CinematicImage
                        ref={imageRef}
                        src={first?.dataUrl ?? ""}
                        alt={first?.description?.trim() || "Slide 1"}
                        priority
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.05),transparent_58%)] opacity-65 gpu-opacity" />
                      <MotionOverlay />
                    </DepthLayer>
                    <div ref={floatLayerRef} className="pe-float pe-float-card gpu" aria-hidden>
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(124,92,255,0.25),transparent)] gpu-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto shrink-0 pointer-events-auto">
              <div className="glass-strong mx-auto max-w-xl rounded-3xl p-6 sm:p-8">
                <div className="text-[11px] font-medium tracking-[0.18em] text-white/60">
                  {visibleIndex + 1} / {total}
                  {layoutName ? ` · ${layoutName}` : ""}
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    ref={progressRef}
                    className="h-full w-full origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] gpu"
                  />
                </div>
                <div className="mt-3 text-[11px] text-white/50">
                  انتقال {ENGINE_CROSS_DURATION.toFixed(2)}ث · ثبات ~{ENGINE_HOLD_DURATION.toFixed(2)}ث · GPU transforms
                </div>
              </div>
            </div>
          </div>
        </div>
      </GPUScene>
    </div>
  );
}
