"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Driver } from "@/types/database";

export default function AddEntryForm({
  tournamentId,
  availableDrivers,
}: {
  tournamentId: string;
  availableDrivers: Driver[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [driverId, setDriverId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverId) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("tournament_entries")
      .insert({ tournament_id: tournamentId, driver_id: driverId });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDriverId("");
    setLoading(false);
    router.refresh();
  }

  if (availableDrivers.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        Todos os pilotos cadastrados já estão neste torneio, ou nenhum piloto foi cadastrado ainda.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="flex-1 bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
      >
        <option value="">Selecione um piloto...</option>
        {availableDrivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.gamertag}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !driverId}
        className="px-4 py-2.5 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        ADICIONAR
      </button>
      {error && <p className="text-danger text-xs font-mono">{error}</p>}
    </form>
  );
}
