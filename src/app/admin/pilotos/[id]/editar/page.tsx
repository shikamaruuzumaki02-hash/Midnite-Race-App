import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import EditDriverForm from "@/components/EditDriverForm";
import { Pencil } from "lucide-react";
import type { Tournament, Driver } from "@/types/database";

export const revalidate = 0;

export default async function EditDriverPage({ params }: { params: { id: string } }) {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile?.role !== "ADMIN") redirect("/");

  const supabase = createClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*");
  const list = (tournaments ?? []) as Tournament[];

  const { data: driver } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!driver) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <Pencil size={18} className="text-ember" />
            <h1 className="font-display text-xl tracking-wide text-ink">
              EDITAR · {(driver as Driver).gamertag.toUpperCase()}
            </h1>
          </div>

          <EditDriverForm driver={driver as Driver} />
        </div>
      </main>
    </div>
  );
}
