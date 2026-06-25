"use client";

import { useRef } from "react";
import BracketView from "@/components/BracketView";
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
      <div ref={ref} className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5">
        <div className="mb-4">
          <span className="font-display text-sm text-ember tracking-wide">
            {tournamentName.toUpperCase()}
          </span>
        </div>
        <BracketView matches={matches} numPlayers={numPlayers} />
      </div>

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
