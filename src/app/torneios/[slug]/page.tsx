import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
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
    .select("*, driver_a:drivers!matches_driver_a_id_fkey(*), driver_b:drivers!matches_driver_b_id_fkey(*), track:tracks(*)")
    .eq("tournament_id", tournament.id)
    .order("scheduled_at", { ascending: true });

  const entryList = (entries ?? []) as TournamentEntry[];
  const matchList = (matches ?? []) as Match[];
  const upcoming = matchList.filter((m) => m.status === "SCHEDULED");
  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

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
              <SectionHeader icon={Calendar} title="Próximas corridas" />
              <div className="grid sm:grid-cols-2 gap-3">
                {upcoming.map((m) => (
                  <div
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
                    {m.track && (
                      <div className="mt-3 pt-3 border-t border-asphalt-border font-mono text-[11px] text-ink-faint">
                        {m.track.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {tournament.format === "LEAGUE" ? (
            <section>
              <SectionHeader icon={TrendingUp} title="Tabela de pontuação" />
              <div className="bg-asphalt-panel border border-asphalt-border rounded-sm overflow-hidden">
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
                    {entryList.map((entry, i) => (
                      <tr
                        key={entry.id}
                        className="border-b border-asphalt-border/60 last:border-0 hover:bg-asphalt-card transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-ink-faint">{i + 1}</td>
                        <td className="px-4 py-3 font-display text-sm text-ink truncate max-w-[160px]">
                          {entry.driver?.gamertag}
                          {entry.disqualified && (
                            <span className="ml-2 text-[10px] font-mono text-danger">DESCLASSIFICADO</span>
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
                    {entryList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-ink-faint text-sm">
                          Nenhum piloto inscrito ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section>
              <SectionHeader icon={Swords} title="Chave de mata-mata" />
              <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-6 space-y-3">
                {matchList.length === 0 ? (
                  <p className="text-center text-ink-faint text-sm py-6">
                    A chave ainda não foi montada.
                  </p>
                ) : (
                  matchList.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-4 py-3 bg-asphalt-card rounded-sm"
                    >
                      <span className="font-mono text-[10px] text-ink-dim w-20">{m.round}</span>
                      <span
                        className={`font-display text-sm flex-1 text-right pr-3 ${
                          m.winner_id === m.driver_a_id ? "text-checkpoint" : "text-ink"
                        }`}
                      >
                        {m.driver_a?.gamertag}
                      </span>
                      <span className="font-mono text-xs text-ink-dim px-2">vs</span>
                      <span
                        className={`font-display text-sm flex-1 pl-3 ${
                          m.winner_id === m.driver_b_id ? "text-checkpoint" : "text-ink"
                        }`}
                      >
                        {m.driver_b?.gamertag}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={17} className="text-ember" />
      <h2 className="font-display text-base tracking-wide text-ink">{title.toUpperCase()}</h2>
    </div>
  );
}
