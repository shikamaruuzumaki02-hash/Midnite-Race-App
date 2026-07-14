import { Crown } from "lucide-react";
import DriverAvatar from "@/components/DriverAvatar";

export default function ChampionReveal({
  gamertag,
  avatarUrl,
  tournamentName,
}: {
  gamertag: string;
  avatarUrl?: string | null;
  tournamentName?: string;
}) {
  return (
    <div className="relative w-60 shrink-0 mx-auto animate-fade-in-up">
      {/* Holofote atrás do avatar */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-ember/30 blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative overflow-hidden rounded-sm border border-ember/40 bg-asphalt-panel">
        {/* Tarja quadriculada, estilo bandeira de chegada */}
        <div
          className="h-2 w-full opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #e8e6e1 25%, transparent 25%), linear-gradient(-45deg, #e8e6e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e8e6e1 75%), linear-gradient(-45deg, transparent 75%, #e8e6e1 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        />

        {/* Scanline sutil, restrita a esse card */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Brilho passando pela ficha */}
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sweep-light" />

        <div className="relative flex flex-col items-center gap-3 px-5 py-6 text-center">
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-ink-faint">
            <Crown size={11} className="text-ember" />
            FICHA DE CAMPEÃO
          </span>

          <div className="relative py-1">
            <div className="absolute inset-1 rounded-md ring-2 ring-ember/60 animate-pulse-glow" />
            <div className="scale-125">
              <DriverAvatar gamertag={gamertag} avatarUrl={avatarUrl} size="lg" />
            </div>
          </div>

          <div className="space-y-0.5 pt-1">
            <h3 className="font-blackletter text-3xl text-ember leading-none">Campeão</h3>
            <p className="font-display text-lg font-semibold text-ink leading-tight">
              {gamertag}
            </p>
          </div>

          {tournamentName && (
            <div className="w-full border-t border-asphalt-border pt-2.5 mt-1">
              <p className="font-mono text-[10px] tracking-wider text-ink-faint">TORNEIO</p>
              <p className="font-mono text-xs text-ink-muted">{tournamentName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
