"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Crown } from "lucide-react";
import type { TournamentEntry } from "@/types/database";

export default function CrownChampionForm({
  tournamentId,
  entries,
}: {
  tournamentId: string;
  entries: TournamentEntry[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [driverId, setDriverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverId) return;
    setLoading(true);
    setError(null);

    const { error: champError } = await supabase.from("champions").insert({
      tournament_id: tournamentId,
      driver_id: driverId,
    });

    if (champError) {
      setError(champError.message);
      setLoading(false);
      return;
    }

    const { error: statusError } = await supabase
      .from("tournaments")
      .update({ status: "FINISHED" })
      .eq("id", tournamentId);

    if (statusError) {
      setError(statusError.message);
      setLoading(false);
      return;
    }

    router.push("/hall-dos-campeoes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-asphalt-panel border border-ember/30 rounded-sm p-5 space-y-3">
      <div className="flex items-center gap-2 text-ember font-display text-sm tracking-wide">
        <Crown size={16} />
        ENCERRAR E COROAR CAMPEÃO
      </div>
      <p className="text-xs text-ink-faint">
        Essa ação marca o torneio como finalizado e adiciona o piloto escolhido ao Hall dos Campeões. Não pode ser desfeita pelo site.
      </p>
      <div className="flex gap-2">
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="flex-1 bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        >
          <option value="">Selecione o campeão...</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.driver_id}>
              {entry.driver?.gamertag}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !driverId}
          className="px-4 py-2.5 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          COROAR
        </button>
      </div>
      {error && <p className="text-danger text-xs font-mono">{error}</p>}
    </form>
  );
}
