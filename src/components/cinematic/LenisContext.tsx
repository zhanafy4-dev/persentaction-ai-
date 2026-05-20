"use client";

import { createContext, useContext } from "react";
import type { LenisInstance } from "@/lib/lenis";

const LenisCtx = createContext<LenisInstance | null>(null);

export function LenisProvider({ lenis, children }: { lenis: LenisInstance | null; children: React.ReactNode }) {
  return <LenisCtx.Provider value={lenis}>{children}</LenisCtx.Provider>;
}

export function useLenis() {
  return useContext(LenisCtx);
}

