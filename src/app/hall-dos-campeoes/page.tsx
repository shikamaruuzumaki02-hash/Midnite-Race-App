import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
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
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <Crown size={18} className="text-ember" />
            <h1 className="font-display text-xl tracking-wide text-ink">HALL DOS CAMPEÕES</h1>
          </div>

          {championList.length === 0 ? (
            <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-10 text-center text-ink-faint text-sm">
              Nenhum campeão coroado ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {championList.map((c) => (
                <div
                  key={c.id}
                  className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-sm bg-ember/10 border border-ember/30 flex items-center justify-center shrink-0">
                    <Crown size={20} className="text-ember" />
                  </div>
                  <div>
                    <div className="font-display text-base text-ink">{c.driver?.gamertag}</div>
                    <div className="font-mono text-[11px] text-ink-faint mt-0.5">
                      {c.tournament?.name} · {c.tournament?.season}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
