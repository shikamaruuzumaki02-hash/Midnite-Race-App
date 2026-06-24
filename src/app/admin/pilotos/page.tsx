import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import type { Tournament, Driver } from "@/types/database";

export const revalidate = 0;

export default async function DriversPage() {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile?.role !== "ADMIN") redirect("/");

  const supabase = createClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*");
  const list = (tournaments ?? []) as Tournament[];

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("gamertag", { ascending: true });

  const driverList = (drivers ?? []) as Driver[];

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Users size={18} className="text-ember" />
              <h1 className="font-display text-xl tracking-wide text-ink">PILOTOS</h1>
            </div>
            <Link
              href="/admin/pilotos/novo"
              className="flex items-center gap-2 px-4 py-2 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors"
            >
              <Plus size={15} />
              NOVO PILOTO
            </Link>
          </div>

          {driverList.length === 0 ? (
            <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-10 text-center text-ink-faint text-sm">
              Nenhum piloto cadastrado ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {driverList.map((d) => (
                <div
                  key={d.id}
                  className="bg-asphalt-panel border border-asphalt-border rounded-sm p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-sm bg-asphalt-card border border-asphalt-border flex items-center justify-center shrink-0 font-display text-sm text-ink-muted overflow-hidden">
                    {d.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatar_url} alt={d.gamertag} className="w-full h-full object-cover" />
                    ) : (
                      d.gamertag.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-sm text-ink truncate">{d.gamertag}</div>
                    {d.real_name && (
                      <div className="font-mono text-[11px] text-ink-faint truncate">{d.real_name}</div>
                    )}
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
