import Lenis from "lenis";

export type LenisInstance = Lenis;

export function createLenis(root?: HTMLElement | null) {
  return new Lenis({
    wrapper: root ?? undefined,
    content: root ? (root.querySelector("[data-lenis-content]") as HTMLElement | null) ?? undefined : undefined,
    lerp: 0.09,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.1,
    // syncTouch can fight scroll layers on some desktop trackpads; keep wheel smooth only.
    syncTouch: false,
    smoothWheel: true,
    autoResize: true,
    gestureOrientation: "vertical",
    orientation: "vertical",
  });
}

