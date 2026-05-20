"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AppNav() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loggedIn = status === "authenticated" && !!session?.user;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white/90 gpu">
          Cinematic Story
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {loggedIn ? (
            <>
              <span className="hidden max-w-[140px] truncate text-xs text-white/60 sm:inline">
                {session?.user?.email}
              </span>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 sm:text-sm"
              >
                لوحة التحكم
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 sm:text-sm"
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-4 py-2 text-xs font-semibold text-black sm:text-sm"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
