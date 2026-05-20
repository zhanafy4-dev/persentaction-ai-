import type { PresentationScene } from "./types";
import {
  applyLayoutClass,
  ENGINE_LOOP_GAP,
  fillTextPanel,
  getMotionPreset,
  GPU_TWEEN,
  kenBurnsHold,
} from "./motion";

export type SceneRefs = {
  layoutRoot: HTMLElement;
  stage: HTMLElement;
  imageFrame: HTMLElement;
  image: HTMLImageElement;
  floatLayer: HTMLElement;
  textPanel: HTMLElement;
};

export function buildSceneTimeline(
  gsap: typeof import("gsap").default,
  scenes: PresentationScene[],
  refs: SceneRefs,
  hooks: {
    onIndexChange: (index: number) => void;
    onProgress: (progress: number) => void;
  },
) {
  const { crossDur, holdDur } = getMotionPreset();
  const { layoutRoot, imageFrame, image, floatLayer, textPanel } = refs;
  const n = scenes.length;

  gsap.set([imageFrame, textPanel], { opacity: 0, scale: 1.02, xPercent: 0, yPercent: 0, force3D: true });
  gsap.set(image, { scale: 1.02, xPercent: 0, yPercent: 0, force3D: true });
  gsap.set(floatLayer, { opacity: 0, scale: 0.88, xPercent: 8, yPercent: -6, force3D: true });

  const tl = gsap.timeline({
    defaults: { ease: "power1.inOut" },
    repeat: -1,
    repeatDelay: ENGINE_LOOP_GAP,
    onUpdate: () => hooks.onProgress(tl.progress()),
  });

  let cursor = 0;

  for (let i = 0; i < n; i++) {
    const scene = scenes[i]!;
    const crossStart = cursor;
    const kbDir: 1 | -1 = i % 2 === 0 ? 1 : -1;

    tl.call(() => {
      hooks.onIndexChange(i);
      applyLayoutClass(layoutRoot, scene.layout);
      image.src = scene.image.dataUrl;
      image.alt = scene.image.description?.trim() || `Slide ${i + 1}`;
      fillTextPanel(textPanel, scene.copy);
      gsap.set(image, { scale: 1.02, xPercent: 0, yPercent: 0, rotation: 0, force3D: true });
      if (scene.layout === "floating") {
        gsap.set(floatLayer, { opacity: 0.35, scale: 0.92, xPercent: 10, yPercent: -8, force3D: true });
      } else {
        gsap.set(floatLayer, { opacity: 0, force3D: true });
      }
    }, [], crossStart);

    tl.fromTo(
      imageFrame,
      { opacity: 0, scale: 1.04, yPercent: 3, force3D: true },
      { opacity: 1, scale: 1, yPercent: 0, duration: crossDur, ...GPU_TWEEN },
      crossStart,
    );

    tl.fromTo(
      textPanel,
      { opacity: 0, yPercent: 12, xPercent: scene.layout === "split-left" ? 4 : -4, force3D: true },
      { opacity: 1, yPercent: 0, xPercent: 0, duration: crossDur, ...GPU_TWEEN },
      crossStart + crossDur * 0.1,
    );

    if (scene.layout === "floating") {
      tl.fromTo(
        floatLayer,
        { opacity: 0, scale: 0.82, xPercent: 14, force3D: true },
        { opacity: 0.45, scale: 1, xPercent: 6, duration: crossDur * 1.1, ...GPU_TWEEN },
        crossStart + crossDur * 0.15,
      );
    }

    kenBurnsHold(gsap, image, holdDur, kbDir, crossStart + crossDur, tl);

    if (scene.layout === "floating") {
      tl.to(
        floatLayer,
        { xPercent: 2, yPercent: -4, duration: holdDur, ease: "none", force3D: true },
        crossStart + crossDur,
      );
    }

    tl.to(
      [imageFrame, textPanel],
      { opacity: 0, yPercent: -3, duration: crossDur * 0.75, force3D: true },
      crossStart + crossDur + holdDur - crossDur * 0.4,
    );

    cursor += crossDur + holdDur;
  }

  return tl;
}
