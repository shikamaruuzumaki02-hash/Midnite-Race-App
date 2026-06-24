"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, AlertTriangle } from "lucide-react";
import type { Tournament } from "@/types/database";

export default function DeleteTournamentForm({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"idle" | "confirm1" | "confirm2">("idle");
  const [typedName, setTypedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameMatches = typedName.trim() === tournament.name.trim();

  async function handleDelete() {
    setLoading(true);
    setError(null);

    // Apaga primeiro os dados ligados ao torneio (a tabela não teria
    // permissão de cascata configurada para todas as relações).
    await supabase.from("matches").delete().eq("tournament_id", tournament.id);
    await supabase.from("tournament_entries").delete().eq("tournament_id", tournament.id);
    await supabase.from("champions").delete().eq("tournament_id", tournament.id);

    const { error } = await supabase.from("tournaments").delete().eq("id", tournament.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm1")}
        className="flex items-center gap-2 text-xs font-mono text-ink-faint hover:text-danger transition-colors"
      >
        <Trash2 size={13} />
        EXCLUIR COMPETIÇÃO
      </button>
    );
  }

  return (
    <div className="bg-asphalt-panel border border-danger/40 rounded-sm p-5 space-y-4">
      <div className="flex items-center gap-2 text-danger font-display text-sm tracking-wide">
        <AlertTriangle size={16} />
        EXCLUIR COMPETIÇÃO
      </div>

      {step === "confirm1" && (
        <>
          <p className="text-sm text-ink-muted">
            Isso vai apagar permanentemente <strong className="text-ink">{tournament.name}</strong>, incluindo
            todos os pilotos inscritos, resultados de partidas e o registro de campeão (se houver). Essa ação
            não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("idle")}
              className="px-4 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep("confirm2")}
              className="px-4 py-2 bg-danger/10 border border-danger/40 rounded-sm text-sm text-danger hover:bg-danger/20 transition-colors"
            >
              Entendo, continuar
            </button>
          </div>
        </>
      )}

      {step === "confirm2" && (
        <>
          <p className="text-sm text-ink-muted">
            Para confirmar, digite o nome exato da competição:{" "}
            <strong className="text-ink">{tournament.name}</strong>
          </p>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={tournament.name}
            className="w-full bg-asphalt-card border border-asphalt-border rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-danger transition-colors"
          />
          {error && <p className="text-danger text-xs font-mono">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStep("idle");
                setTypedName("");
              }}
              className="px-4 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={!nameMatches || loading}
              className="px-4 py-2 bg-danger text-asphalt rounded-sm text-sm font-display tracking-wide hover:bg-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "EXCLUINDO..." : "EXCLUIR PERMANENTEMENTE"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
