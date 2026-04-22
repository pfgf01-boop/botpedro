"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = getSupabaseBrowser();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-secondary-500/15 text-secondary-300 p-4 text-sm">
          Link enviado para <strong>{email}</strong>. Verifique sua caixa de
          entrada (e o spam).
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-ghost w-full"
        >
          Reenviar para outro email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs text-ink-muted">
          Email corporativo
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@farmhome.com.br"
          className="input"
        />
      </div>

      {error && (
        <div className="rounded-md bg-danger-500/15 text-danger-400 p-3 text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary w-full"
      >
        {status === "loading" ? "Enviando..." : "Enviar link mágico"}
      </button>
    </form>
  );
}
