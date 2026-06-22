import { createBrowserClient } from "@supabase/ssr";

// Cliente usado dentro de componentes que rodam no navegador
// (ex: formulário de login, botões de ação do admin).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
