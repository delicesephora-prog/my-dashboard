"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setLoading(false);

    if (res.ok) {
      router.replace(params.get("next") || "/");
      router.refresh();
    } else {
      setError("That PIN doesn't match. Try again.");
      setPin("");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-base-bg px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-xs animate-fade-in rounded-xl2 bg-base-surface p-8 shadow-sm"
      >
        <h1 className="mb-1 text-center text-xl font-semibold text-base-ink">
          Welcome back
        </h1>
        <p className="mb-6 text-center text-sm text-base-muted">
          Enter your PIN to open your dashboard
        </p>
        <input
          autoFocus
          inputMode="numeric"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mb-4 w-full rounded-xl2 border border-base-border bg-base-bg px-4 py-4 text-center text-2xl tracking-[0.5em] text-base-ink outline-none focus:border-work"
          placeholder="••••"
          maxLength={8}
        />
        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || pin.length === 0}
          className="w-full rounded-xl2 bg-base-ink py-3.5 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
