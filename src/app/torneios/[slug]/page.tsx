import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import ExportableLeagueTable from "@/components/ExportableLeagueTable";
import ExportableBracket from "@/components/ExportableBracket";
import HazardHeader from "@/components/HazardHeader";
import HudPanel from "@/components/HudPanel";
import { notFound } from "next/navigation";
import { Calendar, TrendingUp, Swords, MapPin, Settings } from "lucide-react";
import type { Tournament, TournamentEntry, Match } from "@/types/database";

export const revalidate = 0;

export default async function TournamentPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: allTournaments } = await supabase.from("tournaments").select("*");
  const list = (allTournaments ?? []) as Tournament[];

  const tournament = list.find((t) => t.slug === params.slug);
  if (!tournament) notFound();

  const { data: entries } = await supabase
    .from("tournament_entries")
    .select("*, driver:drivers(*)")
    .eq("tournament_id", tournament.id)
    .order("points", { ascending: false });

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      driver_a:drivers!matches_driver_a_id_fkey(*),
      driver_b:drivers!matches_driver_b_id_fkey(*),
      track:tracks(*),
      match_tracks(*, track:tracks(*))
    `)
    .eq("tournament_id", tournament.id)
    .order("created_at", { ascending: true });

  const entryList = (entries ?? []) as TournamentEntry[];
  const matchList = (matches ?? []) as Match[];
  const upcoming = matchList.filter((m) => m.status === "SCHEDULED");
  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} profile={profile} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="border-b border-asphalt-border bg-asphalt/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="px-6 lg:px-10 py-5 pl-16 lg:pl-10 max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-xl tracking-wide text-ink">{tournament.name}</h1>
                {tournament.status === "ONGOING" && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-checkpoint/10 border border-checkpoint/30 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-checkpoint animate-pulse" />
                    <span className="font-mono text-[10px] text-checkpoint tracking-wider">AO VIVO</span>
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-ink-faint mt-1">
                {tournament.season && `Temporada ${tournament.season} · `}
                {tournament.format === "KNOCKOUT" ? "Formato mata-mata" : "Pontos corridos"}
              </div>
            </div>

            {isAdmin && (
              <a
                href={`/admin/torneios/${tournament.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors"
              >
                <Settings size={15} />
                GERENCIAR
              </a>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-10 pt-8 pb-8 max-w-6xl mx-auto space-y-10">
          {upcoming.length > 0 && (
            <section>
              <HazardHeader icon={Calendar} title="Próximas corridas" />
              <div className="grid sm:grid-cols-2 gap-3">
                {upcoming.map((m) => {
                  const sortedTracks = [...(m.match_tracks ?? [])].sort(
                    (a, b) => a.position - b.position
                  );
                  const hasNewTracks = sortedTracks.length > 0;
                  const hasLegacyTrack = !hasNewTracks && !!m.track;

                  return (
                    <HudPanel
                      key={m.id}
                      className="bg-asphalt-panel border border-asphalt-border rounded-sm p-4 hover:border-asphalt-borderLight transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-ember tracking-wide mb-3">
                        <span>
                          {m.scheduled_at
                            ? new Date(m.scheduled_at).toLocaleString("pt-BR", {
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "A definir"}
                        </span>
                        <MapPin size={12} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm text-ink truncate max-w-[40%]">
                          {m.driver_a?.gamertag}
                        </span>
                        <span className="font-display text-xs text-ink-dim px-2">VS</span>
                        <span className="font-display text-sm text-ink truncate max-w-[40%]">
                          {m.driver_b?.gamertag}
                        </span>
                      </div>

                      {hasNewTracks && (
                        <div className="mt-3 pt-3 border-t border-asphalt-border flex flex-wrap gap-x-3 gap-y-1">
                          {sortedTracks.map((mt, i) => (
                            <span key={mt.id} className="font-mono text-[11px] text-ink-faint">
                              <span className="text-ember">P{i + 1}:</span> {mt.track?.name ?? "—"}
                            </span>
                          ))}
                        </div>
                      )}
                      {hasLegacyTrack && (
                        <div className="mt-3 pt-3 border-t border-asphalt-border font-mono text-[11px] text-ink-faint">
                          {m.track!.name}
                        </div>
                      )}
                    </HudPanel>
                  );
                })}
              </div>
            </section>
          )}

          {tournament.format === "LEAGUE" ? (
            <section>
              <HazardHeader icon={TrendingUp} title="Tabela de pontuação" />
              <ExportableLeagueTable entries={entryList} tournamentName={tournament.name} />
            </section>
          ) : (
            <section>
              <HazardHeader icon={Swords} title="Chave de mata-mata" />
              <ExportableBracket
                matches={matchList}
                numPlayers={entryList.length}
                tournamentName={tournament.name}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
