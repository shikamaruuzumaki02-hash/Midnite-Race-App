"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewTournamentForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [format, setFormat] = useState<"LEAGUE" | "KNOCKOUT">("LEAGUE");
  const [season, setSeason] = useState("2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const { data, error } = await supabase
      .from("tournaments")
      .insert({ name, slug, format, season, status: "UPCOMING" })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/torneios/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
          NOME DA COMPETIÇÃO
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Circuito Noturno V"
          required
          className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
          FORMATO
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormat("LEAGUE")}
            className={`flex-1 py-2.5 text-sm font-display tracking-wide rounded-sm transition-colors ${
              format === "LEAGUE" ? "bg-ember text-asphalt" : "bg-asphalt-card text-ink-muted"
            }`}
          >
            PONTOS CORRIDOS
          </button>
          <button
            type="button"
            onClick={() => setFormat("KNOCKOUT")}
            className={`flex-1 py-2.5 text-sm font-display tracking-wide rounded-sm transition-colors ${
              format === "KNOCKOUT" ? "bg-ember text-asphalt" : "bg-asphalt-card text-ink-muted"
            }`}
          >
            MATA-MATA
          </button>
        </div>
      </div>

      <div>
        <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
          TEMPORADA
        </label>
        <input
          type="text"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        />
      </div>

      {error && <p className="text-danger text-xs font-mono">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-ember text-asphalt font-display tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
      >
        {loading ? "CRIANDO..." : "CRIAR COMPETIÇÃO"}
      </button>
    </form>
  );
}
