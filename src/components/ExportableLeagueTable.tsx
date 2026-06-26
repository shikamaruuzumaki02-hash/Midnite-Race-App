"use client";

import { useRef } from "react";
import HudPanel from "@/components/HudPanel";
import ExportImageButton from "@/components/ExportImageButton";
import DriverAvatar from "@/components/DriverAvatar";
import type { TournamentEntry } from "@/types/database";

export default function ExportableLeagueTable({
  entries,
  tournamentName,
}: {
  entries: TournamentEntry[];
  tournamentName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <div ref={ref}>
        <HudPanel className="bg-asphalt-panel border border-asphalt-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-asphalt-border">
            <span className="font-display text-sm text-ember tracking-wide">
              {tournamentName.toUpperCase()}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-asphalt-border font-mono text-[10px] text-ink-dim tracking-wider">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">PILOTO</th>
                <th className="text-center px-3 py-3">PTS</th>
                <th className="text-center px-3 py-3">V</th>
                <th className="text-center px-3 py-3">D</th>
                <th className="text-center px-3 py-3">E</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className="border-b border-asphalt-border/60 last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-ink-faint">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 max-w-[180px]">
                      <DriverAvatar
                        gamertag={entry.driver?.gamertag ?? "?"}
                        avatarUrl={entry.driver?.avatar_url}
                        size="sm"
                      />
                      <span className="font-display text-sm text-ink truncate">
                        {entry.driver?.gamertag}
                      </span>
                    </div>
                    {entry.disqualified && (
                      <span className="ml-9 text-[10px] font-mono text-danger">DESCLASSIFICADO</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-semibold text-ink">
                    {entry.points}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-checkpoint">{entry.wins}</td>
                  <td className="px-3 py-3 text-center font-mono text-danger">{entry.losses}</td>
                  <td className="px-3 py-3 text-center font-mono text-ink-faint">{entry.draws}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint text-sm">
                    Nenhum piloto inscrito ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </HudPanel>
      </div>

      {entries.length > 0 && (
        <ExportImageButton
          targetRef={ref}
          fileName={`tabela-${tournamentName.toLowerCase().replace(/\s+/g, "-")}.png`}
          label="EXPORTAR TABELA"
        />
      )}
    </div>
  );
}
