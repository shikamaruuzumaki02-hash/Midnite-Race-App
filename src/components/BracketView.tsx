import { Trophy, Crown } from "lucide-react";
import { getRoundSequence } from "@/lib/bracket";
import DriverAvatar from "@/components/DriverAvatar";
import type { Match } from "@/types/database";

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado.
 *
 * Por padrão tem scroll horizontal (pensado para celular). Quando usado
 * dentro de uma exportação de imagem (ExportableBracket), a prop
 * `scrollable={false}` desativa o scroll e deixa o conteúdo na largura
 * total, para que a captura inclua todas as rodadas — mesmo as que
 * estariam fora da tela visível.
 *
 * Quando a Final já tem vencedor definido, uma coluna extra "Campeão" é
 * exibida ao final, mostrando apenas o piloto campeão. Essa coluna é
 * puramente visual — não corresponde a nenhuma partida real no banco.
 */
export default function BracketView({
  matches,
  numPlayers,
  scrollable = true,
}: {
  matches: Match[];
  numPlayers: number;
  scrollable?: boolean;
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

  const finalRoundName = roundOrder[roundOrder.length - 1];
  const finalMatches = matchesByRound.get(finalRoundName) ?? [];
  const finalMatch = finalMatches[0];
  const champion =
    finalMatch?.status === "COMPLETED" && finalMatch.winner_id
      ? finalMatch.winner_id === finalMatch.driver_a_id
        ? finalMatch.driver_a
        : finalMatch.driver_b
      : null;

  return (
    <div className={scrollable ? "overflow-x-auto pb-2 -mx-1" : "overflow-visible pb-2 -mx-1"}>
      <div
        className={`flex gap-4 px-1 ${scrollable ? "min-w-max" : "w-max"}`}
      >
        {roundOrder.map((roundName) => {
          const roundMatches = matchesByRound.get(roundName) ?? [];
          if (roundMatches.length === 0) return null;

          return (
            <div key={roundName} className="flex flex-col gap-3 w-56 shrink-0">
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

        {champion && (
          <div className="flex flex-col gap-3 w-56 shrink-0">
            <h3 className="font-display text-xs tracking-wider text-checkpoint text-center">
              CAMPEÃO
            </h3>
            <div className="flex flex-col justify-center flex-1">
              <div className="bg-asphalt-panel border border-checkpoint/40 rounded-sm p-4 flex flex-col items-center gap-3 text-center">
                <Crown size={20} className="text-checkpoint" />
                <DriverAvatar
                  gamertag={champion.gamertag}
                  avatarUrl={champion.avatar_url}
                  size="lg"
                />
                <span className="font-display text-lg font-semibold text-checkpoint leading-tight">
                  {champion.gamertag}
                </span>
              </div>
            </div>
          </div>
        )}
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
        avatarUrl={match.driver_a?.avatar_url}
        isWinner={isCompleted && match.winner_id === match.driver_a_id}
      />
      <div className="h-px bg-asphalt-border my-2" />
      <PlayerLine
        name={match.driver_b?.gamertag ?? "A definir"}
        avatarUrl={match.driver_b?.avatar_url}
        isWinner={isCompleted && match.winner_id === match.driver_b_id}
      />
    </div>
  );
}

function PlayerLine({
  name,
  avatarUrl,
  isWinner,
}: {
  name: string;
  avatarUrl?: string | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 ${
        isWinner ? "text-checkpoint" : "text-ink-faint"
      }`}
    >
      <DriverAvatar gamertag={name} avatarUrl={avatarUrl} size="lg" />
      <span className="font-display text-lg font-semibold truncate flex-1 leading-tight">
        {name}
      </span>
      {isWinner && <Trophy size={16} className="shrink-0" />}
    </div>
  );
}
