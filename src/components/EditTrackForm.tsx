"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, X, Pencil } from "lucide-react";
import type { Track, Mapa } from "@/types/database";

const MAPAS: { value: Mapa; label: string }[] = [
  { value: "twin_palms", label: "Twin Palms" },
  { value: "mount_hidoro", label: "Mount Hidoro" },
  { value: "snap", label: "S.N.A.P." },
];

export default function EditTrackForm({ track }: { track: Track }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(track.name);
  const [type, setType] = useState(track.type ?? "");
  const [description, setDescription] = useState(track.description ?? "");
  const [mapa, setMapa] = useState<Mapa>(track.mapa);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function cancelEdit() {
    setName(track.name);
    setType(track.type ?? "");
    setDescription(track.description ?? "");
    setMapa(track.mapa);
    setError(null);
    setEditing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("tracks")
      .update({
        name,
        type: type || null,
        description: description || null,
        mapa,
      })
      .eq("id", track.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs font-mono text-ink-faint hover:text-ember transition-colors"
      >
        <Pencil size={12} />
        EDITAR
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da pista"
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
        placeholder="Tipo — opcional"
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-ember text-asphalt font-display text-xs tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              SALVANDO...
            </>
          ) : (
            <>
              <Save size={12} />
              SALVAR
            </>
          )}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-asphalt-card border border-asphalt-border font-mono text-xs text-ink-faint rounded-sm hover:text-ink transition-colors disabled:opacity-50"
        >
          <X size={12} />
          CANCELAR
        </button>
      </div>
    </form>
  );
}
