"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";

/**
 * Botão reutilizável que captura o conteúdo de um elemento (passado via
 * targetRef) como imagem PNG e dispara o download no celular.
 *
 * Uso:
 *   const ref = useRef<HTMLDivElement>(null);
 *   <div ref={ref}>...conteúdo a exportar...</div>
 *   <ExportImageButton targetRef={ref} fileName="tabela-liga.png" />
 */
export default function ExportImageButton({
  targetRef,
  fileName,
  label = "EXPORTAR IMAGEM",
}: {
  targetRef: React.RefObject<HTMLElement>;
  fileName: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!targetRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: "#0a0a0c",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Erro ao gerar a imagem: ${err.message}`
          : "Erro ao gerar a imagem."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink-faint hover:text-ember hover:border-ember transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            GERANDO...
          </>
        ) : (
          <>
            <Download size={14} />
            {label}
          </>
        )}
      </button>
      {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}
    </div>
  );
}
