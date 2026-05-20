export type PresentationImage = {
  id: string;
  name: string;
  dataUrl: string;
  description?: string;
};

export type LayoutId =
  | "split-right"
  | "split-left"
  | "fullscreen"
  | "overlay-text"
  | "floating";

export type SceneCopy = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export type PresentationScene = {
  index: number;
  layout: LayoutId;
  image: PresentationImage;
  copy: SceneCopy;
};
