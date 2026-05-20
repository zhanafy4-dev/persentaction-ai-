"use client";

export function GPUScene({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "relative w-full overflow-hidden perspective-1200",
        "isolate [contain:paint] [content-visibility:auto] [contain-intrinsic-size:1px_1000px]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

