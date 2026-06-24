"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TournamentEntry, Track } from "@/types/database";

export default function NewMatchForm({
  tournamentId,
  entries,
  tracks,
  defaultRound,
}: {
  tournamentId: string;
  entries: TournamentEntry[];
  tracks: Track[];
  defaultRound?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [driverAId, setDriverAId] = useState("");
  const [driverBId, setDriverBId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [round, setRound] = useState(defaultRound ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverAId || !driverBId || driverAId === driverBId) {
      setError("Selecione dois pilotos diferentes.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("matches").insert({
      tournament_id: tournamentId,
      driver_a_id: driverAId,
      driver_b_id: driverBId,
      track_id: trackId || null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      round: round || null,
      status: "SCHEDULED",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDriverAId("");
    setDriverBId("");
    setTrackId("");
    setScheduledAt("");
    setLoading(false);
    router.refresh();
  }

  if (entries.length < 2) {
    return (
      <p className="text-sm text-ink-faint">
        É preciso ter pelo menos 2 pilotos inscritos no torneio para agendar uma corrida.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={driverAId}
          onChange={(e) => setDriverAId(e.target.value)}
          className="bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        >
          <option value="">Piloto A...</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.driver_id}>
              {entry.driver?.gamertag}
            </option>
          ))}
        </select>
        <select
          value={driverBId}
          onChange={(e) => setDriverBId(e.target.value)}
          className="bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        >
          <option value="">Piloto B...</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.driver_id}>
              {entry.driver?.gamertag}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          className="bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        >
          <option value="">Pista (opcional)...</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        />
      </div>

      <input
        type="text"
        value={round}
        onChange={(e) => setRound(e.target.value)}
        placeholder="Rodada / etapa (ex: Oitavas, Rodada 3) — opcional"
        className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
      />

      {error && <p className="text-danger text-xs font-mono">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
      >
        {loading ? "AGENDANDO..." : "AGENDAR CORRIDA"}
      </button>
    </form>
  );
}
