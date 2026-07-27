"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Flag, MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { getRoundSequence } from "@/lib/bracket";
import ChampionReveal from "@/components/ChampionReveal";
import type { Match } from "@/types/database";

const LINE_PENDING = "#4a4a52";
const LINE_DECIDED = "#ff5a1f";

const AVATAR_PALETTE = [
  "#ff5a1f",
  "#3ddc97",
  "#4f8cff",
  "#c44fff",
  "#ffb84f",
  "#ff4d6a",
  "#4fd9ff",
];

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;

const CARD_CHAMFER = "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)";
const CHIP_CHAMFER = "polygon(0 0, 100% 0, 100% 100%, 5px 100%, 0 calc(100% - 5px))";
const VS_CHAMFER = "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)";

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
 * O pareamento da chave (quem alimenta quem na próxima rodada) depende da
 * ORDEM DE CRIAÇÃO dos matches de uma rodada — é a mesma convenção que
 * `pairWinnersForNextRound` (em @/lib/bracket) já assume ao gerar a rodada
 * seguinte. Só que nada garante que a query que busca os matches de volta
 * do banco preserve essa ordem (sem um `order by` explícito, a ordem de
 * retorno não é confiável). Por segurança, reordenamos aqui por
 * `created_at` (com `id` como desempate, caso uma rodada inteira seja
 * criada no mesmo milissegundo) antes de qualquer agrupamento em pares —
 * assim a exibição fica correta mesmo que a query upstream não tenha
 * ordenação nenhuma.
 */
function sortByCreationOrder(a: Match, b: Match): number {
  const ta = new Date(a.created_at).getTime();
  const tb = new Date(b.created_at).getTime();
  if (ta !== tb) return ta - tb;
  return a.id.localeCompare(b.id);
}

