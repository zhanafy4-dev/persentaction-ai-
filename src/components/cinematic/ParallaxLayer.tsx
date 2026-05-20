"use client";

import { forwardRef } from "react";

export const ParallaxLayer = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(
  function ParallaxLayer({ className, children }, ref) {
    return (
      <div
        ref={ref}
        className={[
          "absolute inset-0 gpu [backface-visibility:hidden] will-change-transform",
          className ?? "",
        ].join(" ")}
      >
        {children}
      </div>
    );
  },
);

