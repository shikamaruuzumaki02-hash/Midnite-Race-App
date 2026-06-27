"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUploadField from "@/components/AvatarUploadField";
import { Loader2, Save, LogOut } from "lucide-react";
import type { Profile } from "@/types/database";

export default function EditProfileForm({ profile }: { profile: Profile | null }) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(profile?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ name: name.trim() || null, avatar_url: avatarUrl || null })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      setError(`Erro ao salvar: ${updateError.message}`);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-5">
        <AvatarUploadField
          currentUrl={avatarUrl}
          onUploaded={(url) => setAvatarUrl(url)}
          bucket="profile-avatars"
          label="FOTO DE PERFIL"
        />

        <div>
          <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
            NOME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você quer ser chamado"
            maxLength={60}
            className="w-full px-3 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:border-ember transition-colors"
          />
        </div>

        {error && <p className="text-danger text-xs font-mono">{error}</p>}
        {success && (
          <p className="text-checkpoint text-xs font-mono">Perfil atualizado com sucesso.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-ember text-asphalt font-display text-sm tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              SALVANDO...
            </>
          ) : (
            <>
              <Save size={14} />
              SALVAR
            </>
          )}
        </button>
      </form>

      <div className="pt-6 border-t border-asphalt-border">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm text-sm font-mono text-danger hover:border-danger transition-colors disabled:opacity-50"
        >
          {loggingOut ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              SAINDO...
            </>
          ) : (
            <>
              <LogOut size={14} />
              SAIR DA CONTA
            </>
          )}
        </button>
      </div>
    </div>
  );
}
