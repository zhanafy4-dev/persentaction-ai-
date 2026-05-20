"use client";

export function DepthLayer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={["absolute inset-0 gpu [transform-style:preserve-3d]", className ?? ""].join(" ")}>
      {children}
    </div>
  );
}

