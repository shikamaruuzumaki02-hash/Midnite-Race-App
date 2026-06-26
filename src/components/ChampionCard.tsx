"use client";

import { useRef } from "react";
import ExportImageButton from "@/components/ExportImageButton";
import type { Champion } from "@/types/database";

/**
 * Card colecionável estilo TCG do piloto campeão, usando uma moldura PNG
 * (public/images/moldura-campeao.png) com áreas transparentes para a foto
 * e para a placa de nome/competição. Foto e texto ficam numa camada atrás
 * da moldura, posicionados em porcentagem para alinhar com as janelas
 * vazadas da imagem. Exportável individualmente como PNG.
 */
export default function ChampionCard({ champion }: { champion: Champion }) {
  const ref = useRef<HTMLDivElement>(null);

  const gamertag = champion.driver?.gamertag ?? "?";
  const avatarUrl = champion.driver?.avatar_url;
  const tournamentName = champion.tournament?.name ?? "";
  const season = champion.tournament?.season;

  return (
    <div className="space-y-3 flex flex-col items-center">
      <div ref={ref} className="inline-block">
        <div className="relative w-[280px]" style={{ aspectRatio: "1075/1532" }}>
          {/* Camada de fundo: foto do piloto, posicionada na janela superior da moldura */}
          <div
            className="absolute bg-asphalt-card overflow-hidden"
            style={{ top: "10.8%", left: "8.2%", right: "8%", height: "57%" }}
          >
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
          </div>

          {/* Camada de fundo: nome + competição, posicionada na janela inferior da moldura */}
          <div
            className="absolute flex flex-col items-center justify-center text-center px-2"
            style={{ top: "73.5%", left: "16%", right: "16%", height: "11%" }}
          >
            <span className="font-display text-sm font-semibold text-ink tracking-wide truncate w-full">
              {gamertag}
            </span>
            <span className="font-mono text-[8px] text-ink-faint truncate w-full mt-0.5">
              {tournamentName.toUpperCase()}
              {season ? ` · T${season}` : ""}
            </span>
          </div>

          {/* Moldura, por cima de tudo */}
          <img
            src="/images/moldura-campeao.png"
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
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
