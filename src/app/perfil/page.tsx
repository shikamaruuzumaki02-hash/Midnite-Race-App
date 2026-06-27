import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import EditProfileForm from "@/components/EditProfileForm";
import HazardHeader from "@/components/HazardHeader";
import { User } from "lucide-react";
import type { Tournament } from "@/types/database";

export const revalidate = 0;

export default async function ProfilePage() {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");

  const supabase = createClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*");
  const list = (tournaments ?? []) as Tournament[];

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} profile={profile} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <HazardHeader icon={User} title="Meu perfil" />
          </div>

          <EditProfileForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
