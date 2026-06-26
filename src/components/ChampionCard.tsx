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
    <div className="space-y-3 flex flex-col items-center">
      <div ref={ref} className="inline-block p-2">
        <div
          className="w-[272px] rounded-lg p-[3px]"
          style={{
            background: "linear-gradient(155deg, #ffb84f 0%, #ff5a1f 45%, #b33d10 100%)",
            boxShadow: "0 0 18px 1px rgba(255, 90, 31, 0.35)",
          }}
        >
          <HudPanel
            cornerColor="border-ember"
            className="bg-asphalt-panel rounded-md overflow-hidden box-content"
          >
            {/* Faixa do topo */}
            <div
              className="relative px-3 py-2.5 flex items-center justify-center gap-2 overflow-hidden border-b border-ember/30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, #0a0a0c 0px, #0a0a0c 9px, #1a1108 9px, #1a1108 18px)",
              }}
            >
              <Crown size={14} className="text-ember relative z-10" fill="currentColor" />
              <span className="font-display text-xs tracking-[0.25em] text-ember relative z-10">
                CAMPEÃO
              </span>
            </div>

            {/* Foto em destaque */}
            <div className="aspect-square bg-asphalt-card relative">
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
              <div className="absolute inset-0 bg-gradient-to-t from-asphalt-panel via-transparent to-transparent opacity-70" />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-asphalt-panel/60 to-transparent" />
            </div>

            {/* Nome + selo, com grade sutil de fundo */}
            <div
              className="relative px-4 pt-3 pb-4 text-center border-t border-ember/20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,90,31,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,90,31,0.05) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            >
              <span className="font-display text-xl font-semibold text-ink tracking-wide block">
                {gamertag}
              </span>

              <div className="flex items-center justify-center mt-3">
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
            </div>
          </HudPanel>
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
