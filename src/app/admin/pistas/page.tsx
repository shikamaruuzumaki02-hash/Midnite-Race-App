import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import NewTrackForm from "@/components/NewTrackForm";
import { MapPin } from "lucide-react";
import type { Tournament, Track } from "@/types/database";

export const revalidate = 0;

export default async function TracksPage() {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile?.role !== "ADMIN") redirect("/");

  const supabase = createClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*");
  const list = (tournaments ?? []) as Tournament[];

  const { data: tracks } = await supabase.from("tracks").select("*").order("name");
  const trackList = (tracks ?? []) as Track[];

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto space-y-10">
          <div className="flex items-center gap-2.5">
            <MapPin size={18} className="text-ember" />
            <h1 className="font-display text-xl tracking-wide text-ink">PISTAS</h1>
          </div>

          <section>
            <h2 className="font-display text-base tracking-wide text-ink mb-4">NOVA PISTA</h2>
            <NewTrackForm />
          </section>

          <section>
            <h2 className="font-display text-base tracking-wide text-ink mb-4">CADASTRADAS</h2>
            {trackList.length === 0 ? (
              <p className="text-sm text-ink-faint">Nenhuma pista cadastrada ainda.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {trackList.map((t) => (
                  <div
                    key={t.id}
                    className="bg-asphalt-panel border border-asphalt-border rounded-sm p-4"
                  >
                    <div className="font-display text-sm text-ink">{t.name}</div>
                    {t.type && (
                      <div className="font-mono text-[11px] text-ink-faint mt-0.5">{t.type}</div>
                    )}
                    {t.description && (
                      <div className="text-xs text-ink-muted mt-2">{t.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
