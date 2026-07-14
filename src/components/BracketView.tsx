import { Trophy, Flag } from "lucide-react";
import { getRoundSequence } from "@/lib/bracket";
import DriverAvatar from "@/components/DriverAvatar";
import ChampionReveal from "@/components/ChampionReveal";
import type { Match } from "@/types/database";

function chunkPairs<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado, com linhas
 * conectando os confrontos de uma rodada ao confronto seguinte que eles
 * alimentam. A linha acende em ember quando os dois lados do confronto já
 * têm vencedor definido (a "rota" está decidida); fica na cor neutra do
 * tema enquanto o confronto está pendente.
 *
 * Por padrão tem scroll horizontal (pensado para celular). Quando usado
 * dentro de uma exportação de imagem (ExportableBracket), a prop
 * `scrollable={false}` desativa o scroll e deixa o conteúdo na largura
 * total, para que a captura inclua todas as rodadas — mesmo as que
 * estariam fora da tela visível.
 *
 * Quando a Final já tem vencedor definido, uma ficha de campeão ornamentada
 * é exibida ao final. Essa ficha é puramente visual — não corresponde a
 * nenhuma partida real no banco.
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

  const renderedRounds = roundOrder.filter(
    (r) => (matchesByRound.get(r)?.length ?? 0) > 0
  );

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
      <div className={`flex items-stretch gap-6 px-1 ${scrollable ? "min-w-max" : "w-max"}`}>
        {renderedRounds.map((roundName, roundIdx) => {
          const roundMatches = matchesByRound.get(roundName) ?? [];
          const isLastRound = roundIdx === renderedRounds.length - 1;
          const hasNextColumn = !isLastRound;
          const pairs = hasNextColumn
            ? chunkPairs(roundMatches, 2)
            : roundMatches.map((m) => [m]);

          return (
            <div key={roundName} className="flex flex-col gap-2 w-56 shrink-0">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Flag size={11} className="text-ember" />
                <h3 className="font-display text-xs tracking-wider text-ember">
                  {roundName.toUpperCase()}
                </h3>
              </div>
              <div className="flex flex-col gap-6 justify-around flex-1">
                {pairs.map((pair, pairIdx) => {
                  const bothWinners = pair.every((m) => !!m.winner_id);
                  const lineColor = bothWinners ? "#ff5a1f" : "#262629";

                  return (
                    <div key={pairIdx} className="relative flex flex-col gap-4">
                      {pair.map((m) => (
                        <div key={m.id} className="relative">
                          <BracketMatchCard match={m} />
                          {hasNextColumn && (
                            <div
                              className="absolute top-1/2 -right-6 w-6 h-px"
                              style={{
                                backgroundColor: m.winner_id ? "#ff5a1f" : "#262629",
                              }}
                            />
                          )}
                        </div>
                      ))}
                      {hasNextColumn && pair.length === 2 && (
                        <div
                          className="absolute -right-6 w-px"
                          style={{ top: "25%", bottom: "25%", backgroundColor: lineColor }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {champion && (
          <div className="flex flex-col justify-center shrink-0">
            <ChampionReveal gamertag={champion.gamertag} avatarUrl={champion.avatar_url} />
          </div>
        )}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match }) {
  const isCompleted = match.status === "COMPLETED" && !!match.winner_id;

  return (
    <div
      className={`bg-asphalt-panel border rounded-sm p-3 transition-colors ${
        isCompleted ? "border-ember/20" : "border-asphalt-border"
      }`}
    >
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
      className={`flex items-center gap-2.5 pl-1.5 border-l-2 transition-colors ${
        isWinner ? "text-checkpoint border-checkpoint" : "text-ink-faint border-transparent"
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
