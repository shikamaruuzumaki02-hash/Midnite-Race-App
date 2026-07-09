import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import LandingHero from "@/components/LandingHero";
import type { Tournament } from "@/types/database";

export const revalidate = 0;

export default async function LandingPage() {
  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: tournaments } = await supabase.from("tournaments").select("*");
  const list = (tournaments ?? []) as Tournament[];

  // Eventos recentes pra alimentar o feed da homepage
  const [{ data: recentMatches }, { data: recentChampions }, { data: recentEntries }] =
    await Promise.all([
      // Corridas concluídas recentemente, com nomes dos pilotos e pistas
      supabase
        .from("matches")
        .select(`
          id,
          winner_id,
          driver_a:drivers!matches_driver_a_id_fkey(gamertag),
          driver_b:drivers!matches_driver_b_id_fkey(gamertag),
          track:tracks(name)
        `)
        .eq("status", "COMPLETED")
        .not("winner_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),

      // Campeões coroados recentemente
      supabase
        .from("champions")
        .select(`
          id,
          driver:drivers(gamertag),
          tournament:tournaments(name)
        `)
        .order("crowned_at", { ascending: false })
        .limit(3),

      // Pilotos inscritos recentemente em torneios
      supabase
        .from("tournament_entries")
        .select(`
          id,
          driver:drivers(gamertag),
          tournament:tournaments(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Monta lista de eventos reais em formato de texto
  const liveEvents: string[] = [];

  for (const m of recentMatches ?? []) {
    const a = (m.driver_a as any)?.gamertag;
    const b = (m.driver_b as any)?.gamertag;
    const winner = m.winner_id === (m.driver_a as any)?.id ? a : b;
    const track = (m.track as any)?.name;
    if (a && b) {
      liveEvents.push(
        track
          ? `${a} vs ${b} — ${winner ?? a} venceu em ${track}`
          : `${a} vs ${b} — ${winner ?? a} venceu`
      );
    }
  }

  for (const c of recentChampions ?? []) {
    const driver = (c.driver as any)?.gamertag;
    const tournament = (c.tournament as any)?.name;
    if (driver && tournament) {
      liveEvents.push(`${driver} é o campeão de ${tournament}`);
    }
  }

  for (const e of recentEntries ?? []) {
    const driver = (e.driver as any)?.gamertag;
    const tournament = (e.tournament as any)?.name;
    if (driver && tournament) {
      liveEvents.push(`${driver} entrou em ${tournament}`);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} profile={profile} loggedIn={!!userId} />
      <LandingHero liveEvents={liveEvents} />
    </div>
  );
}
