"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateFirstRoundPairs, getRoundSequence, validateEntryCount } from "@/lib/bracket";
import { Network } from "lucide-react";
import type { TournamentEntry } from "@/types/database";

export default function GenerateBracketButton({
  tournamentId,
  entries,
  bracketGenerated,
}: {
  tournamentId: string;
  entries: TournamentEntry[];
  bracketGenerated: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);

    const validationError = validateEntryCount(entries.length);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const pairs = generateFirstRoundPairs(entries);
      const roundName = getRoundSequence(entries.length)[0];

      const rowsToInsert = pairs.map((pair) => ({
        tournament_id: tournamentId,
        round: roundName,
        driver_a_id: pair.driverAId,
        driver_b_id: pair.driverBId,
        status: "SCHEDULED",
      }));

      const { error: insertError } = await supabase.from("matches").insert(rowsToInsert);

      if (insertError) {
        setError(`Erro ao criar as partidas: ${insertError.message}`);
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ bracket_generated: true })
        .eq("id", tournamentId);

      if (updateError) {
        setError(`Chave criada, mas houve um erro ao marcar o torneio: ${updateError.message}`);
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao gerar a chave.");
    } finally {
      setLoading(false);
    }
  }

  if (bracketGenerated) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-ink-faint">
        <Network size={14} className="text-checkpoint" />
        Chave já gerada para este torneio.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 border border-ember/40 rounded-sm text-sm font-mono text-ember hover:bg-ember/20 transition-colors disabled:opacity-50"
      >
        <Network size={15} />
        {loading ? "GERANDO CHAVE..." : "GERAR CHAVE DE MATA-MATA"}
      </button>
      <p className="text-xs text-ink-faint">
        {entries.length} piloto{entries.length !== 1 ? "s" : ""} inscrito
        {entries.length !== 1 ? "s" : ""}. Necessário 4, 8 ou 16 para gerar a chave.
      </p>
      {error && (
        <p className="text-xs text-danger border border-danger/30 bg-danger/10 rounded-sm px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
