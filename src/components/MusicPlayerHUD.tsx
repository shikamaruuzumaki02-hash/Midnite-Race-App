"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Loader2 } from "lucide-react";

const PLAYLIST_ID = "PLgnM8w6PHYgdqsfLvJGA7dAL_2qaPnNyp";
const STORAGE_KEY = "midnite-player-pos";
const EXPAND_DURATION_MS = 5000;
const DRAG_THRESHOLD = 6;
const EDGE_MARGIN = 12;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function MusicPlayerHUD() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPoint = useRef({ x: 0, y: 0 });
  const movedPastThreshold = useRef(false);
  const primedRef = useRef(false);
  const desiredVolumeRef = useRef(50);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);

  // Posição ancorada: x é offset da borda esquerda OU direita, dependendo de `side`
  const [anchor, setAnchor] = useState({ x: 16, y: 16, side: "right" as "left" | "right" });
  // Posição livre usada só durante o arraste (coordenadas absolutas left/top)
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    desiredVolumeRef.current = volume;
  }, [volume]);

  // Posição inicial (salva ou canto inferior direito)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnchor({ x: parsed.x, y: parsed.y, side: parsed.side ?? "right" });
        return;
      }
    } catch {}
    setAnchor({ x: EDGE_MARGIN, y: window.innerHeight - 160, side: "right" });
  }, []);

  // Carrega YouTube IFrame API
  useEffect(() => {
    function initPlayer() {
      playerRef.current = new window.YT.Player("midnite-yt-player", {
        height: "0",
        width: "0",
        playerVars: { listType: "playlist", list: PLAYLIST_ID, autoplay: 0 },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(desiredVolumeRef.current);
            // Pré-aquecimento: toca mudo e pausa logo em seguida, pra reduzir
            // o atraso de buffering quando o usuário der play de verdade
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            const S = window.YT.PlayerState;

            if (!primedRef.current && e.data === S.PLAYING) {
              primedRef.current = true;
              e.target.pauseVideo();
              e.target.unMute();
              setTrackName(e.target.getVideoData()?.title ?? "");
              return;
            }

            if (e.data === S.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              setTrackName(e.target.getVideoData()?.title ?? "");
              triggerExpand();
            } else if (e.data === S.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (e.data === S.BUFFERING) {
              setIsBuffering(true);
            } else if (e.data === S.CUED) {
              setTrackName(e.target.getVideoData()?.title ?? "");
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  function triggerExpand() {
    setExpanded(true);
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    expandTimeoutRef.current = setTimeout(() => setExpanded(false), EXPAND_DURATION_MS);
  }

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      setIsBuffering(true);
      playerRef.current.playVideo();
    }
  };
  const next = () => playerRef.current?.nextVideo();
  const prev = () => playerRef.current?.previousVideo();

  const onVolumeChange = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v === 0) {
      setMuted(true);
      playerRef.current?.mute();
    } else if (muted) {
      setMuted(false);
      playerRef.current?.unMute();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    muted ? playerRef.current.unMute() : playerRef.current.mute();
    setMuted(!muted);
  };

  // Drag (com tolerância pra não confundir toque simples com arrastar)
  const handlePointerDown = (e: React.PointerEvent) => {
    movedPastThreshold.current = false;
    startPoint.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setDragPos({ left: rect.left, top: rect.top });
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;

    const dx = e.clientX - startPoint.current.x;
    const dy = e.clientY - startPoint.current.y;

    if (!movedPastThreshold.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      movedPastThreshold.current = true;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width ?? 52;
    const h = rect?.height ?? 52;

    const left = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - w));
    const top = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - h));

    setDragPos({ left, top });
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);

    // Toque simples (sem passar do limiar de arrastar) — deixa o onClick cuidar disso
    if (!movedPastThreshold.current) {
      setDragPos(null);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setDragPos(null);
      return;
    }

    const newSide: "left" | "right" =
      rect.left + rect.width / 2 < window.innerWidth / 2 ? "left" : "right";

    const newX = EDGE_MARGIN; // offset fixo da borda pra qual ele grudou
    const newY = Math.max(EDGE_MARGIN, Math.min(rect.top, window.innerHeight - rect.height - EDGE_MARGIN));

    setAnchor({ x: newX, y: newY, side: newSide });
    setDragPos(null);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: newX, y: newY, side: newSide }));
    } catch {}
  };

  const handleClick = () => {
    if (movedPastThreshold.current) return;
    setExpanded((p) => !p);
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
  };

  const positionStyle: React.CSSProperties = dragPos
    ? { left: dragPos.left, top: dragPos.top }
    : anchor.side === "left"
    ? { left: anchor.x, top: anchor.y }
    : { right: anchor.x, top: anchor.y };

  return (
    <>
      <div id="midnite-yt-player" className="hidden" />
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ position: "fixed", ...positionStyle, zIndex: 60, touchAction: "none" }}
        className={`select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div
          onClick={handleClick}
          className={`flex items-center bg-asphalt/90 metal-surface border-[1.5px] border-ink-faint/40 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden ${
            expanded ? "px-3 py-2 gap-2.5" : "p-2.5"
          } ${anchor.side === "left" ? "flex-row" : "flex-row-reverse"}`}
        >
          <div className="shrink-0 w-8 h-8 rounded-full bg-ember/15 flex items-center justify-center">
            <Music size={16} className="text-ember" />
          </div>

          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
              expanded ? "max-w-[280px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="font-mono text-xs text-ink-muted whitespace-nowrap max-w-[110px] overflow-hidden text-ellipsis">
              {trackName || "Carregando..."}
            </span>

            <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10" aria-label="Música anterior">
              <SkipBack size={14} className="text-ink" />
            </button>

            <button type="button" onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-ember/80 hover:bg-ember" aria-label={isPlaying ? "Pausar" : "Tocar"}>
              {isBuffering ? (
                <Loader2 size={14} className="text-asphalt animate-spin" />
              ) : isPlaying ? (
                <Pause size={14} className="text-asphalt" />
              ) : (
                <Play size={14} className="text-asphalt ml-0.5" />
              )}
            </button>

            <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10" aria-label="Próxima música">
              <SkipForward size={14} className="text-ink" />
            </button>

            <button type="button" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10" aria-label={muted ? "Ativar som" : "Mudo"}>
              {muted || volume === 0 ? <VolumeX size={14} className="text-ink" /> : <Volume2 size={14} className="text-ink" />}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-14 accent-ember"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </>
  );
                }
