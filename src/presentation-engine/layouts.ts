import type { LayoutId, PresentationImage, PresentationScene } from "./types";
import { buildSceneCopy } from "./copy";

/** Rotating layout sequence — GPU-friendly, no randomness (stable timelines). */
const LAYOUT_CYCLE: LayoutId[] = [
  "split-right",
  "split-left",
  "fullscreen",
  "overlay-text",
  "floating",
];

export function layoutForIndex(index: number): LayoutId {
  return LAYOUT_CYCLE[index % LAYOUT_CYCLE.length]!;
}

export function buildPresentationScenes(images: PresentationImage[]): PresentationScene[] {
  const copies = buildSceneCopy(images);
  return images.map((image, index) => ({
    index,
    layout: layoutForIndex(index),
    image,
    copy: copies[index]!,
  }));
}

export function layoutLabel(layout: LayoutId): string {
  switch (layout) {
    case "split-right":
      return "Split · image right";
    case "split-left":
      return "Split · image left";
    case "fullscreen":
      return "Fullscreen";
    case "overlay-text":
      return "Overlay text";
    case "floating":
      return "Floating layers";
    default:
      return layout;
  }
}
