"use client";

import { useRef } from "react";
import BracketView from "@/components/BracketView";
import HudPanel from "@/components/HudPanel";
import ExportImageButton from "@/components/ExportImageButton";
import type { Match } from "@/types/database";

export default function ExportableBracket({
  matches,
  numPlayers,
  tournamentName,
}: {
  matches: Match[];
  numPlayers: number;
  tournamentName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      {/* Versão visível na tela, com scroll horizontal normal */}
      <HudPanel className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5">
        <div className="mb-4">
          <span className="font-display text-sm text-ember tracking-wide">
            {tournamentName.toUpperCase()}
          </span>
        </div>
        <BracketView matches={matches} numPlayers={numPlayers} scrollable={true} />
      </HudPanel>

      {/*
        Versão usada apenas para exportação: sem scroll, com todas as
        rodadas expostas lado a lado. Fica fora da tela (position fixed
        + opacidade zero), mas continua no DOM para que o html-to-image
        consiga capturá-la por completo, sem cortes.
      */}
      {matches.length > 0 && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
          <div ref={ref} className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5 inline-block">
            <div className="mb-4">
              <span className="font-display text-sm text-ember tracking-wide">
                {tournamentName.toUpperCase()}
              </span>
            </div>
            <BracketView matches={matches} numPlayers={numPlayers} scrollable={false} />
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <ExportImageButton
          targetRef={ref}
          fileName={`chave-${tournamentName.toLowerCase().replace(/\s+/g, "-")}.png`}
          label="EXPORTAR CHAVE"
        />
      )}
    </div>
  );
}
