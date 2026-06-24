"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Trophy } from "lucide-react";
import { getNextRoundName, isRoundComplete, pairWinnersForNextRound } from "@/lib/bracket";
import type { Match, TournamentFormat } from "@/types/database";

export default function MatchRow({
  match,
  format,
}: {
  match: Match;
  format: TournamentFormat;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);

  async function advanceBracketIfRoundComplete() {
    if (!match.round) return;

    // Busca todas as partidas da mesma rodada deste torneio, na ordem em que
    // foram criadas (mesma ordem de geração, importante para o pareamento correto).
    const { data: roundMatches, error: fetchError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", match.tournament_id)
      .eq("round", match.round)
      .order("created_at", { ascending: true });

    if (fetchError || !roundMatches) return;

    if (!isRoundComplete(roundMatches as Match[])) return;

    // Conta quantos pilotos tinha o torneio originalmente (inscritos),
    // para saber qual o próximo nome de rodada.
    const { count } = await supabase
      .from("tournament_entries")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", match.tournament_id);

    if (!count) return;

    let nextRoundName: string | null;
    try {
      nextRoundName = getNextRoundName(match.round, count);
    } catch {
      return;
    }

    // Se já era a Final, não há próxima rodada a gerar.
    if (!nextRoundName) return;

    // Evita duplicar: se a próxima rodada já existe, não gera de novo.
    const { data: existingNextRound } = await supabase
      .from("matches")
      .select("id")
      .eq("tournament_id", match.tournament_id)
      .eq("round", nextRoundName)
      .limit(1);

    if (existingNextRound && existingNextRound.length > 0) return;

    try {
      const pairs = pairWinnersForNextRound(roundMatches as Match[]);

      const rowsToInsert = pairs.map((pair) => ({
        tournament_id: match.tournament_id,
        round: nextRoundName,
        driver_a_id: pair.driverAId,
        driver_b_id: pair.driverBId,
        status: "SCHEDULED",
      }));

      const { error: insertError } = await supabase.from("matches").insert(rowsToInsert);
      if (insertError) {
        setBracketError(`Rodada concluída, mas houve erro ao gerar a próxima: ${insertError.message}`);
      }
    } catch (err) {
      setBracketError(err instanceof Error ? err.message : "Erro ao avançar a chave.");
    }
  }

  async function recordWinner(winnerId: string) {
    setLoading(true);
    setBracketError(null);

    const loserId = winnerId === match.driver_a_id ? match.driver_b_id : match.driver_a_id;

    await supabase
      .from("matches")
      .update({ winner_id: winnerId, status: "COMPLETED" })
      .eq("id", match.id);

    if (format === "LEAGUE") {
      // Busca as entries dos dois pilotos neste torneio para atualizar pontos/vitórias/derrotas
      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("*")
        .eq("tournament_id", match.tournament_id)
        .in("driver_id", [match.driver_a_id, match.driver_b_id]);

      const winnerEntry = entries?.find((e) => e.driver_id === winnerId);
      const loserEntry = entries?.find((e) => e.driver_id === loserId);

      if (winnerEntry) {
        await supabase
          .from("tournament_entries")
          .update({ points: winnerEntry.points + 3, wins: winnerEntry.wins + 1 })
          .eq("id", winnerEntry.id);
      }
      if (loserEntry) {
        await supabase
          .from("tournament_entries")
          .update({ losses: loserEntry.losses + 1 })
          .eq("id", loserEntry.id);
      }
    }

    if (format === "KNOCKOUT") {
      await advanceBracketIfRoundComplete();
    }

    setLoading(false);
    setShowResult(false);
    router.refresh();
  }

  async function recordDraw() {
    setLoading(true);

    await supabase.from("matches").update({ status: "COMPLETED" }).eq("id", match.id);

    if (format === "LEAGUE") {
      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("*")
        .eq("tournament_id", match.tournament_id)
        .in("driver_id", [match.driver_a_id, match.driver_b_id]);

      for (const entry of entries ?? []) {
        await supabase
          .from("tournament_entries")
          .update({ points: entry.points + 1, draws: entry.draws + 1 })
          .eq("id", entry.id);
      }
    }

    setLoading(false);
    setShowResult(false);
    router.refresh();
  }

  const isCompleted = match.status === "COMPLETED";

  return (
    <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-4">
      <div className="flex items-center justify-between font-mono text-[11px] text-ink-faint mb-3">
        <span>
          {match.scheduled_at
            ? new Date(match.scheduled_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Data a definir"}
          {match.round && ` · ${match.round}`}
        </span>
        {match.track && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {match.track.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span
          className={`font-display text-sm truncate max-w-[40%] ${
            match.winner_id === match.driver_a_id ? "text-checkpoint" : "text-ink"
          }`}
        >
          {match.driver_a?.gamertag}
        </span>
        <span className="font-display text-xs text-ink-dim px-2">VS</span>
        <span
          className={`font-display text-sm truncate max-w-[40%] text-right ${
            match.winner_id === match.driver_b_id ? "text-checkpoint" : "text-ink"
          }`}
        >
          {match.driver_b?.gamertag}
        </span>
      </div>

      {isCompleted ? (
        <div className="flex items-center gap-1.5 text-checkpoint font-mono text-[11px]">
          <Trophy size={12} />
          {match.winner_id
            ? `Vencedor: ${match.winner_id === match.driver_a_id ? match.driver_a?.gamertag : match.driver_b?.gamertag}`
            : "Empate"}
        </div>
      ) : showResult ? (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={loading}
            onClick={() => recordWinner(match.driver_a_id)}
            className="flex-1 px-3 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink hover:border-checkpoint hover:text-checkpoint transition-colors"
          >
            {match.driver_a?.gamertag} VENCEU
          </button>
          <button
            disabled={loading}
            onClick={() => recordWinner(match.driver_b_id)}
            className="flex-1 px-3 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink hover:border-checkpoint hover:text-checkpoint transition-colors"
          >
            {match.driver_b?.gamertag} VENCEU
          </button>
          {format === "LEAGUE" && (
            <button
              disabled={loading}
              onClick={recordDraw}
              className="px-3 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              EMPATE
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowResult(true)}
          className="text-xs font-mono text-ember hover:text-ember-light transition-colors"
        >
          LANÇAR RESULTADO →
        </button>
      )}

      {bracketError && (
        <p className="mt-3 text-xs text-danger border border-danger/30 bg-danger/10 rounded-sm px-3 py-2">
          {bracketError}
        </p>
      )}
    </div>
  );
}
