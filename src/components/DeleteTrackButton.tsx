"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteTrackButton({ trackId }: { trackId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const { error: deleteError } = await supabase.from("tracks").delete().eq("id", trackId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  if (error) {
    return <p className="text-danger text-xs font-mono mt-2">{error}</p>;
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs font-mono text-ink-faint">Tem certeza?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-mono text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              EXCLUINDO...
            </>
          ) : (
            "SIM, EXCLUIR"
          )}
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
