import { Trophy, Flag } from "lucide-react";
import { getRoundSequence } from "@/lib/bracket";
import DriverAvatar from "@/components/DriverAvatar";
import ChampionReveal from "@/components/ChampionReveal";
import type { Match } from "@/types/database";

const LINE_PENDING = "#4a4a52";
const LINE_DECIDED = "#ff5a1f";

function chunkPairs<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado, conectadas por
 * trilhas (linhas em ângulo reto, como um circuito). Cada trilha nasce no
 * meio de um confronto e termina na próxima fase — mesmo que essa próxima
 * fase ainda não tenha sido gerada no banco (a topologia da chave é sempre
 * conhecida a partir de `numPlayers`, então a trilha aparece desde já,
 * terminando em um nó "aguardando"). A trilha acende em ember quando o
 * confronto de origem já tem vencedor definido.
 *
 * Por padrão tem scroll horizontal (pensado para celular). Quando usado
 * dentro de uma exportação de imagem (ExportableBracket), a prop
 * `scrollable={false}` desativa o scroll e deixa o conteúdo na largura
 * total, para que a captura inclua todas as rodadas.
 *
 * Quando a Final já tem vencedor definido, uma ficha de campeão ornamentada
 * é exibida ao final, conectada à Final pela mesma trilha.
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
  const trueFinalRoundName = roundOrder[roundOrder.length - 1];

  const finalMatches = matchesByRound.get(trueFinalRoundName) ?? [];
  const finalMatch = finalMatches[0];
  const champion =
    finalMatch?.status === "COMPLETED" && finalMatch.winner_id
      ? finalMatch.winner_id === finalMatch.driver_a_id
        ? finalMatch.driver_a
        : finalMatch.driver_b
      : null;

  return (
    <div className="relative">
      {/* Ambiente sutil por trás da chave, pra não ficar chapado */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(255,90,31,0.08), transparent), radial-gradient(ellipse 50% 30% at 80% 90%, rgba(255,90,31,0.05), transparent)",
        }}
      />

      <div className={scrollable ? "overflow-x-auto pb-2 -mx-1" : "overflow-visible pb-2 -mx-1"}>
        <div className={`flex items-stretch gap-10 px-1 ${scrollable ? "min-w-max" : "w-max"}`}>
          {renderedRounds.map((roundName) => {
            const roundMatches = matchesByRound.get(roundName) ?? [];
            const advancesToNextRound = roundName !== trueFinalRoundName;
            const isFinalRound = roundName === trueFinalRoundName;
            const pairs = advancesToNextRound
              ? chunkPairs(roundMatches, 2)
              : roundMatches.map((m) => [m]);

            return (
              <div key={roundName} className="flex flex-col gap-3 w-56 shrink-0">
                <div className="self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-ember/15 border border-ember/30">
                  <Flag size={11} className="text-ember" />
                  <h3 className="font-display text-xs tracking-wider text-ember">
                    {roundName.toUpperCase()}
                  </h3>
                </div>

                <div className="flex flex-col gap-6 justify-around flex-1">
                  {pairs.map((pair, pairIdx) => {
                    const bothDecided = pair.length === 2 && pair.every((m) => !!m.winner_id);
                    const vLineColor = bothDecided ? LINE_DECIDED : LINE_PENDING;

                    return (
                      <div key={pairIdx} className="relative flex flex-col gap-6">
                        {pair.map((m) => {
                          const decided = !!m.winner_id;
                          return (
                            <div key={m.id} className="relative">
                              <BracketMatchCard match={m} />

                              {/* trilha saindo do card até a linha vertical do par */}
                              {advancesToNextRound && (
                                <div
                                  className="absolute top-1/2 -right-5 w-5 h-0.5 -translate-y-1/2 rounded-full"
                                  style={{ backgroundColor: decided ? LINE_DECIDED : LINE_PENDING }}
                                />
                              )}

                              {/* trilha da Final até a ficha de campeão */}
                              {isFinalRound && champion && (
                                <>
                                  <div
                                    className="absolute top-1/2 -right-10 w-10 h-0.5 -translate-y-1/2 rounded-full"
                                    style={{ backgroundColor: LINE_DECIDED }}
                                  />
                                  <div
                                    className="absolute top-1/2 -right-10 -translate-y-1/2 w-2 h-2 rounded-full"
                                    style={{ backgroundColor: LINE_DECIDED }}
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* linha vertical ligando os dois confrontos do par */}
                        {advancesToNextRound && pair.length === 2 && (
                          <div
                            className="absolute -right-5 w-0.5 rounded-full"
                            style={{ top: "25%", bottom: "25%", backgroundColor: vLineColor }}
                          />
                        )}

                        {/* trilha do par até a próxima fase (nó de destino) */}
                        {advancesToNextRound && pair.length === 2 && (
                          <>
                            <div
                              className="absolute top-1/2 -right-10 w-5 h-0.5 -translate-y-1/2 rounded-full"
                              style={{ backgroundColor: vLineColor }}
                            />
                            <div
                              className="absolute top-1/2 -right-10 -translate-y-1/2 w-2 h-2 rounded-full"
                              style={{ backgroundColor: vLineColor }}
                            />
                          </>
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
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match }) {
  const isDecided = match.status === "COMPLETED" && !!match.winner_id;

  return (
    <div
      className={`overflow-hidden bg-asphalt-card border rounded-sm transition-colors ${
        isDecided ? "border-ember/30" : "border-asphalt-borderLight"
      }`}
    >
      <PlayerRow
        name={match.driver_a?.gamertag ?? "A definir"}
        avatarUrl={match.driver_a?.avatar_url}
        isWinner={isDecided && match.winner_id === match.driver_a_id}
        isDecided={isDecided}
      />
      <div className="h-px bg-asphalt-borderLight" />
      <PlayerRow
        name={match.driver_b?.gamertag ?? "A definir"}
        avatarUrl={match.driver_b?.avatar_url}
        isWinner={isDecided && match.winner_id === match.driver_b_id}
        isDecided={isDecided}
      />
    </div>
  );
}

function PlayerRow({
  name,
  avatarUrl,
  isWinner,
  isDecided,
}: {
  name: string;
  avatarUrl?: string | null;
  isWinner: boolean;
  isDecided: boolean;
}) {
  // Antes de jogar: nome bem legível (texto normal do tema).
  // Venceu: verde de destaque, fundo levemente realçado.
  // Perdeu (já decidido e não é o vencedor): esmaecido e riscado — eliminado.
  const textColor = !isDecided ? "text-ink" : isWinner ? "text-checkpoint" : "text-ink-dim";

  return (
    <div
      className={`flex items-center gap-3 px-2.5 py-2 ${
        isWinner ? "bg-checkpoint/[0.06]" : ""
      }`}
    >
      <DriverAvatar gamertag={name} avatarUrl={avatarUrl} size="xl" />
      <span
        className={`font-display text-base font-semibold truncate flex-1 leading-tight ${textColor} ${
          isDecided && !isWinner ? "line-through decoration-1 opacity-60" : ""
        }`}
      >
        {name}
      </span>
      {isWinner && <Trophy size={15} className="shrink-0 text-checkpoint" />}
    </div>
  );
}
