"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Minus, Plus, Ban, CheckCircle2 } from "lucide-react";
import type { TournamentEntry } from "@/types/database";

export default function AdminEntryRow({ entry, index }: { entry: TournamentEntry; index: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function adjustPoints(delta: number) {
    setBusy(true);
    await supabase
      .from("tournament_entries")
      .update({ points: entry.points + delta })
      .eq("id", entry.id);
    await supabase.from("point_adjustments").insert({
      tournament_entry_id: entry.id,
      delta,
      reason: "Ajuste manual pelo admin",
    });
    setBusy(false);
    router.refresh();
  }

  async function toggleDisqualified() {
    setBusy(true);
    await supabase
      .from("tournament_entries")
      .update({ disqualified: !entry.disqualified })
      .eq("id", entry.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <tr className="border-b border-asphalt-border/60 last:border-0 hover:bg-asphalt-card transition-colors">
      <td className="px-4 py-3 font-mono text-ink-faint">{index + 1}</td>
      <td className="px-4 py-3 font-display text-sm text-ink truncate max-w-[140px]">
        {entry.driver?.gamertag}
        {entry.disqualified && (
          <span className="ml-2 text-[10px] font-mono text-danger">DESCLASSIFICADO</span>
        )}
      </td>
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            disabled={busy}
            onClick={() => adjustPoints(-1)}
            className="w-6 h-6 flex items-center justify-center bg-asphalt-card border border-asphalt-border rounded-sm hover:border-danger hover:text-danger transition-colors"
          >
            <Minus size={11} />
          </button>
          <span className="font-mono font-semibold text-ink w-8 text-center">{entry.points}</span>
          <button
            disabled={busy}
            onClick={() => adjustPoints(1)}
            className="w-6 h-6 flex items-center justify-center bg-asphalt-card border border-asphalt-border rounded-sm hover:border-checkpoint hover:text-checkpoint transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      </td>
      <td className="px-3 py-3 text-center font-mono text-checkpoint">{entry.wins}</td>
      <td className="px-3 py-3 text-center font-mono text-danger">{entry.losses}</td>
      <td className="px-3 py-3 text-center font-mono text-ink-faint">{entry.draws}</td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={busy}
          onClick={toggleDisqualified}
          className={`font-mono text-[10px] flex items-center gap-1 ml-auto transition-colors ${
            entry.disqualified ? "text-checkpoint hover:text-checkpoint" : "text-ink-faint hover:text-danger"
          }`}
        >
          {entry.disqualified ? (
            <>
              <CheckCircle2 size={12} /> REINTEGRAR
            </>
          ) : (
            <>
              <Ban size={12} /> DESCLASSIFICAR
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
