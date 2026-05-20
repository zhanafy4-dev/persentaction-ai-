"use client";

export function MotionOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/70 gpu-opacity" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.20),transparent_55%)] opacity-70 gpu" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(0,212,255,0.15),transparent_60%)] opacity-80 gpu" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_85%,rgba(255,61,141,0.10),transparent_55%)] opacity-80 gpu" />
    </div>
  );
}

