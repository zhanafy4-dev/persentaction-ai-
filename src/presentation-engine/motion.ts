import type gsap from "gsap";

/** Shared timing — matches classic presentation feel. */
export const ENGINE_CROSS_DURATION = 1.05;
export const ENGINE_HOLD_RATIO = 3.2;
export const ENGINE_HOLD_DURATION = Number((ENGINE_CROSS_DURATION * ENGINE_HOLD_RATIO).toFixed(2));
export const ENGINE_LOOP_GAP = Number((ENGINE_CROSS_DURATION * 1.1).toFixed(2));

export type MotionPreset = {
  crossDur: number;
  holdDur: number;
};

export function getMotionPreset(): MotionPreset {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  return {
    crossDur: reduce ? 0.2 : ENGINE_CROSS_DURATION,
    holdDur: reduce ? 0.6 : ENGINE_HOLD_DURATION,
  };
}

/** GPU-only tween defaults */
export const GPU_TWEEN = {
  force3D: true,
  ease: "power2.out" as const,
};

export function applyLayoutClass(root: HTMLElement, layout: string) {
  root.dataset.layout = layout;
}

export function fillTextPanel(
  node: HTMLElement | null,
  copy: { eyebrow: string; title: string; subtitle?: string },
) {
  if (!node) return;
  const eye = node.querySelector<HTMLElement>("[data-eye]");
  const title = node.querySelector<HTMLElement>("[data-title]");
  const sub = node.querySelector<HTMLElement>("[data-sub]");
  if (eye) eye.textContent = copy.eyebrow;
  if (title) title.textContent = copy.title;
  if (sub) sub.textContent = copy.subtitle ?? "";
}

export function kenBurnsHold(
  gsap: typeof import("gsap").default,
  img: HTMLElement,
  holdDur: number,
  direction: 1 | -1,
  at: number,
  tl: gsap.core.Timeline,
) {
  tl.to(
    img,
    {
      scale: 1.06,
      xPercent: 0.6 * direction,
      yPercent: -0.4 * direction,
      duration: holdDur,
      ease: "none",
      force3D: true,
    },
    at,
  );
}
