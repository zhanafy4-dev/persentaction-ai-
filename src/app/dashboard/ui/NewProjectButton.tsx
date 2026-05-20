"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewProjectButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProject() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "مشروع جديد" }),
      });
      const body = (await res.json().catch(() => null)) as { project?: { id: string }; error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "فشل إنشاء المشروع");
      const id = body?.project?.id;
      if (!id) throw new Error("لم يُرجع السيرفر معرف المشروع");
      router.push(`/project/${id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void createProject()}
        className="rounded-full bg-[linear-gradient(90deg,var(--accent0),var(--accent1))] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50 gpu"
      >
        {busy ? "جاري الإنشاء…" : "مشروع جديد"}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-300">{error}</p>}
    </div>
  );
}
