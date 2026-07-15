import { Flag, MapPin } from "lucide-react";
import { getRoundSequence } from "@/lib/bracket";
import ChampionReveal from "@/components/ChampionReveal";
import type { Match } from "@/types/database";

const LINE_PENDING = "#4a4a52";
const LINE_DECIDED = "#ff5a1f";

// Contorno "rasgado" tipo adesivo de pichação arrancado — usado no selo
// VS e no carimbo de vencedor, pra fugir da cara de forma geométrica limpa.
const JAGGED_CLIP =
  "polygon(0% 20%, 10% 8%, 22% 18%, 35% 4%, 48% 16%, 62% 2%, 75% 14%, 88% 5%, 100% 18%, 96% 45%, 100% 72%, 88% 85%, 75% 96%, 62% 84%, 48% 98%, 35% 86%, 22% 100%, 10% 88%, 0% 78%, 4% 50%)";

const AVATAR_PALETTE = [
  "#ff5a1f",
  "#3ddc97",
  "#4f8cff",
  "#c44fff",
  "#ffb84f",
  "#ff4d6a",
  "#4fd9ff",
];

function colorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initialsFromGamertag(gamertag: string) {
  const cleaned = gamertag.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

function chunkPairs<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function primaryTrackName(match: Match): string | null {
  const tracks = match.match_tracks ?? [];
  const sorted = [...tracks].sort((a, b) => a.position - b.position);
  if (sorted.length > 0) return sorted[0].track?.name ?? null;
  if (match.track) return match.track.name;
  return null;
}

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado, conectadas por
 * trilhas em ângulo reto. Cada confronto é um "cartão de pôster" — foto
 * cheia dos dois pilotos com o nome sobre um gradiente, selo "VS" entre
 * eles, e o piloto eliminado perde a cor (preto e branco). A trilha acende
 * em ember quando o confronto de origem já tem vencedor definido, e existe
 * mesmo antes da próxima fase ser gerada — a topologia da chave é sempre
 * conhecida a partir de `numPlayers`.
 *
 * Por padrão tem scroll horizontal (pensado para celular). Quando usado
 * dentro de uma exportação de imagem (ExportableBracket), a prop
 * `scrollable={false}` desativa o scroll e deixa o conteúdo na largura
 * total, para a captura incluir todas as rodadas.
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
              <div key={roundName} className="flex flex-col gap-3 w-64 shrink-0">
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

                              {advancesToNextRound && (
                                <div
                                  className="absolute top-1/2 -right-5 w-5 h-0.5 -translate-y-1/2 rounded-full"
                                  style={{
                                    backgroundColor: decided ? LINE_DECIDED : LINE_PENDING,
                                    boxShadow: decided ? "0 0 6px rgba(255,90,31,0.6)" : "none",
                                  }}
                                />
                              )}

                              {isFinalRound && champion && (
                                <>
                                  <div
                                    className="absolute top-1/2 -right-10 w-10 h-0.5 -translate-y-1/2 rounded-full"
                                    style={{
                                      backgroundColor: LINE_DECIDED,
                                      boxShadow: "0 0 6px rgba(255,90,31,0.6)",
                                    }}
                                  />
                                  <div
                                    className="absolute top-1/2 -right-10 -translate-y-1/2 w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: LINE_DECIDED,
                                      boxShadow: "0 0 6px rgba(255,90,31,0.8)",
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}

                        {advancesToNextRound && pair.length === 2 && (
                          <div
                            className="absolute -right-5 w-0.5 rounded-full"
                            style={{
                              top: "25%",
                              bottom: "25%",
                              backgroundColor: vLineColor,
                              boxShadow: bothDecided ? "0 0 6px rgba(255,90,31,0.6)" : "none",
                            }}
                          />
                        )}

                        {advancesToNextRound && pair.length === 2 && (
                          <>
                            <div
                              className="absolute top-1/2 -right-10 w-5 h-0.5 -translate-y-1/2 rounded-full"
                              style={{
                                backgroundColor: vLineColor,
                                boxShadow: bothDecided ? "0 0 6px rgba(255,90,31,0.6)" : "none",
                              }}
                            />
                            <div
                              className="absolute top-1/2 -right-10 -translate-y-1/2 w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: vLineColor,
                                boxShadow: bothDecided ? "0 0 6px rgba(255,90,31,0.8)" : "none",
                              }}
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
  const trackName = primaryTrackName(match);
  const timeLabel = match.scheduled_at
    ? new Date(match.scheduled_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`relative overflow-hidden rounded-sm border-2 transition-colors ${
        isDecided ? "border-ember/50" : "border-asphalt-borderLight"
      }`}
      style={{ boxShadow: "inset 0 0 24px rgba(0,0,0,0.65)" }}
    >
      {/* rebites nos cantos, estilo placa de metal */}
      {[
        "top-1 left-1",
        "top-1 right-1",
        "bottom-1 left-1",
        "bottom-1 right-1",
      ].map((pos) => (
        <div
          key={pos}
          className={`absolute z-20 w-1.5 h-1.5 rounded-full ${pos}`}
          style={{
            background: "radial-gradient(circle at 35% 35%, #4a4a52, #16161a)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
          }}
        />
      ))}

      {/* tarja de identidade do card */}
      <div
        className="h-1 w-full opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #ff5a1f 0px, #ff5a1f 6px, transparent 6px, transparent 12px)",
        }}
      />

      {(trackName || timeLabel) && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1 bg-asphalt-card border-b border-asphalt-borderLight">
          <span className="flex items-center gap-1 font-mono text-[9px] text-ink-faint truncate">
            {trackName && (
              <>
                <MapPin size={9} className="text-ember shrink-0" />
                <span className="truncate">{trackName}</span>
              </>
            )}
          </span>
          {timeLabel && (
            <span className="font-mono text-[9px] text-ink-faint shrink-0">{timeLabel}</span>
          )}
        </div>
      )}

      <div className="relative bg-asphalt-card">
        <PosterRow
          name={match.driver_a?.gamertag ?? "A definir"}
          avatarUrl={match.driver_a?.avatar_url}
          isWinner={isDecided && match.winner_id === match.driver_a_id}
          isDecided={isDecided}
        />
        <PosterRow
          name={match.driver_b?.gamertag ?? "A definir"}
          avatarUrl={match.driver_b?.avatar_url}
          isWinner={isDecided && match.winner_id === match.driver_b_id}
          isDecided={isDecided}
        />

        {/* selo VS estilo adesivo de pichação rasgado */}
        <div
          className="absolute left-1/2 top-1/2 z-10 w-24 h-16"
          style={{ transform: "translate(-50%, -50%) rotate(-9deg)" }}
        >
          <div className="absolute inset-0" style={{ clipPath: JAGGED_CLIP, backgroundColor: "#0a0a0c" }} />
          <div
            className="absolute inset-[3px]"
            style={{
              clipPath: JAGGED_CLIP,
              background: "linear-gradient(135deg, #ff7a45, #ff5a1f)",
              boxShadow: "0 0 14px rgba(255,90,31,0.7)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display text-lg font-extrabold uppercase"
              style={{
                color: "#0a0a0c",
                transform: "skewX(-12deg)",
                letterSpacing: "-0.03em",
                WebkitTextStroke: "0.5px #0a0a0c",
              }}
            >
              VS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PosterRow({
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
  const eliminated = isDecided && !isWinner;
  const bgColor = colorFromName(name);

  return (
    <div className="relative h-44 overflow-hidden">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          crossOrigin="anonymous"
          style={{ objectPosition: "50% 15%" }}
          className={`w-full h-full object-cover transition-all ${
            eliminated ? "grayscale brightness-[0.4]" : ""
          }`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-display text-3xl font-bold transition-all ${
            eliminated ? "grayscale brightness-[0.4]" : ""
          }`}
          style={{ backgroundColor: `${bgColor}22`, color: bgColor }}
        >
          {initialsFromGamertag(name)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {isWinner && (
        <div
          className="absolute top-2 right-1 z-10 w-24 h-9"
          style={{ transform: "rotate(-8deg)", filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.7))" }}
        >
          <div className="absolute inset-0" style={{ clipPath: JAGGED_CLIP, backgroundColor: "#0a0a0c" }} />
          <div
            className="absolute inset-[2px]"
            style={{ clipPath: JAGGED_CLIP, backgroundColor: "rgba(10,10,12,0.88)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display text-[11px] font-extrabold uppercase"
              style={{
                color: "#ff5a1f",
                transform: "skewX(-10deg)",
                letterSpacing: "0.03em",
                textShadow: "0 0 8px rgba(255,90,31,0.6)",
              }}
            >
              Vencedor
            </span>
          </div>
          {/* pingos de tinta escorrendo do carimbo */}
          <div
            className="absolute -bottom-1 left-4 w-1.5 h-2.5 bg-ember/70"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
          <div
            className="absolute -bottom-1.5 left-10 w-1 h-3 bg-ember/50"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
        </div>
      )}

      <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
        <span
          className={`font-display text-base font-bold truncate leading-tight ${
            isWinner ? "text-ember" : eliminated ? "text-ink-dim line-through decoration-2" : "text-ink"
          }`}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
