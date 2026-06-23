import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import AddEntryForm from "@/components/AddEntryForm";
import AdminEntryRow from "@/components/AdminEntryRow";
import CrownChampionForm from "@/components/CrownChampionForm";
import Link from "next/link";
import { Settings, Users, TrendingUp, ExternalLink } from "lucide-react";
import type { Tournament, TournamentEntry, Driver } from "@/types/database";

export const revalidate = 0;

export default async function ManageTournamentPage({ params }: { params: { id: string } }) {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile?.role !== "ADMIN") redirect("/");

  const supabase = createClient();

  const { data: allTournaments } = await supabase.from("tournaments").select("*");
  const list = (allTournaments ?? []) as Tournament[];

  const tournament = list.find((t) => t.id === params.id);
  if (!tournament) notFound();

  const { data: entries } = await supabase
    .from("tournament_entries")
    .select("*, driver:drivers(*)")
    .eq("tournament_id", tournament.id)
    .order("points", { ascending: false });

  const entryList = (entries ?? []) as TournamentEntry[];

  const { data: allDrivers } = await supabase.from("drivers").select("*").order("gamertag");
  const driverList = (allDrivers ?? []) as Driver[];
  const enrolledIds = new Set(entryList.map((e) => e.driver_id));
  const availableDrivers = driverList.filter((d) => !enrolledIds.has(d.id));

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Settings size={18} className="text-ember" />
              <h1 className="font-display text-xl tracking-wide text-ink">
                GERENCIAR · {tournament.name.toUpperCase()}
              </h1>
            </div>
            <Link
              href={`/torneios/${tournament.slug}`}
              className="flex items-center gap-1.5 text-xs font-mono text-ink-faint hover:text-ember transition-colors"
            >
              VER PÁGINA PÚBLICA <ExternalLink size={12} />
            </Link>
          </div>

          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <Users size={17} className="text-ember" />
              <h2 className="font-display text-base tracking-wide text-ink">INSCREVER PILOTO</h2>
            </div>
            <AddEntryForm tournamentId={tournament.id} availableDrivers={availableDrivers} />
            {driverList.length === 0 && (
              <p className="text-sm text-ink-faint mt-3">
                Nenhum piloto cadastrado na plataforma ainda.{" "}
                <Link href="/admin/pilotos/novo" className="text-ember hover:text-ember-light">
                  Cadastrar um piloto →
                </Link>
              </p>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <TrendingUp size={17} className="text-ember" />
              <h2 className="font-display text-base tracking-wide text-ink">PILOTOS INSCRITOS</h2>
            </div>
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
                    <th className="text-right px-4 py-3">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {entryList.map((entry, i) => (
                    <AdminEntryRow key={entry.id} entry={entry} index={i} />
                  ))}
                  {entryList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-faint text-sm">
                        Nenhum piloto inscrito ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {entryList.length > 0 && tournament.status !== "FINISHED" && (
            <section>
              <CrownChampionForm tournamentId={tournament.id} entries={entryList} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
