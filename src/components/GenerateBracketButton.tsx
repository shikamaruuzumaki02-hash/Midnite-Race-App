"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateFirstRoundPairs, getRoundSequence, validateEntryCount } from "@/lib/bracket";
import { Network } from "lucide-react";
import type { TournamentEntry } from "@/types/database";

type ManualPair = { driverAId: string; driverBId: string };
type Pair = { driverAId: string; driverBId: string };

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
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualPairs, setManualPairs] = useState<ManualPair[]>([]);

  const validationError = validateEntryCount(entries.length);

  function startManual() {
    const half = entries.length / 2;
    setManualPairs(Array.from({ length: half }, () => ({ driverAId: "", driverBId: "" })));
    setMode("manual");
    setError(null);
  }

  function updatePair(index: number, side: "driverAId" | "driverBId", driverId: string) {
    setManualPairs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [side]: driverId };
      return next;
    });
  }

  function usedDriverIds(excludeIndex: number, excludeSide: "driverAId" | "driverBId") {
    const used = new Set<string>();
    manualPairs.forEach((pair, i) => {
      (["driverAId", "driverBId"] as const).forEach((side) => {
        if (i === excludeIndex && side === excludeSide) return;
        if (pair[side]) used.add(pair[side]);
      });
    });
    return used;
  }

  async function insertPairs(pairs: Pair[]) {
    setError(null);
    setLoading(true);

    try {
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

  function handleAutoGenerate() {
    if (validationError) {
      setError(validationError);
      return;
    }
    const pairs = generateFirstRoundPairs(entries);
    insertPairs(pairs);
  }

  function handleManualGenerate() {
    if (validationError) {
      setError(validationError);
      return;
    }

    const allFilled = manualPairs.every((p) => p.driverAId && p.driverBId);
    if (!allFilled) {
      setError("Preencha todos os confrontos antes de gerar a chave.");
      return;
    }

    const allIds = manualPairs.flatMap((p) => [p.driverAId, p.driverBId]);
    const uniqueIds = new Set(allIds);
    if (uniqueIds.size !== allIds.length) {
      setError("Cada piloto só pode aparecer em um confronto.");
      return;
    }

    insertPairs(manualPairs);
  }

  if (bracketGenerated) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-ink-faint">
        <Network size={14} className="text-checkpoint" />
        Chave já gerada para este torneio.
      </div>
    );
  }

  if (mode === "manual") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-ink-faint">
          Monte os confrontos da primeira rodada manualmente. Cada piloto só pode aparecer uma vez.
        </p>
        {manualPairs.map((pair, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={pair.driverAId}
              onChange={(e) => updatePair(i, "driverAId", e.target.value)}
              className="flex-1 bg-asphalt-card border border-asphalt-border rounded-sm px-2 py-2 text-xs text-ink"
            >
              <option value="">Piloto A</option>
              {entries
                .filter((en) => !usedDriverIds(i, "driverAId").has(en.driver_id))
                .map((en) => (
                  <option key={en.driver_id} value={en.driver_id}>
                    {en.driver?.gamertag}
                  </option>
                ))}
            </select>
            <span className="text-[10px] text-ink-dim font-mono">VS</span>
            <select
              value={pair.driverBId}
              onChange={(e) => updatePair(i, "driverBId", e.target.value)}
              className="flex-1 bg-asphalt-card border border-asphalt-border rounded-sm px-2 py-2 text-xs text-ink"
            >
              <option value="">Piloto B</option>
              {entries
                .filter((en) => !usedDriverIds(i, "driverBId").has(en.driver_id))
                .map((en) => (
                  <option key={en.driver_id} value={en.driver_id}>
                    {en.driver?.gamertag}
                  </option>
                ))}
            </select>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            onClick={handleManualGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 border border-ember/40 rounded-sm text-sm font-mono text-ember hover:bg-ember/20 transition-colors disabled:opacity-50"
          >
            <Network size={15} />
            {loading ? "GERANDO..." : "CONFIRMAR CHAVE MANUAL"}
          </button>
          <button
            onClick={() => setMode("auto")}
            disabled={loading}
            className="px-3 py-2.5 text-xs font-mono text-ink-faint hover:text-ink transition-colors"
          >
            Cancelar
          </button>
        </div>
        {error && (
          <p className="text-xs text-danger border border-danger/30 bg-danger/10 rounded-sm px-3 py-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAutoGenerate}
          disabled={loading || !!validationError}
          className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 border border-ember/40 rounded-sm text-sm font-mono text-ember hover:bg-ember/20 transition-colors disabled:opacity-50"
        >
          <Network size={15} />
          {loading ? "GERANDO CHAVE..." : "GERAR CHAVE AUTOMÁTICA"}
        </button>
        <button
          onClick={startManual}
          disabled={loading || !!validationError}
          className="flex items-center gap-2 px-4 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm text-sm font-mono text-ink-faint hover:text-ink transition-colors disabled:opacity-50"
        >
          MONTAR CHAVE MANUALMENTE
        </button>
      </div>
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
