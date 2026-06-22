"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl tracking-wider text-ink">
            MIDNITE<span className="text-ember">BR</span>
          </div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-ink-faint mt-1">
            SSR — STREET SERIES
          </div>
        </div>

        <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-6">
          <div className="flex gap-1 mb-6 p-1 bg-asphalt-card rounded-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-display tracking-wide rounded-sm transition-colors ${
                mode === "login" ? "bg-ember text-asphalt" : "text-ink-muted"
              }`}
            >
              ENTRAR
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-display tracking-wide rounded-sm transition-colors ${
                mode === "signup" ? "bg-ember text-asphalt" : "text-ink-muted"
              }`}
            >
              CRIAR CONTA
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
                  NOME OU GAMERTAG
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
              />
            </div>

            {error && (
              <p className="text-danger text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-ember text-asphalt font-display tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
            >
              {loading ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-faint text-xs mt-6 font-mono">
          Novas contas entram como Visualizador.
        </p>
      </div>
    </div>
  );
}
