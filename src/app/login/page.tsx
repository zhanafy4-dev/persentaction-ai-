"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error ?? "Signup failed");
        }
      }

      const out = await signIn("credentials", { email, password, redirect: false });
      if (out?.error) throw new Error(out.error);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full px-6 py-16 flex items-center justify-center">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8">
        <div className="text-xs tracking-[0.24em] text-white/60">CINEMATIC STORY</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">{mode === "login" ? "Login" : "Create account"}</h1>
        <p className="mt-2 text-sm text-white/70">Email/password authentication (stored in Postgres).</p>

        <div className="mt-6 flex flex-col gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            type="password"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent0)] gpu"
          />

          {error && <div className="text-sm text-red-300">{error}</div>}

          <button
            disabled={busy}
            onClick={() => void onSubmit()}
            className="mt-2 rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50 gpu"
          >
            {busy ? "Working…" : mode === "login" ? "Login" : "Sign up"}
          </button>

          <button
            disabled={busy}
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/80 disabled:opacity-50 gpu"
          >
            {mode === "login" ? "Create account" : "I already have an account"}
          </button>
        </div>
      </div>
    </div>
  );
}

