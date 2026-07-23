"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Mapa } from "@/types/database";

const MAPAS: { value: Mapa; label: string }[] = [
  { value: "twin_palms", label: "Twin Palms" },
  { value: "mount_hidoro", label: "Mount Hidoro" },
  { value: "snap", label: "S.N.A.P." },
];

export default function NewTrackForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [mapa, setMapa] = useState<Mapa>("twin_palms");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("tracks").insert({
      name,
      type: type || null,
      description: description || null,
      mapa,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setType("");
    setDescription("");
    setMapa("twin_palms");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da pista (ex: Rota Industrial Sul)"
        required
        className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
      />
      <select
        value={mapa}
        onChange={(e) => setMapa(e.target.value as Mapa)}
        required
        className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
      >
        {MAPAS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Tipo (ex: circuito urbano, rodovia) — opcional"
        className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição — opcional"
        rows={3}
        className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors resize-none"
      />
      {error && <p className="text-danger text-xs font-mono">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
      >
        {loading ? "CADASTRANDO..." : "CADASTRAR PISTA"}
      </button>
    </form>
  );
}
