"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";

type StyleOverride = {
  element: HTMLElement;
  overflow: string;
  width: string;
};

/**
 * Remove temporariamente o overflow/scroll horizontal de um elemento e de
 * todos os seus elementos-pai relevantes, forçando-os a expandir para o
 * tamanho total do conteúdo. Necessário porque html-to-image captura o
 * DOM como ele está renderizado: se um contêiner tem overflow-x-auto
 * (como o bracket de mata-mata, com rodadas lado a lado), apenas a parte
 * visível na tela seria capturada, cortando o restante.
 *
 * Devolve uma função de limpeza que restaura os estilos originais.
 */
function expandScrollableAncestors(node: HTMLElement): () => void {
  const overrides: StyleOverride[] = [];

  // Expande o próprio elemento alvo e qualquer descendente com scroll
  // horizontal (ex: a div com overflow-x-auto dentro do BracketView).
  const candidates = [node, ...Array.from(node.querySelectorAll<HTMLElement>("*"))];

  for (const el of candidates) {
    const style = window.getComputedStyle(el);
    const hasHorizontalScroll = el.scrollWidth > el.clientWidth;
    const isScrollable =
      style.overflowX === "auto" || style.overflowX === "scroll" || hasHorizontalScroll;

    if (isScrollable) {
      overrides.push({ element: el, overflow: el.style.overflow, width: el.style.width });
      el.style.overflow = "visible";
      el.style.width = `${el.scrollWidth}px`;
    }
  }

  return () => {
    for (const { element, overflow, width } of overrides) {
      element.style.overflow = overflow;
      element.style.width = width;
    }
  };
}

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
    const node = targetRef.current;
    if (!node) return;

    setLoading(true);
    setError(null);

    const restore = expandScrollableAncestors(node);

    try {
      // Pequena espera para o navegador recalcular o layout após a
      // mudança de estilo, antes de capturar.
      await new Promise((r) => setTimeout(r, 50));

      const dataUrl = await toPng(node, {
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
      restore();
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
