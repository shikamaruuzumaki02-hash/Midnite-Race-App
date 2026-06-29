"use client";

import { useState, useRef } from "react";
import { Loader2, Check } from "lucide-react";
import type { Track } from "@/types/database";

// Quatro tons com luminosidade mais equilibrada entre si, para evitar o
// efeito de contraste simultâneo (fatias muito claras parecem "maiores"
// que fatias muito escuras, mesmo com ângulos idênticos). Mantém o tema
// ember/asphalt, mas evita extremos: nem ember puro muito vibrante, nem
// preto quase absoluto.
const SLICE_COLORS = [
  "#b8431f", // ember escurecido
  "#3a3a40", // cinza médio (mais claro que asphalt-card puro)
  "#d9612f", // ember-light escurecido
  "#4a4a52", // cinza médio, um tom acima do anterior
];

const BORDER_COLOR = "#e8e6e1"; // ink — neutro, fora da paleta de preenchimento
const SPIN_DURATION_MS = 3200;

export default function TrackRoulette({ tracks }: { tracks: Track[] }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Track | null>(null);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sliceCount = tracks.length;
  const sliceAngle = sliceCount > 0 ? 360 / sliceCount : 0;

  function handleSpin() {
    if (spinning || sliceCount === 0) return;

    setWinner(null);
    setSpinning(true);

    const winnerIndex = Math.floor(Math.random() * sliceCount);

    // O ponteiro fica fixo no topo (0°/12h). Cada fatia i ocupa o arco
    // [i * sliceAngle, (i+1) * sliceAngle) a partir do topo, em sentido
    // horário. Para que a fatia sorteada termine sob o ponteiro, a roda
    // precisa girar até que o CENTRO dessa fatia fique em 0°.
    const winnerSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    const extraFullSpins = 5; // giros completos extra, só para o efeito visual
    const randomJitter = (Math.random() - 0.5) * (sliceAngle * 0.6); // não cair sempre no centro exato

    const targetRotation =
      rotation +
      extraFullSpins * 360 +
      (360 - winnerSliceCenter) +
      randomJitter;

    setRotation(targetRotation);

    spinTimeoutRef.current = setTimeout(() => {
      setSpinning(false);
      setWinner(tracks[winnerIndex]);
    }, SPIN_DURATION_MS);
  }

  function handleConfirm() {
    setWinner(null);
  }

  if (sliceCount === 0) {
    return (
      <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-8 text-center text-ink-faint text-sm">
        Cadastre ao menos uma pista para usar a roleta.
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Roleta */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80">
        {/* Ponteiro fixo no topo */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0"
          style={{
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "20px solid #ff5a1f",
          }}
          aria-hidden="true"
        />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.18, 0.85, 0.15, 1)`
              : "none",
          }}
        >
          {/* Anel externo, reforçando o limite visual da roleta inteira */}
          <circle cx={100} cy={100} r={96} fill="none" stroke={BORDER_COLOR} strokeWidth={2} />

          {tracks.map((track, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const path = describeSlice(100, 100, 95, startAngle, endAngle);
            const labelAngle = startAngle + sliceAngle / 2;
            const labelPos = polarToCartesian(100, 100, 60, labelAngle);

            // Texto "deitado" ao longo do raio (de dentro pra fora), como
            // numa roda de sorteio clássica. No lado esquerdo do círculo
            // (90° a 270°) somamos 180° para manter a leitura correta.
            const isLeftHalf = labelAngle > 90 && labelAngle < 270;
            const textRotation = isLeftHalf
              ? labelAngle - 90 + 180
              : labelAngle - 90;

            return (
              <g key={track.id}>
                <path
                  d={path}
                  fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                  stroke={BORDER_COLOR}
                  strokeWidth={1.5}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#e8e6e1"
                  fontSize={sliceCount > 8 ? 7 : 9}
                  fontWeight={600}
                  fontFamily="Rajdhani, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
                >
                  {truncateLabel(track.name, sliceCount > 8 ? 10 : 14)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Centro decorativo — cor neutra, fora da paleta das fatias */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-asphalt border-2 border-ink" />
      </div>

      <button
        type="button"
        onClick={handleSpin}
        disabled={spinning}
        className="mt-6 flex items-center gap-2 px-6 py-3 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
      >
        {spinning ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            GIRANDO...
          </>
        ) : (
          "GIRAR"
        )}
      </button>

      {/* Overlay de resultado */}
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
  // Ângulo 0 apontando para cima (12h), sentido horário — para bater com
  // a orientação do ponteiro fixo no topo.
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
