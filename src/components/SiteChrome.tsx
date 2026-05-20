"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "./AppNav";

/** Pages with their own toolbar — skip global nav to avoid stacked headers. */
function hasLocalToolbar(pathname: string) {
  return pathname === "/present" || pathname.startsWith("/project/");
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showGlobalNav = !hasLocalToolbar(pathname);

  return (
    <>
      {showGlobalNav && <AppNav />}
      {children}
    </>
  );
}
