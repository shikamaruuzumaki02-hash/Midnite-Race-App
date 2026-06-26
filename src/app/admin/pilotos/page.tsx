import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import DeleteDriverButton from "@/components/DeleteDriverButton";
import DriverAvatar from "@/components/DriverAvatar";
import HazardHeader from "@/components/HazardHeader";
import HudPanel from "@/components/HudPanel";
import Link from "next/link";
import { Users, Plus, Pencil } from "lucide-react";
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
          <div className="flex items-center justify-between gap-3 mb-6">
            <HazardHeader icon={Users} title="Pilotos" />
            <Link
              href="/admin/pilotos/novo"
              className="flex items-center gap-2 px-4 py-2 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors shrink-0"
            >
              <Plus size={15} />
              NOVO
            </Link>
          </div>

          {driverList.length === 0 ? (
            <div className="bg-asphalt-panel border border-asphalt-border rounded-sm p-10 text-center text-ink-faint text-sm">
              Nenhum piloto cadastrado ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {driverList.map((d) => (
                <HudPanel
                  key={d.id}
                  className="bg-asphalt-panel border border-asphalt-border rounded-sm p-4 flex items-center gap-3"
                >
                  <DriverAvatar gamertag={d.gamertag} avatarUrl={d.avatar_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm text-ink truncate">{d.gamertag}</div>
                    {d.real_name && (
                      <div className="font-mono text-[11px] text-ink-faint truncate">{d.real_name}</div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Link
                        href={`/admin/pilotos/${d.id}/editar`}
                        className="flex items-center gap-1 text-xs font-mono text-ink-faint hover:text-ember transition-colors"
                      >
                        <Pencil size={12} />
                        EDITAR
                      </Link>
                      <DeleteDriverButton driverId={d.id} gamertag={d.gamertag} />
                    </div>
                  </div>
                </HudPanel>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
