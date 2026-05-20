"use client";

import { forwardRef } from "react";

export type CinematicImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

export const CinematicImage = forwardRef<HTMLImageElement, CinematicImageProps>(function CinematicImage(
  { src, alt, priority, className },
  ref,
) {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={[
        "absolute inset-0 h-full w-full object-cover gpu",
        "will-change-transform [backface-visibility:hidden]",
        className ?? "",
      ].join(" ")}
    />
  );
});