type ConnectorPath = { id: string; d: string; decided: boolean };

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado, conectadas por
 * trilhas em curva orgânica (bezier). Cada confronto é um card "banner":
 * foto de cada piloto sangrando de um lado (com máscara em gradiente) e o
 * nome grande sobre o fundo escuro do outro lado, um selo VS chanfrado na
 * emenda entre os dois, cantos chanfrados.
 *
 * Duas coisas são calculadas em runtime, nessa ordem, a cada mudança em
 * `matches`/`numPlayers`:
 *
 * 1. POSIÇÃO — cada card da 2ª rodada em diante é fixado (position:
 *    absolute; top) exatamente no meio vertical entre os dois cards da
 *    rodada anterior que alimentam ele. Isso substitui a tentativa antiga
 *    de centralizar via flexbox (`justify-around`), que só aproxima e
 *    desalinha assim que os cards têm alturas ligeiramente diferentes.
 *    Só a primeira rodada fica em fluxo normal (flex + gap) — ela é a
 *    "régua" que todas as outras se alinham a partir dela.
 *
 * 2. CONECTORES — com todo mundo já na posição final, o <svg> de trilhas é
 *    recalculado a partir da posição real de cada card (`getBoundingClientRect`
 *    sobre `[data-match-seam]`, que é só a área das duas faixas de piloto,
 *    sem a barra de pista/horário acima — é ali, na emenda onde fica o
 *    selo VS, que a trilha deve mirar).
 *
 * Por padrão tem scroll horizontal (pensado para celular) e, no desktop,
 * controles de zoom (+/-/reset), zoom com Ctrl+roda do mouse e arrastar com
 * o mouse para navegar. Quando usado dentro de uma exportação de imagem
 * (ExportableBracket), a prop `scrollable={false}` desativa tudo isso e
 * deixa o conteúdo na largura total, sem zoom — os cálculos acima continuam
 * funcionando normalmente nesse modo.
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
  const [zoom, setZoom] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [connectorPaths, setConnectorPaths] = useState<ConnectorPath[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false });

  // Referências pros cards e colunas de rodada — usadas pelo passe de
  // centralização abaixo. Chaveadas por id de match / nome de rodada
  // porque a ordem de montagem no React não é garantida.
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const roundRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setNaturalSize({
          width: entry.target.scrollWidth,
          height: entry.target.scrollHeight,
        });
      }
    });
    observer.observe(el);
    setNaturalSize({ width: el.scrollWidth, height: el.scrollHeight });
    return () => observer.disconnect();
  }, [matches, numPlayers]);

  const recomputeConnectors = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;

    let roundOrderLocal: string[];
    try {
      roundOrderLocal = getRoundSequence(numPlayers);
    } catch {
      return;
    }

    const byRound = new Map<string, Match[]>();
    for (const r of roundOrderLocal) {
      byRound.set(r, matches.filter((m) => m.round === r));
    }
    const renderedRoundsLocal = roundOrderLocal.filter((r) => (byRound.get(r)?.length ?? 0) > 0);
    if (renderedRoundsLocal.length === 0) {
      setConnectorPaths([]);
      return;
    }

    const rootRect = root.getBoundingClientRect();

    // A escala "total" de tela pode vir de mais de um transform empilhado
    // — o próprio zoom deste componente, mas também qualquer wrapper
    // externo (ex.: o fit-to-screen do ExportableBracket) que escale este
    // componente inteiro por fora. Em vez de confiar só no `zoom` que este
    // componente conhece, medimos a razão real entre o tamanho renderizado
    // na tela e o tamanho "de verdade" do layout (offsetWidth ignora
    // qualquer transform) — isso captura a escala acumulada de qualquer
    // ancestral, sem precisar saber quantos transforms existem por cima.
    const scaleFactor = root.offsetWidth ? rootRect.width / root.offsetWidth : 1;

    const toLocal = (rect: DOMRect, edge: "left" | "right") => {
      const x = (edge === "right" ? rect.right : rect.left) - rootRect.left;
      const y = rect.top + rect.height / 2 - rootRect.top;
      return { x: x / scaleFactor, y: y / scaleFactor };
    };

    const seamRectFor = (matchId: string) => {
      const card = root.querySelector<HTMLElement>(`[data-match-id="${matchId}"]`);
      if (!card) return null;
      const seam = card.querySelector<HTMLElement>("[data-match-seam]") ?? card;
      return seam.getBoundingClientRect();
    };

    const bezier = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const midX = (p1.x + p2.x) / 2;
      return `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
    };

    const next: ConnectorPath[] = [];

    // Quem alimenta quem NÃO é decidido pela posição no array — o
    // pareamento de uma chave com seed (1v8, 4v5 do mesmo lado; 2v7, 3v6
    // do outro) avança de forma intercalada, não sequencial. A única
    // fonte confiável é o próprio dado: o confronto da rodada seguinte já
    // tem `driver_a_id`/`driver_b_id`, e esses pilotos só chegaram ali por
    // terem sido `winner_id` de algum confronto da rodada anterior.
    for (let i = 0; i < renderedRoundsLocal.length - 1; i++) {
      const currentRoundMatches = byRound.get(renderedRoundsLocal[i]) ?? [];
      const nextRoundMatches = byRound.get(renderedRoundsLocal[i + 1]) ?? [];

      nextRoundMatches.forEach((nextMatch) => {
        const targetRect = seamRectFor(nextMatch.id);
        if (!targetRect) return;

        const feeders = currentRoundMatches.filter(
          (m) =>
            !!m.winner_id &&
            (m.winner_id === nextMatch.driver_a_id || m.winner_id === nextMatch.driver_b_id)
        );

        feeders.forEach((feeder) => {
          const sourceRect = seamRectFor(feeder.id);
          if (!sourceRect) return;
          const p1 = toLocal(sourceRect, "right");
          const p2 = toLocal(targetRect, "left");
          next.push({
            id: `${feeder.id}-${nextMatch.id}`,
            d: bezier(p1, p2),
            decided: feeder.status === "COMPLETED" && !!feeder.winner_id,
          });
        });
      });
    }

    const trueFinalRoundName = roundOrderLocal[roundOrderLocal.length - 1];
    const finalMatches = byRound.get(trueFinalRoundName) ?? [];
    const finalMatch = finalMatches[0];
    const championEl = root.querySelector<HTMLElement>("[data-champion]");
    if (finalMatch && finalMatch.status === "COMPLETED" && finalMatch.winner_id && championEl) {
      const sourceRect = seamRectFor(finalMatch.id);
      if (sourceRect) {
        const p1 = toLocal(sourceRect, "right");
        const p2 = toLocal(championEl.getBoundingClientRect(), "left");
        next.push({ id: "champion", d: bezier(p1, p2), decided: true });
      }
    }

    setConnectorPaths(next);
  }, [matches, numPlayers]);

  // Passe de centralização: fixa cada card da 2ª rodada em diante no meio
  // exato entre os dois cards que o alimentam. Só depende dos dados
  // (matches/numPlayers) — a posição calculada é local ao conteúdo
  // não-escalado, então continua correta em qualquer nível de zoom sem
  // precisar recalcular por causa dele.
  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    let roundOrderLocal: string[];
    try {
      roundOrderLocal = getRoundSequence(numPlayers);
    } catch {
      return;
    }

    const matchesByRoundLocal = new Map<string, Match[]>();
    for (const round of roundOrderLocal) {
      matchesByRoundLocal.set(round, matches.filter((m) => m.round === round).sort(sortByCreationOrder));
    }
    const renderedRoundsLocal = roundOrderLocal.filter(
      (r) => (matchesByRoundLocal.get(r)?.length ?? 0) > 0
    );
    if (renderedRoundsLocal.length === 0) return;

    // Limpa qualquer posicionamento de uma medição anterior antes de
    // remedir — senão a rodada 1 herda alturas infladas de uma passada
    // velha e todo o resto do cálculo fica errado.
    cardRefs.current.forEach((el) => {
      el.style.position = "";
      el.style.top = "";
      el.style.left = "";
      el.style.right = "";
    });
    roundRefs.current.forEach((el) => {
      el.style.height = "";
    });

    const rootRect = root.getBoundingClientRect();
    const scaleFactor = root.offsetWidth ? rootRect.width / root.offsetWidth : 1;
    const localTop = (el: HTMLElement) => (el.getBoundingClientRect().top - rootRect.top) / scaleFactor;
    const localHeight = (el: HTMLElement) => el.getBoundingClientRect().height / scaleFactor;
    const localCenter = (el: HTMLElement) => localTop(el) + localHeight(el) / 2;

    const firstRoundEl = roundRefs.current.get(renderedRoundsLocal[0]);
    const baselineHeight = firstRoundEl ? localHeight(firstRoundEl) : 0;

    // Mapa de centro vertical já resolvido por id de match — em vez de um
    // array indexado, porque quem alimenta quem não é "posição 0 e 1 no
    // array", é quem tem `winner_id` batendo com o `driver_a_id`/
    // `driver_b_id` do confronto seguinte (ver nota em recomputeConnectors).
    const centerByMatchId = new Map<string, number>();

    renderedRoundsLocal.forEach((roundName, roundIdx) => {
      const roundMatchesLocal = matchesByRoundLocal.get(roundName) ?? [];

      if (roundIdx === 0) {
        // Rodada base: fica em fluxo normal (flex + gap), só medimos.
        roundMatchesLocal.forEach((m) => {
          const el = cardRefs.current.get(m.id);
          if (el) centerByMatchId.set(m.id, localCenter(el));
        });
        return;
      }

      const roundEl = roundRefs.current.get(roundName);
      if (roundEl && baselineHeight > 0) {
        roundEl.style.height = `${baselineHeight}px`;
      }

      const previousRoundMatches = matchesByRoundLocal.get(renderedRoundsLocal[roundIdx - 1]) ?? [];

      roundMatchesLocal.forEach((m) => {
        const card = cardRefs.current.get(m.id);
        if (!card) return;

        const feeders = previousRoundMatches.filter(
          (pm) => !!pm.winner_id && (pm.winner_id === m.driver_a_id || pm.winner_id === m.driver_b_id)
        );
        const feederCenters = feeders
          .map((f) => centerByMatchId.get(f.id))
          .filter((c): c is number => c !== undefined);

        if (feederCenters.length === 0) return;

        const center = feederCenters.reduce((sum, c) => sum + c, 0) / feederCenters.length;
        const height = localHeight(card);
        card.style.position = "absolute";
        card.style.left = "0";
        card.style.right = "0";
        card.style.top = `${center - height / 2}px`;
        centerByMatchId.set(m.id, center);
      });
    });

    recomputeConnectors();
  }, [matches, numPlayers, recomputeConnectors]);

  useLayoutEffect(() => {
    recomputeConnectors();
  }, [recomputeConnectors, naturalSize]);

  useEffect(() => {
    window.addEventListener("resize", recomputeConnectors);
    return () => window.removeEventListener("resize", recomputeConnectors);
  }, [recomputeConnectors]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((z) => {
      const next = e.deltaY < 0 ? z + ZOOM_STEP / 2 : z - ZOOM_STEP / 2;
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +next.toFixed(2)));
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
      moved: false,
    };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragState.current.moved = true;
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx;
    scrollRef.current.scrollTop = dragState.current.scrollTop - dy;
  }, [isDragging]);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

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
      matches.filter((m) => m.round === round).sort(sortByCreationOrder)
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

  const roundsContent = (
    <>
      {renderedRounds.map((roundName, roundIdx) => {
        const roundMatches = matchesByRound.get(roundName) ?? [];
        const isBaseRound = roundIdx === 0;
        // Na rodada base isso só agrupa visualmente em pares (gap). Da 2ª
        // rodada em diante o agrupamento em si não importa mais pro
        // espaçamento — cada card é posicionado via inline style no passe
        // de centralização — mas mantemos a mesma estrutura de render.
        const pairs = chunkPairs(roundMatches, 2);

        return (
          <div
            key={roundName}
            data-round={roundName}
            ref={(el) => {
              if (el) roundRefs.current.set(roundName, el);
              else roundRefs.current.delete(roundName);
            }}
            className="relative flex flex-col gap-3 w-[19rem] shrink-0"
          >
            <div
              className="self-center inline-flex items-center gap-1.5 px-3 py-1 bg-ember/10 border border-ember/30 shrink-0"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)" }}
            >
              <Flag size={11} className="text-ember" />
              <h3 className="font-display text-xs tracking-wider text-ember uppercase">
                {roundName.toUpperCase()}
              </h3>
            </div>

            <div
              className={
                isBaseRound
                  ? "relative flex flex-col gap-7 justify-around flex-1"
                  : "relative flex-1"
              }
            >
              {isBaseRound
                ? pairs.map((pair, pairIdx) => (
                    <div key={pairIdx} className="flex flex-col gap-7">
                      {pair.map((m) => (
                        <BracketMatchCard
                          key={m.id}
                          match={m}
                          cardRef={(el) => {
                            if (el) cardRefs.current.set(m.id, el);
                            else cardRefs.current.delete(m.id);
                          }}
                        />
                      ))}
                    </div>
                  ))
                : // Da 2ª rodada em diante os cards são filhos DIRETOS deste
                  // container (sem nenhum wrapper "display: contents" no
                  // meio) — cada um é posicionado via inline style (top)
                  // calculado no passe de centralização. Um wrapper com
                  // `display: contents` envolvendo um filho `position:
                  // absolute` tem resolução de "ancestral posicionado"
                  // inconsistente entre motores de navegador, e foi essa a
                  // causa de as trilhas e o posicionamento sumirem só no
                  // site (ao vivo) e não na exportação.
                  roundMatches.map((m) => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      cardRef={(el) => {
                        if (el) cardRefs.current.set(m.id, el);
                        else cardRefs.current.delete(m.id);
                      }}
                    />
                  ))}
            </div>
          </div>
        );
      })}

      {champion && (
        <div data-champion className="flex flex-col justify-center shrink-0">
          <ChampionReveal gamertag={champion.gamertag} avatarUrl={champion.avatar_url} />
        </div>
      )}
    </>
  );

  const connectorsSvg = (
    <svg
      className="pointer-events-none absolute inset-0 z-0"
      style={{ overflow: "visible" }}
    >
      {connectorPaths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.decided ? LINE_DECIDED : LINE_PENDING}
          strokeWidth={p.decided ? 2.4 : 1.6}
          strokeLinecap="round"
          className="transition-[stroke] duration-500"
        />
      ))}
    </svg>
  );

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(255,90,31,0.08), transparent), radial-gradient(ellipse 50% 30% at 80% 90%, rgba(255,90,31,0.05), transparent)",
        }}
      />

      {scrollable && (
        <div className="flex items-center justify-end gap-1 mb-2">
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Diminuir zoom"
            className="p-1.5 rounded-sm bg-asphalt-card border border-asphalt-borderLight text-ink-faint hover:text-ember hover:border-ember/50 transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="font-mono text-[10px] text-ink-faint w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Aumentar zoom"
            className="p-1.5 rounded-sm bg-asphalt-card border border-asphalt-borderLight text-ink-faint hover:text-ember hover:border-ember/50 transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Restaurar zoom"
            className="p-1.5 rounded-sm bg-asphalt-card border border-asphalt-borderLight text-ink-faint hover:text-ember hover:border-ember/50 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      {scrollable ? (
        <div
          ref={scrollRef}
          className="overflow-auto pb-2 -mx-1 select-none"
          style={{ maxHeight: "70vh", cursor: isDragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          <div
            style={{
              width: naturalSize.width ? naturalSize.width * zoom : undefined,
              height: naturalSize.height ? naturalSize.height * zoom : undefined,
              position: "relative",
            }}
          >
            <div
              ref={contentRef}
              className="relative flex items-stretch gap-10 px-1 min-w-max"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              {connectorsSvg}
              {roundsContent}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-visible pb-2 -mx-1">
          <div ref={contentRef} className="relative flex items-stretch gap-10 px-1 w-max">
            {connectorsSvg}
            {roundsContent}
          </div>
        </div>
      )}
    </div>
  );
}

