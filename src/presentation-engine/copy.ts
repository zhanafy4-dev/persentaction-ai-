import type { PresentationImage } from "./types";
import type { SceneCopy } from "./types";

export const PLACEHOLDER_COPY = "اكتب وصف للصورة من صفحة الرفع علشان يظهر هنا جنبها.";

export function buildSceneCopy(images: PresentationImage[]): SceneCopy[] {
  return images.map((img, i) => {
    const desc = img.description?.trim();
    return {
      eyebrow: `SLIDE ${String(i + 1).padStart(2, "0")}`,
      title: desc || PLACEHOLDER_COPY,
    };
  });
}
