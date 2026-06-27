import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import ChampionCard from "@/components/ChampionCard";
import HazardHeader from "@/components/HazardHeader";
import { Crown } from "lucide-react";
import type { Tournament, Champion } from "@/types/database";

export const revalidate = 0;

export default async function HallOfChampionsPage() {
  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: tournaments } = await supabase.from("tournaments").select("*");
  const list = (tournaments ?? []) as Tournament[];

  const { data: champions } = await supabase
    .from("champions")
    .select("*, driver:drivers(*), tournament:tournaments(*)")
    .order("crowned_at", { ascending: false });

  const championList = (champions ?? []) as Champion[];

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} profile={profile} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <HazardHeader icon={Crown} title="Hall dos Campeões" />

          {championList.length === 0 ? (
            <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-10 text-center text-ink-faint text-sm mt-6">
              Nenhum campeão coroado ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {championList.map((c) => (
                <ChampionCard key={c.id} champion={c} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
