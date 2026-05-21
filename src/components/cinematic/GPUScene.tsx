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
        "relative isolate w-full perspective-1200",
        "max-md:overflow-visible md:overflow-hidden",
        "max-md:[contain:none] md:[contain:paint]",
        "md:[content-visibility:auto] md:[contain-intrinsic-size:1px_1000px]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

