import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

// Busca o usuário logado (se houver) e seu perfil (incluindo a role).
// Usado no topo de cada página pra decidir o que mostrar.
export async function getCurrentProfile(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  return { userId: userData.user.id, profile: profile as Profile | null };
}
