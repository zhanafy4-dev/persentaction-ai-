import Link from "next/link";

type PageToolbarProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function PageToolbar({ title, subtitle, children }: PageToolbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,6,12,0.88)] pt-safe backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-xl bg-[linear-gradient(135deg,var(--accent0),var(--accent1))] gpu"
            aria-hidden
          />
          <div className="min-w-0 flex flex-col leading-tight">
            <div className="truncate text-sm font-semibold text-white sm:text-base">{title}</div>
            {subtitle ? <div className="truncate text-[11px] text-white/65">{subtitle}</div> : null}
          </div>
        </div>
        {children ? (
          <nav className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">{children}</nav>
        ) : null}
      </div>
    </header>
  );
}

export function ToolbarLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-4 py-2 text-xs font-semibold text-black sm:text-sm"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/85 transition-colors hover:bg-white/10 sm:text-sm"
    >
      {children}
    </Link>
  );
}
