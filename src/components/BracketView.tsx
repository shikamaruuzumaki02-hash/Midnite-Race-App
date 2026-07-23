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

// Cantos chanfrados usados em todos os cards e no selo VS — o "corte diagonal"
// que substitui o retângulo puro / moldura PNG antiga.
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

type ConnectorPath = { id: string; d: string; decided: boolean };

/**
 * Visualização do bracket de mata-mata: rodadas lado a lado, conectadas por
 * trilhas em curva orgânica (bezier), calculadas em runtime a partir da
 * posição real de cada card na tela — não mais elbows de 90° fixos por CSS.
 * Cada confronto é um card "banner": foto de cada piloto sangrando de um
 * lado (com máscara em gradiente) e o nome grande sobre o fundo escuro do
 * outro lado, um selo VS chanfrado na emenda entre os dois, e cantos
 * chanfrados no lugar da moldura PNG antiga.
 *
 * A trilha acende em âmbar (e a própria borda do card ganha glow) quando o
 * confronto de origem já tem vencedor definido. A trilha até a ficha de
 * campeão usa a mesma lógica, então o visual é consistente do início ao fim
 * do bracket.
 *
 * Por padrão tem scroll horizontal (pensado para celular) e, no desktop,
 * controles de zoom (+/-/reset), zoom com Ctrl+roda do mouse e arrastar com
 * o mouse para navegar. Quando usado dentro de uma exportação de imagem
 * (ExportableBracket), a prop `scrollable={false}` desativa tudo isso e
 * deixa o conteúdo na largura total, sem zoom, para a captura incluir todas
 * as rodadas — os conectores continuam funcionando normalmente nesse modo.
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

  // Mede o tamanho "natural" (sem escala) do conteúdo — usado tanto pra
  // calcular a área de scroll (modo scrollable) quanto pro tamanho do <svg>
  // de conectores (nos dois modos). transform: scale() não altera
  // offsetWidth/Height, então o ResizeObserver sempre reporta o tamanho
  // real, independente do zoom.
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

  // Recalcula os conectores a partir da posição real de cada card na tela.
  // `contentRef` é o próprio elemento que recebe `transform: scale(zoom)`,
  // então os retângulos filhos já vêm "escalados"; dividir por zoom
  // devolve as coordenadas pro espaço natural (não-escalado) em que o
  // <svg> é desenhado — como o <svg> é filho do mesmo elemento escalado,
  // ele acompanha o zoom junto com os cards automaticamente.
  const recomputeConnectors = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();

    const toLocal = (rect: DOMRect, edge: "left" | "right") => {
      const x = (edge === "right" ? rect.right : rect.left) - rootRect.left;
      const y = rect.top + rect.height / 2 - rootRect.top;
      return { x: x / zoom, y: y / zoom };
    };

    const seamRect = (card: HTMLElement) => {
      const seam = card.querySelector<HTMLElement>("[data-match-seam]") ?? card;
      return seam.getBoundingClientRect();
    };

    const bezier = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const midX = (p1.x + p2.x) / 2;
      return `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
    };

    const roundEls = Array.from(root.querySelectorAll<HTMLElement>("[data-round]"));
    const next: ConnectorPath[] = [];

    for (let i = 0; i < roundEls.length - 1; i++) {
      const cards = Array.from(roundEls[i].querySelectorAll<HTMLElement>("[data-match-card]"));
      const nextCards = Array.from(roundEls[i + 1].querySelectorAll<HTMLElement>("[data-match-card]"));
      cards.forEach((card, idx) => {
        const target = nextCards[Math.floor(idx / 2)];
        if (!target) return;
        const p1 = toLocal(seamRect(card), "right");
        const p2 = toLocal(seamRect(target), "left");
        next.push({
          id: `${i}-${idx}`,
          d: bezier(p1, p2),
          decided: card.dataset.decided === "true",
        });
      });
    }

    const championEl = root.querySelector<HTMLElement>("[data-champion]");
    const lastRoundEl = roundEls[roundEls.length - 1];
    if (championEl && lastRoundEl) {
      const lastCard = lastRoundEl.querySelector<HTMLElement>("[data-match-card]");
      if (lastCard && lastCard.dataset.decided === "true") {
        const p1 = toLocal(seamRect(lastCard), "right");
        const p2 = toLocal(championEl.getBoundingClientRect(), "left");
        next.push({ id: "champion", d: bezier(p1, p2), decided: true });
      }
    }

    setConnectorPaths(next);
  }, [zoom]);

  useLayoutEffect(() => {
    recomputeConnectors();
  }, [recomputeConnectors, matches, naturalSize]);

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

  const roundsContent = (
    <>
      {renderedRounds.map((roundName) => {
        const roundMatches = matchesByRound.get(roundName) ?? [];
        // Agrupar em pares aqui é só pra manter o espaçamento vertical
        // alinhado entre rodadas — os conectores em si são calculados à
        // parte, direto das posições reais no DOM (ver recomputeConnectors).
        const pairs = chunkPairs(roundMatches, 2);

        return (
          <div key={roundName} data-round={roundName} className="flex flex-col gap-3 w-[19rem] shrink-0">
            <div
              className="self-center inline-flex items-center gap-1.5 px-3 py-1 bg-ember/10 border border-ember/30"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)" }}
            >
              <Flag size={11} className="text-ember" />
              <h3 className="font-display text-xs tracking-wider text-ember uppercase">
                {roundName.toUpperCase()}
              </h3>
            </div>

            <div className="flex flex-col gap-7 justify-around flex-1">
              {pairs.map((pair, pairIdx) => (
                <div key={pairIdx} className="flex flex-col gap-7">
                  {pair.map((m) => (
                    <BracketMatchCard key={m.id} match={m} />
                  ))}
                </div>
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
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={naturalSize.width || undefined}
      height={naturalSize.height || undefined}
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
      data-match-card
      data-decided={isDecided ? "true" : "false"}
      className="relative bg-asphalt-card border transition-[box-shadow,border-color] duration-500"
      style={{
        clipPath: CARD_CHAMFER,
        borderColor: isDecided ? "rgba(255,90,31,0.5)" : undefined,
        boxShadow: isDecided
          ? "0 0 0 1px rgba(255,90,31,0.12), 0 0 18px rgba(255,90,31,0.10)"
          : "none",
      }}
    >
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

      {/*
        `data-match-seam` marca só as duas faixas dos pilotos (sem a barra
        de pista/horário acima). É nesse elemento — não no card inteiro —
        que os conectores miram, porque o centro geométrico do card inteiro
        fica puxado pra baixo pela barra de meta, desalinhando a trilha em
        relação à emenda visual onde o selo VS fica.
      */}
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
  // A foto sangra de um lado e o nome fica no espaço escuro do outro —
  // alternando entre as duas faixas do card pra criar o ritmo espelhado do
  // formato "banner".
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
            "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.78))",
        }}
      />

      {isWinner && (
        <span
          className={`absolute z-10 flex items-center gap-1 px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-wide text-black ${
            position === "top" ? "top-2 left-3" : "bottom-2 right-3"
          }`}
          style={{ background: LINE_DECIDED, clipPath: CHIP_CHAMFER }}
        >
          <Flag size={8} />
          Vencedor
        </span>
      )}

      <div
        className={`absolute bottom-2 max-w-[56%] ${
          photoOnLeft ? "right-3 text-right" : "left-3 text-left"
        }`}
      >
        <span
          className={`block font-display text-2xl font-bold uppercase leading-none truncate ${
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
