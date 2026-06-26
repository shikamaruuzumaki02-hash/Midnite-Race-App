"use client";

import { useRef } from "react";
import { Crown } from "lucide-react";
import ExportImageButton from "@/components/ExportImageButton";
import type { Champion } from "@/types/database";

/**
 * Card colecionável estilo TCG do piloto campeão, com moldura metálica
 * (gradientes simulando metal escovado + "parafusos" nos cantos), janela
 * de foto encaixada, e placa metálica inferior com nome e competição.
 * Exportável individualmente como PNG.
 */
export default function ChampionCard({ champion }: { champion: Champion }) {
  const ref = useRef<HTMLDivElement>(null);

  const gamertag = champion.driver?.gamertag ?? "?";
  const avatarUrl = champion.driver?.avatar_url;
  const tournamentName = champion.tournament?.name ?? "";
  const season = champion.tournament?.season;

  const metalGradient =
    "linear-gradient(155deg, #8a8a8e 0%, #4a4a4d 18%, #6e6e72 35%, #2e2e30 55%, #79797d 72%, #3a3a3c 88%, #8a8a8e 100%)";

  return (
    <div className="space-y-3 flex flex-col items-center">
      <div ref={ref} className="inline-block p-2">
        <div
          className="w-[272px] rounded-lg p-3 relative"
          style={{
            background: metalGradient,
            boxShadow:
              "0 0 20px 2px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {/* Parafusos nos 4 cantos da moldura externa */}
          <Rivet className="top-2 left-2" />
          <Rivet className="top-2 right-2" />
          <Rivet className="bottom-2 left-2" />
          <Rivet className="bottom-2 right-2" />

          {/* Faixa do topo com título */}
          <div className="flex items-center justify-center gap-2 pb-2.5 mb-2.5 border-b border-black/40">
            <Crown size={14} className="text-ember" fill="currentColor" />
            <span
              className="font-display text-xs tracking-[0.25em] text-ink"
              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.6)" }}
            >
              CAMPEÃO
            </span>
          </div>

          {/* Janela da foto, encaixada com borda metálica própria */}
          <div
            className="aspect-square relative rounded-sm p-1.5"
            style={{
              background: metalGradient,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)",
            }}
          >
            <div className="w-full h-full rounded-[2px] overflow-hidden relative bg-asphalt-card border border-ember/30">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={gamertag}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-5xl text-ember/40">
                  {gamertag.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Vinheta sutil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            </div>
          </div>

          {/* Espaço com textura tipo "carbono" entre a foto e a placa */}
          <div
            className="h-5 mt-2.5 rounded-sm"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #111 25%, #1a1a1a 25%, #1a1a1a 50%, #111 50%, #111 75%, #1a1a1a 75%, #1a1a1a 100%)",
              backgroundSize: "6px 6px",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
            }}
          />

          {/* Placa metálica inferior com nome e competição */}
          <div
            className="mt-2.5 rounded-sm p-3 relative"
            style={{
              background: metalGradient,
              boxShadow:
                "inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            <Rivet className="top-1.5 left-1.5" small />
            <Rivet className="top-1.5 right-1.5" small />
            <Rivet className="bottom-1.5 left-1.5" small />
            <Rivet className="bottom-1.5 right-1.5" small />

            <div className="bg-asphalt-panel/90 rounded-[2px] px-3 py-3 text-center border border-black/40">
              <span className="font-display text-lg font-semibold text-ink tracking-wide block">
                {gamertag}
              </span>
              <div className="mt-2 pt-2 border-t border-ember/20">
                <div className="font-display text-[11px] text-ember tracking-wide truncate">
                  {tournamentName.toUpperCase()}
                </div>
                {season && (
                  <div className="font-mono text-[9px] text-ink-faint mt-0.5">
                    TEMPORADA {season}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExportImageButton
        targetRef={ref}
        fileName={`campeao-${gamertag.toLowerCase().replace(/\s+/g, "-")}.png`}
        label="EXPORTAR CARD"
      />
    </div>
  );
}

function Rivet({ className = "", small = false }: { className?: string; small?: boolean }) {
  const size = small ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <div
      className={`absolute ${size} rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 35%, #cfcfd2, #6a6a6d 60%, #2e2e30 100%)",
        boxShadow: "0 1px 1px rgba(0,0,0,0.6)",
      }}
    />
  );
}
