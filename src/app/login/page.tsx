"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const signupRes = await fetch("/api/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const signupBody = (await signupRes.json().catch(() => null)) as { error?: string } | null;
        if (!signupRes.ok) {
          throw new Error(signupBody?.error ?? `Signup failed (${signupRes.status})`);
        }
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const loginBody = (await loginRes.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!loginRes.ok) {
        throw new Error(loginBody?.error ?? `Login failed (${loginRes.status})`);
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10 pb-safe sm:px-6 sm:py-16">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8">
        <div className="text-xs tracking-[0.24em] text-white/60">CINEMATIC STORY</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          بعد الدخول: لوحة التحكم → مشروع → Render MP4 → تحميل الفيديو.
        </p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={(ev) => void onSubmit(ev)}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            required
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
          />

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50 gpu"
          >
            {busy ? "جاري التحميل…" : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError(null);
              setMode((m) => (m === "login" ? "signup" : "login"));
            }}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/80 disabled:opacity-50 gpu"
          >
            {mode === "login" ? "مستخدم جديد؟ إنشاء حساب" : "لدي حساب — تسجيل دخول"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/50">
          مشكلة؟ افتح{" "}
          <a href="/api/health" className="underline" target="_blank" rel="noreferrer">
            /api/health
          </a>
        </p>
      </div>
    </div>
  );
}
