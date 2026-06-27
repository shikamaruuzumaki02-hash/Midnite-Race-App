import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import HomeHero from "@/components/HomeHero";
import TournamentCard from "@/components/TournamentCard";
import Link from "next/link";
import type { Tournament } from "@/types/database";

export const revalidate = 0;

export default async function CompeticoesPage() {
  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (tournaments ?? []) as Tournament[];

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} profile={profile} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <HomeHero />

          {list.length === 0 ? (
            <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-10 text-center text-ink-faint text-sm">
              Nenhuma competição cadastrada ainda.
              {profile?.role === "ADMIN" && (
                <div className="mt-4">
                  <Link href="/admin/torneios/novo" className="text-ember hover:text-ember-light">
                    Criar a primeira competição →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {list.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
