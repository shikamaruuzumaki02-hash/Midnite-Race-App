"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";
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
  const [selectedTracks, setSelectedTracks] = useState<{ trackId: string; position: number }[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [round, setRound] = useState(defaultRound ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addTrack() {
    setSelectedTracks((prev) => [
      ...prev,
      { trackId: "", position: prev.length },
    ]);
  }

  function removeTrack(position: number) {
    setSelectedTracks((prev) =>
      prev
        .filter((t) => t.position !== position)
        .map((t, i) => ({ ...t, position: i }))
    );
  }

  function updateTrack(position: number, trackId: string) {
    setSelectedTracks((prev) =>
      prev.map((t) => (t.position === position ? { ...t, trackId } : t))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverAId || !driverBId || driverAId === driverBId) {
      setError("Selecione dois pilotos diferentes.");
      return;
    }

    const tracksWithValue = selectedTracks.filter((t) => t.trackId !== "");
    const hasDuplicateTracks =
      new Set(tracksWithValue.map((t) => t.trackId)).size !== tracksWithValue.length;
    if (hasDuplicateTracks) {
      setError("A mesma pista não pode aparecer mais de uma vez na corrida.");
      return;
    }

    setLoading(true);
    setError(null);

    // Insere a corrida primeiro
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert({
        tournament_id: tournamentId,
        driver_a_id: driverAId,
        driver_b_id: driverBId,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        round: round || null,
        status: "SCHEDULED",
      })
      .select("id")
      .single();

    if (matchError || !matchData) {
      setError(matchError?.message ?? "Erro ao agendar corrida.");
      setLoading(false);
      return;
    }

    // Depois insere as pistas vinculadas (só as que tiverem valor selecionado)
    if (tracksWithValue.length > 0) {
      const { error: tracksError } = await supabase.from("match_tracks").insert(
        tracksWithValue.map((t) => ({
          match_id: matchData.id,
          track_id: t.trackId,
          position: t.position,
        }))
      );

      if (tracksError) {
        setError(`Corrida criada, mas erro ao salvar pistas: ${tracksError.message}`);
        setLoading(false);
        return;
      }
    }

    setDriverAId("");
    setDriverBId("");
    setSelectedTracks([]);
    setScheduledAt("");
    setRound("");
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

      {/* Pistas em ordem */}
      <div className="space-y-2">
        {selectedTracks.map((t) => (
          <div key={t.position} className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-ink-faint w-14 shrink-0">
              Pista {t.position + 1}
            </span>
            <select
              value={t.trackId}
              onChange={(e) => updateTrack(t.position, e.target.value)}
              className="flex-1 bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
            >
              <option value="">Selecionar pista...</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeTrack(t.position)}
              className="text-ink-faint hover:text-danger transition-colors"
              aria-label="Remover pista"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addTrack}
          className="flex items-center gap-1.5 text-xs font-mono text-ink-faint hover:text-ember transition-colors"
        >
          <Plus size={13} />
          {selectedTracks.length === 0 ? "ADICIONAR PISTA (OPCIONAL)" : "ADICIONAR MAIS UMA PISTA"}
        </button>
      </div>

      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
      />

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
