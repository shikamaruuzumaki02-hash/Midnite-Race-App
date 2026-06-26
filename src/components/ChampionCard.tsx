"use client";

import { useRef } from "react";
import { Crown } from "lucide-react";
import HudPanel from "@/components/HudPanel";
import ExportImageButton from "@/components/ExportImageButton";
import type { Champion } from "@/types/database";

/**
 * Card colecionável estilo TCG do piloto campeão. Foto em destaque,
 * nome, e a competição da qual foi campeão. Cada card é exportável
 * individualmente como PNG.
 */
export default function ChampionCard({ champion }: { champion: Champion }) {
  const ref = useRef<HTMLDivElement>(null);

  const gamertag = champion.driver?.gamertag ?? "?";
  const avatarUrl = champion.driver?.avatar_url;
  const tournamentName = champion.tournament?.name ?? "";
  const season = champion.tournament?.season;

  return (
    <div className="space-y-3">
      <div ref={ref} className="w-full max-w-[280px] mx-auto">
        <HudPanel
          cornerColor="border-ember"
          className="bg-asphalt-panel border-2 border-ember/40 rounded-md overflow-hidden"
        >
          {/* Faixa diagonal no topo, reaproveitando o padrão do HazardHeader */}
          <div
            className="relative px-3 py-2 flex items-center justify-center gap-1.5 overflow-hidden"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #0a0a0c 0px, #0a0a0c 10px, #ff5a1f 10px, #ff5a1f 20px)",
            }}
          >
            <div className="absolute inset-0 bg-asphalt/70" />
            <Crown size={14} className="text-ember relative z-10" />
            <span className="font-display text-xs tracking-[0.2em] text-ember relative z-10">
              CAMPEÃO
            </span>
          </div>

          {/* Foto em destaque */}
          <div className="aspect-square bg-asphalt-card border-b border-asphalt-border relative">
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
            {/* Vinheta sutil pra integrar a foto ao card */}
            <div className="absolute inset-0 bg-gradient-to-t from-asphalt-panel via-transparent to-transparent opacity-60" />
          </div>

          {/* Nome do piloto */}
          <div className="px-4 pt-3 pb-2 text-center">
            <span className="font-display text-xl font-semibold text-ink tracking-wide">
              {gamertag}
            </span>
          </div>

          {/* Selo com a competição */}
          <div className="px-4 pb-4 flex items-center justify-center">
            <div className="border border-checkpoint/40 bg-checkpoint/10 rounded-sm px-3 py-1.5 text-center max-w-full">
              <div className="font-display text-[11px] text-checkpoint tracking-wide truncate">
                {tournamentName.toUpperCase()}
              </div>
              {season && (
                <div className="font-mono text-[9px] text-checkpoint/70 mt-0.5">
                  TEMPORADA {season}
                </div>
              )}
            </div>
          </div>
        </HudPanel>
      </div>

      <div className="flex justify-center">
        <ExportImageButton
          targetRef={ref}
          fileName={`campeao-${gamertag.toLowerCase().replace(/\s+/g, "-")}.png`}
          label="EXPORTAR CARD"
        />
      </div>
    </div>
  );
}
