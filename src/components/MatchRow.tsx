"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Trophy, Pencil } from "lucide-react";
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
  const [editing, setEditing] = useState(false);
  const [pendingWinnerId, setPendingWinnerId] = useState<string | null>(null);

  async function advanceBracketIfRoundComplete() {
    if (!match.round) return;

    const { data: roundMatches, error: fetchError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", match.tournament_id)
      .eq("round", match.round)
      .order("created_at", { ascending: true });

    if (fetchError || !roundMatches) return;

    if (!isRoundComplete(roundMatches as Match[])) return;

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

    if (!nextRoundName) return;

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

  // Corrige um resultado já lançado por engano. Só troca o vencedor entre
  // os dois pilotos que já disputaram essa corrida (não reabre a corrida
  // como "sem resultado"). Se o piloto errado já tinha avançado para a
  // próxima fase e essa próxima corrida ainda não foi disputada, ajusta o
  // confronto seguinte automaticamente. Se a próxima corrida já tem
  // resultado, bloqueia e pede para corrigir a fase seguinte primeiro.
  async function correctWinner(newWinnerId: string) {
    if (!match.winner_id || newWinnerId === match.winner_id) return;
    const oldWinnerId = match.winner_id;

    setLoading(true);
    setBracketError(null);

    if (format === "KNOCKOUT" && match.round) {
      const { count: entriesCount } = await supabase
        .from("tournament_entries")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", match.tournament_id);

      let nextRoundName: string | null = null;
      if (entriesCount) {
        try {
          nextRoundName = getNextRoundName(match.round, entriesCount);
        } catch {
          nextRoundName = null;
        }
      }

      if (nextRoundName) {
        const { data: nextMatches } = await supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", match.tournament_id)
          .eq("round", nextRoundName)
          .or(`driver_a_id.eq.${oldWinnerId},driver_b_id.eq.${oldWinnerId}`);

        const dependentMatch = nextMatches?.[0];

        if (dependentMatch) {
          if (dependentMatch.winner_id || dependentMatch.status === "COMPLETED") {
            setBracketError(
              "Esse piloto já avançou e a corrida da próxima fase já tem resultado lançado. Corrija primeiro o resultado dessa corrida seguinte antes de corrigir esta."
            );
            setLoading(false);
            return;
          }

          const field = dependentMatch.driver_a_id === oldWinnerId ? "driver_a_id" : "driver_b_id";
          const { error: cascadeError } = await supabase
            .from("matches")
            .update({ [field]: newWinnerId })
            .eq("id", dependentMatch.id);

          if (cascadeError) {
            setBracketError(`Erro ao atualizar a próxima fase: ${cascadeError.message}`);
            setLoading(false);
            return;
          }
        }
      }
    }

    if (format === "LEAGUE") {
      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("*")
        .eq("tournament_id", match.tournament_id)
        .in("driver_id", [match.driver_a_id, match.driver_b_id]);

      const oldWinnerEntry = entries?.find((e) => e.driver_id === oldWinnerId);
      const newWinnerEntry = entries?.find((e) => e.driver_id === newWinnerId);

      if (oldWinnerEntry) {
        await supabase
          .from("tournament_entries")
          .update({
            points: oldWinnerEntry.points - 3,
            wins: Math.max(0, oldWinnerEntry.wins - 1),
            losses: oldWinnerEntry.losses + 1,
          })
          .eq("id", oldWinnerEntry.id);
      }
      if (newWinnerEntry) {
        await supabase
          .from("tournament_entries")
          .update({
            points: newWinnerEntry.points + 3,
            wins: newWinnerEntry.wins + 1,
            losses: Math.max(0, newWinnerEntry.losses - 1),
          })
          .eq("id", newWinnerEntry.id);
      }
    }

    const { error: fixError } = await supabase
      .from("matches")
      .update({ winner_id: newWinnerId })
      .eq("id", match.id);

    if (fixError) {
      setBracketError(`Erro ao corrigir o resultado: ${fixError.message}`);
    }

    setLoading(false);
    setEditing(false);
    setPendingWinnerId(null);
    router.refresh();
  }

  const isCompleted = match.status === "COMPLETED";

  const matchTracks = match.match_tracks ?? [];
  const sortedTracks = [...matchTracks].sort((a, b) => a.position - b.position);
  const hasNewTracks = sortedTracks.length > 0;
  const hasLegacyTrack = !hasNewTracks && !!match.track;

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
      </div>

      {hasNewTracks && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
          {sortedTracks.map((mt, i) => (
            <span key={mt.id} className="flex items-center gap-1 font-mono text-[11px] text-ink-faint">
              <MapPin size={11} className="text-ember shrink-0" />
              <span className="text-ember">P{i + 1}:</span> {mt.track?.name ?? "—"}
            </span>
          ))}
        </div>
      )}
      {hasLegacyTrack && (
        <div className="flex items-center gap-1 font-mono text-[11px] text-ink-faint mb-3">
          <MapPin size={11} />
          {match.track!.name}
        </div>
      )}

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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-checkpoint font-mono text-[11px]">
              <Trophy size={12} />
              {match.winner_id
                ? `Vencedor: ${match.winner_id === match.driver_a_id ? match.driver_a?.gamertag : match.driver_b?.gamertag}`
                : "Empate"}
            </div>
            {match.winner_id && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-[10px] font-mono text-ink-faint hover:text-ember transition-colors"
              >
                <Pencil size={11} /> CORRIGIR
              </button>
            )}
          </div>

          {editing && !pendingWinnerId && (
            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={() =>
                  setPendingWinnerId(
                    match.winner_id === match.driver_a_id ? match.driver_b_id : match.driver_a_id
                  )
                }
                className="flex-1 px-3 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink hover:border-ember hover:text-ember transition-colors"
              >
                Na verdade venceu:{" "}
                {match.winner_id === match.driver_a_id
                  ? match.driver_b?.gamertag
                  : match.driver_a?.gamertag}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-2 text-xs font-mono text-ink-faint hover:text-ink transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {editing && pendingWinnerId && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-sm px-3 py-2">
              <span className="text-xs text-ink flex-1">
                Confirma que{" "}
                {pendingWinnerId === match.driver_a_id
                  ? match.driver_a?.gamertag
                  : match.driver_b?.gamertag}{" "}
                venceu essa corrida?
              </span>
              <button
                disabled={loading}
                onClick={() => correctWinner(pendingWinnerId)}
                className="px-3 py-1.5 bg-danger/20 border border-danger/50 rounded-sm text-xs font-mono text-danger hover:bg-danger/30 transition-colors"
              >
                SIM, CORRIGIR
              </button>
              <button
                onClick={() => setPendingWinnerId(null)}
                className="px-2 py-1.5 text-xs font-mono text-ink-faint hover:text-ink transition-colors"
              >
                Voltar
              </button>
            </div>
          )}
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
