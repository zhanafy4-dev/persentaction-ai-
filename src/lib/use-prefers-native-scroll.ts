"use client";

import { useEffect, useState } from "react";

/** Touch / narrow viewports: native scroll is more reliable than Lenis. */
function prefersNativeScrollNow() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function usePrefersNativeScroll() {
  const [native, setNative] = useState(prefersNativeScrollNow);

  useEffect(() => {
    const mqNarrow = window.matchMedia("(max-width: 1023px)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const update = () => setNative(mqNarrow.matches || mqCoarse.matches);
    update();
    mqNarrow.addEventListener("change", update);
    mqCoarse.addEventListener("change", update);
    return () => {
      mqNarrow.removeEventListener("change", update);
      mqCoarse.removeEventListener("change", update);
    };
  }, []);

  return native;
}
