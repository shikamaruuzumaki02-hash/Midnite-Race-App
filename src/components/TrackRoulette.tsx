"use client";

import { useState, useRef, useMemo } from "react";
import { Loader2, Check } from "lucide-react";
import type { Track, Mapa } from "@/types/database";

const SLICE_COLORS = ["#ff5a1f", "#1a1a1e"];

const SPIN_DURATION_MS = 3200;

const MAPA_FILTROS: { value: Mapa | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "twin_palms", label: "Twin Palms" },
  { value: "mount_hidoro", label: "Mount Hidoro" },
  { value: "snap", label: "S.N.A.P." },
];

export default function TrackRoulette({ tracks }: { tracks: Track[] }) {
  const [mapaFiltro, setMapaFiltro] = useState<Mapa | "todos">("todos");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Track | null>(null);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredTracks = useMemo(
    () => (mapaFiltro === "todos" ? tracks : tracks.filter((t) => t.mapa === mapaFiltro)),
    [tracks, mapaFiltro]
  );

  const sliceCount = filteredTracks.length;
  const sliceAngle = sliceCount > 0 ? 360 / sliceCount : 0;

  function handleFiltroChange(value: Mapa | "todos") {
    if (spinning) return;
    setMapaFiltro(value);
    setRotation(0);
    setWinner(null);
  }

  function handleSpin() {
    if (spinning || sliceCount === 0) return;

    setWinner(null);
    setSpinning(true);

    const winnerIndex = Math.floor(Math.random() * sliceCount);

    const currentAngleMod = ((rotation % 360) + 360) % 360;

    const winnerSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    const extraFullSpins = 5;
    const randomJitter = (Math.random() - 0.5) * (sliceAngle * 0.6);

    const deltaToTarget = (360 - winnerSliceCenter - currentAngleMod + 360) % 360;

    const targetRotation =
      rotation + extraFullSpins * 360 + deltaToTarget + randomJitter;

    setRotation(targetRotation);

    spinTimeoutRef.current = setTimeout(() => {
      setSpinning(false);
      setWinner(filteredTracks[winnerIndex]);
    }, SPIN_DURATION_MS);
  }

  function handleConfirm() {
    setWinner(null);
  }

  return (
    <div className="relative flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {MAPA_FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFiltroChange(f.value)}
            disabled={spinning}
            className={`px-3 py-1.5 rounded-sm font-mono text-[11px] tracking-wide border transition-colors disabled:opacity-50 ${
              mapaFiltro === f.value
                ? "bg-ember text-asphalt border-ember"
                : "bg-asphalt-card text-ink-faint border-asphalt-border hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sliceCount === 0 ? (
        <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-8 text-center text-ink-faint text-sm">
          Nenhuma pista cadastrada para esse mapa.
        </div>
      ) : (
        <div className="relative w-80 h-80 sm:w-96 sm:h-96">
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 24px 4px rgba(255, 90, 31, 0.35)" }}
            aria-hidden="true"
          />

          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0"
            style={{
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "20px solid #ff5a1f",
              filter: "drop-shadow(0 0 6px rgba(255, 90, 31, 0.8))",
            }}
            aria-hidden="true"
          />

          <svg
            viewBox="0 0 200 200"
            className="w-full h-full relative z-10"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.18, 0.85, 0.15, 1)`
                : "none",
            }}
          >
            <defs>
              <filter id="sliceGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#ff5a1f" floodOpacity="0.6" />
              </filter>
            </defs>

            <circle cx={100} cy={100} r={97} fill="none" stroke="#ff5a1f" strokeWidth={1.5} opacity={0.7} />

            {filteredTracks.map((track, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = startAngle + sliceAngle;
              const path = describeSlice(100, 100, 95, startAngle, endAngle);
              const labelAngle = startAngle + sliceAngle / 2;
              const labelPos = polarToCartesian(100, 100, 64, labelAngle);

              const isLeftHalf = labelAngle > 90 && labelAngle < 270;
              const textRotation = isLeftHalf
                ? labelAngle - 90 + 180
                : labelAngle - 90;

              const fillColor = SLICE_COLORS[i % SLICE_COLORS.length];
              const textColor = fillColor === "#ff5a1f" ? "#0a0a0c" : "#e8e6e1";

              return (
                <g key={track.id}>
                  <path
                    d={path}
                    fill={fillColor}
                    stroke="#ff5a1f"
                    strokeWidth={1}
                    filter="url(#sliceGlow)"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={textColor}
                    fontSize={sliceCount > 8 ? 6.5 : 8.5}
                    fontWeight={700}
                    fontFamily="Rajdhani, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
                  >
                    {truncateLabel(track.name, sliceCount > 8 ? 18 : 22)}
                  </text>
                </g>
              );
            })}
          </svg>

          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-asphalt border-2 border-ember flex items-center justify-center font-display text-xs tracking-wide text-ember hover:bg-asphalt-card transition-colors disabled:opacity-60"
            style={{ boxShadow: "0 0 16px 2px rgba(255, 90, 31, 0.5)" }}
          >
            {spinning ? <Loader2 size={18} className="animate-spin" /> : "GIRAR"}
          </button>
        </div>
      )}

      {winner && (
        <div className="fixed inset-0 z-50 bg-asphalt/95 flex flex-col items-center justify-center px-6">
          <div className="flex items-center gap-2 mb-3 opacity-0 animate-fade-in-up">
            <span className="h-px w-8 bg-ember" />
            <span className="font-mono text-[11px] text-ember tracking-[0.3em]">
              PISTA SORTEADA
            </span>
            <span className="h-px w-8 bg-ember" />
          </div>

          <h2
            className="font-display text-4xl sm:text-5xl text-center text-ink tracking-wide opacity-0 animate-fade-in-up animate-pulse-glow"
            style={{ animationDelay: "0.15s" }}
          >
            {winner.name}
          </h2>

          {winner.type && (
            <p
              className="font-mono text-sm text-ink-faint mt-3 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {winner.type}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className="mt-10 flex items-center gap-2 px-6 py-3 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.45s" }}
          >
            <Check size={16} />
            CONFIRMAR
          </button>
        </div>
      )}
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function truncateLabel(name: string, maxLength: number) {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 1)}…`;
                  }
