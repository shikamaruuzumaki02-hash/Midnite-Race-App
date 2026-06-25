"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Driver } from "@/types/database";

export default function EditDriverForm({ driver }: { driver: Driver }) {
  const router = useRouter();
  const supabase = createClient();

  const [gamertag, setGamertag] = useState(driver.gamertag);
  const [realName, setRealName] = useState(driver.real_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(driver.avatar_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("drivers")
      .update({
        gamertag,
        real_name: realName || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", driver.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/pilotos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
          GAMERTAG (NOME DO PILOTO)
        </label>
        <input
          type="text"
          value={gamertag}
          onChange={(e) => setGamertag(e.target.value)}
          required
          className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
          NOME REAL (OPCIONAL)
        </label>
        <input
          type="text"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
          URL DA FOTO (OPCIONAL)
        </label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ember transition-colors"
        />
      </div>

      {error && <p className="text-danger text-xs font-mono">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-ember text-asphalt font-display tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
      >
        {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
      </button>
    </form>
  );
}
