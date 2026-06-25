import Link from "next/link";
import { Swords, TrendingUp, ChevronRight } from "lucide-react";
import HudPanel from "@/components/HudPanel";
import type { Tournament } from "@/types/database";

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const isKnockout = tournament.format === "KNOCKOUT";
  const isOngoing = tournament.status === "ONGOING";
  const isFinished = tournament.status === "FINISHED";

  return (
    <Link href={`/torneios/${tournament.slug}`} className="group block">
      <HudPanel
        cornerColor={isKnockout ? "border-ember" : "border-checkpoint"}
        className="flex bg-asphalt-panel border border-asphalt-border rounded-sm overflow-hidden group-hover:border-ember/50 transition-colors"
      >
        {/* Faixa lateral colorida: âmbar para mata-mata, esverdeado-checkpoint para liga */}
        <div
          className={`w-1.5 shrink-0 ${isKnockout ? "bg-ember" : "bg-checkpoint"}`}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0 px-5 py-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {isKnockout ? (
                  <Swords size={13} className="text-ember shrink-0" />
                ) : (
                  <TrendingUp size={13} className="text-checkpoint shrink-0" />
                )}
                <span className="font-mono text-[10px] text-ink-dim tracking-wider">
                  {isKnockout ? "MATA-MATA" : "PONTOS CORRIDOS"}
                  {tournament.season && ` · ${tournament.season}`}
                </span>
              </div>
              <h2 className="font-display text-lg lg:text-xl tracking-wide text-ink truncate group-hover:text-ember transition-colors">
                {tournament.name}
              </h2>
            </div>

            <StatusBadge isOngoing={isOngoing} isFinished={isFinished} />
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-asphalt-border">
            <span className="font-mono text-[11px] text-ink-faint">
              {tournament.start_date
                ? new Date(tournament.start_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                : "Data a definir"}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-ink-faint group-hover:text-ember transition-colors">
              VER COMPETIÇÃO
              <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </HudPanel>
    </Link>
  );
}

function StatusBadge({ isOngoing, isFinished }: { isOngoing: boolean; isFinished: boolean }) {
  if (isOngoing) {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 bg-checkpoint/10 border border-checkpoint/30 rounded-sm shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-checkpoint animate-pulse" />
        <span className="font-mono text-[10px] text-checkpoint tracking-wider">AO VIVO</span>
      </span>
    );
  }

  if (isFinished) {
    return (
      <span className="px-2 py-1 bg-asphalt-card border border-asphalt-border rounded-sm shrink-0">
        <span className="font-mono text-[10px] text-ink-dim tracking-wider">ENCERRADO</span>
      </span>
    );
  }

  return (
    <span className="px-2 py-1 bg-asphalt-card border border-asphalt-border rounded-sm shrink-0">
      <span className="font-mono text-[10px] text-ink-faint tracking-wider">EM BREVE</span>
    </span>
  );
}
