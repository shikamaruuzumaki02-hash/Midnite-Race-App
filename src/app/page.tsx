import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Flag } from "lucide-react";
import type { Tournament } from "@/types/database";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (tournaments ?? []) as Tournament[];

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <Flag size={18} className="text-ember" />
            <h1 className="font-display text-xl tracking-wide text-ink">COMPETIÇÕES</h1>
          </div>

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
            <div className="grid sm:grid-cols-2 gap-4">
              {list.map((t) => (
                <Link
                  key={t.id}
                  href={`/torneios/${t.slug}`}
                  className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5 hover:border-asphalt-borderLight transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display text-base tracking-wide text-ink">{t.name}</h2>
                    {t.status === "ONGOING" && (
                      <span className="w-2 h-2 rounded-full bg-checkpoint" />
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-ink-faint">
                    {t.format === "KNOCKOUT" ? "Mata-mata" : "Pontos corridos"}
                    {t.season && ` · ${t.season}`}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
