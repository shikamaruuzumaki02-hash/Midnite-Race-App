import { Trophy } from "lucide-react";
import { getRoundSequence } from "@/lib/bracket";
import type { Match } from "@/types/database";

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado, com scroll
 * horizontal (pensado para celular). Agrupa as partidas por rodada na
 * ordem certa (Oitavas -> Quartas -> Semifinal -> Final, por exemplo).
 */
export default function BracketView({
  matches,
  numPlayers,
}: {
  matches: Match[];
  numPlayers: number;
}) {
  let roundOrder: string[];
  try {
    roundOrder = getRoundSequence(numPlayers);
  } catch {
    // Número de pilotos não corresponde a um tamanho de chave suportado
    // (pode acontecer se a chave ainda não foi gerada). Não renderiza nada.
    return null;
  }

  const matchesByRound = new Map<string, Match[]>();
  for (const round of roundOrder) {
    matchesByRound.set(
      round,
      matches.filter((m) => m.round === round)
    );
  }

  const hasAnyMatch = matches.length > 0;
  if (!hasAnyMatch) {
    return (
      <p className="text-sm text-ink-faint">
        A chave ainda não foi gerada para este torneio.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-4 px-1 min-w-max">
        {roundOrder.map((roundName) => {
          const roundMatches = matchesByRound.get(roundName) ?? [];
          if (roundMatches.length === 0) return null;

          return (
            <div key={roundName} className="flex flex-col gap-3 w-64 shrink-0">
              <h3 className="font-display text-xs tracking-wider text-ember text-center">
                {roundName.toUpperCase()}
              </h3>
              <div className="flex flex-col gap-4 justify-around flex-1">
                {roundMatches.map((m) => (
                  <BracketMatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match }) {
  const isCompleted = match.status === "COMPLETED" && !!match.winner_id;

  return (
    <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-3">
      <PlayerLine
        name={match.driver_a?.gamertag ?? "A definir"}
        isWinner={isCompleted && match.winner_id === match.driver_a_id}
      />
      <div className="h-px bg-asphalt-border my-1.5" />
      <PlayerLine
        name={match.driver_b?.gamertag ?? "A definir"}
        isWinner={isCompleted && match.winner_id === match.driver_b_id}
      />
    </div>
  );
}

function PlayerLine({ name, isWinner }: { name: string; isWinner: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-sm truncate ${
        isWinner ? "text-checkpoint font-medium" : "text-ink-faint"
      }`}
    >
      {isWinner && <Trophy size={12} className="shrink-0" />}
      <span className="truncate">{name}</span>
    </div>
  );
}