function BracketMatchCard({
  match,
  cardRef,
}: {
  match: Match;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
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
      ref={cardRef}
      data-match-card
      data-match-id={match.id}
      data-decided={isDecided ? "true" : "false"}
      className="relative z-10 bg-asphalt-card border transition-[box-shadow,border-color] duration-500"
      style={{
        clipPath: CARD_CHAMFER,
        borderColor: isDecided ? "rgba(255,90,31,0.5)" : undefined,
        boxShadow: isDecided
          ? "inset 0 0 0 1px rgba(255,90,31,0.18), 0 0 0 1px rgba(255,90,31,0.12), 0 0 18px rgba(255,90,31,0.10)"
          : "inset 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      {/*
        Cantos em L nos dois vértices que NÃO são chanfrados — mesmo motivo
        visual já usado em outras caixas do app (ex.: "Próximas corridas").
        Os outros dois cantos já têm o corte diagonal do chamfer, então só
        estes dois precisam do acento.
      */}
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 w-3 h-3 pointer-events-none transition-colors duration-500"
        style={{
          borderTop: `1.5px solid ${isDecided ? LINE_DECIDED : "#4a4a52"}`,
          borderRight: `1.5px solid ${isDecided ? LINE_DECIDED : "#4a4a52"}`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none transition-colors duration-500"
        style={{
          borderBottom: `1.5px solid ${isDecided ? LINE_DECIDED : "#4a4a52"}`,
          borderLeft: `1.5px solid ${isDecided ? LINE_DECIDED : "#4a4a52"}`,
        }}
      />

      {(trackName || timeLabel) && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-asphalt-bg/60 border-b border-asphalt-borderLight">
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

      <div data-match-seam className="relative">
        <BannerRow
          name={match.driver_a?.gamertag ?? "A definir"}
          avatarUrl={match.driver_a?.avatar_url}
          isWinner={isDecided && match.winner_id === match.driver_a_id}
          isDecided={isDecided}
          position="top"
        />

        <div
          className="h-0.5 w-full transition-colors duration-500"
          style={{ backgroundColor: isDecided ? LINE_DECIDED : "#3a3a40" }}
        />

        <BannerRow
          name={match.driver_b?.gamertag ?? "A definir"}
          avatarUrl={match.driver_b?.avatar_url}
          isWinner={isDecided && match.winner_id === match.driver_b_id}
          isDecided={isDecided}
          position="bottom"
        />

        {/*
          Holofote escuro atrás do selo VS — garante legibilidade mesmo se
          algum pixel do nome do piloto chegar perto do centro, sem
          depender só do corte de largura abaixo.
        */}
        <div
          className="absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2 w-16 h-10 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(11,11,13,0.85), transparent)" }}
        />

        <div
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1"
          style={{
            background: "#0b0b0d",
            border: `1.5px solid ${isDecided ? LINE_DECIDED : "#4a4a52"}`,
            clipPath: VS_CHAMFER,
            boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          <span
            className="font-display text-[11px] font-bold tracking-wide"
            style={{ color: isDecided ? LINE_DECIDED : "#8a8a90" }}
          >
            VS
          </span>
        </div>
      </div>
    </div>
  );
}

function BannerRow({
  name,
  avatarUrl,
  isWinner,
  isDecided,
  position,
}: {
  name: string;
  avatarUrl?: string | null;
  isWinner: boolean;
  isDecided: boolean;
  position: "top" | "bottom";
}) {
  const eliminated = isDecided && !isWinner;
  const bgColor = colorFromName(name);
  const photoOnLeft = position === "top";

  return (
    <div className="relative h-32 overflow-hidden">
      <div
        className={`absolute inset-y-0 w-3/5 ${photoOnLeft ? "left-0" : "right-0"}`}
        style={{
          WebkitMaskImage: `linear-gradient(to ${photoOnLeft ? "right" : "left"}, black 50%, transparent 97%)`,
          maskImage: `linear-gradient(to ${photoOnLeft ? "right" : "left"}, black 50%, transparent 97%)`,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            crossOrigin="anonymous"
            style={{ objectPosition: "50% 18%" }}
            className={`w-full h-full object-cover transition-all ${
              eliminated ? "grayscale brightness-[0.45]" : ""
            }`}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center font-display text-3xl font-bold transition-all ${
              eliminated ? "grayscale brightness-[0.45]" : ""
            }`}
            style={{ backgroundColor: `${bgColor}22`, color: bgColor }}
          >
            {initialsFromGamertag(name)}
          </div>
        )}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            position === "top"
              ? "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.35) 100%)"
              : "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {isWinner && (
        <span
          className={`absolute z-10 flex items-center gap-1 px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-wide text-black ${
            position === "top" ? "bottom-2 left-3" : "top-2 right-3"
          }`}
          style={{ background: LINE_DECIDED, clipPath: CHIP_CHAMFER }}
        >
          <Flag size={8} />
          Vencedor
        </span>
      )}

      {/*
        O nome fica na ponta EXTERNA do próprio banner — perto do topo do
        card na faixa de cima, perto do rodapé na faixa de baixo — em vez
        de perto da emenda com o outro piloto. Assim ele nunca disputa
        espaço com o selo VS (que mora só na emenda) e pode aparecer por
        inteiro, sem cortar nada, não importa o tamanho do gamertag.
      */}
      <div
        className={`absolute max-w-[85%] ${position === "top" ? "top-2" : "bottom-2"} ${
          photoOnLeft ? "right-3 text-right" : "left-3 text-left"
        }`}
      >
        <span
          className={`block whitespace-nowrap font-display text-2xl font-bold uppercase leading-none ${
            isWinner ? "" : eliminated ? "text-ink-dim line-through decoration-2" : "text-ink"
          }`}
          style={{
            color: isWinner ? LINE_DECIDED : undefined,
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
