"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteDriverButton({
  driverId,
  gamertag,
}: {
  driverId: string;
  gamertag: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const { count: entryCount } = await supabase
      .from("tournament_entries")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId);

    const { count: matchCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`driver_a_id.eq.${driverId},driver_b_id.eq.${driverId}`);

    if ((entryCount && entryCount > 0) || (matchCount && matchCount > 0)) {
      setError(
        `${gamertag} já participou de torneios ou corridas e não pode ser excluído. ` +
          `Remova-o das competições primeiro, se necessário.`
      );
      setLoading(false);
      setConfirming(false);
      return;
    }

    const { error: deleteError } = await supabase.from("drivers").delete().eq("id", driverId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  if (error) {
    return <p className="text-danger text-xs font-mono">{error}</p>;
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-mono text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
        >
          {loading ? "EXCLUINDO..." : "CONFIRMAR EXCLUSÃO"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
        >
          CANCELAR
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 text-xs font-mono text-ink-faint hover:text-danger transition-colors"
    >
      <Trash2 size={12} />
      EXCLUIR
    </button>
  );
}
