"use client";

import { useEffect, useRef, useState } from "react";
import BracketView from "@/components/BracketView";
import HudPanel from "@/components/HudPanel";
import ExportImageButton from "@/components/ExportImageButton";
import type { Match } from "@/types/database";

export default function ExportableBracket({
  matches,
  numPlayers,
  tournamentName,
}: {
  matches: Match[];
  numPlayers: number;
  tournamentName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Refs e estado pro "encaixar na tela" (fit-to-screen) da versão visível
  const visibleWrapperRef = useRef<HTMLDivElement>(null);
  const visibleContentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);

  useEffect(() => {
    function recalcScale() {
      const wrapper = visibleWrapperRef.current;
      const content = visibleContentRef.current;
      if (!wrapper || !content) return;

      // Altura disponível: do topo do painel até o fim da tela, com uma
      // margem de respiro embaixo (24px) pra não colar no rodapé.
      const top = wrapper.getBoundingClientRect().top;
      const availableHeight = window.innerHeight - top - 24;

      const height = content.scrollHeight;
      if (height === 0) return;

      setNaturalHeight(height);
      setScale(Math.min(1, availableHeight / height));
    }

    recalcScale();

    const resizeObserver = new ResizeObserver(recalcScale);
    if (visibleContentRef.current) resizeObserver.observe(visibleContentRef.current);
    window.addEventListener("resize", recalcScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", recalcScale);
    };
  }, [matches, numPlayers]);

  return (
    <div className="space-y-3">
      {/*
        Versão visível na tela: a mesma renderização de sempre, só que
        encolhida via CSS transform (scale) o suficiente pra caber
        inteira na altura da tela, sem precisar rolar pra baixo. O
        scroll horizontal das rodadas continua funcionando normalmente
        dentro da área já escalada. O wrapper externo tem a altura já
        reduzida (naturalHeight * scale) pra não sobrar espaço vazio
        embaixo, já que "transform" não muda o espaço ocupado no layout,
        só a aparência visual.
      */}
      <div
        ref={visibleWrapperRef}
        style={{ height: naturalHeight ? naturalHeight * scale : undefined }}
        className="overflow-hidden"
      >
        <div
          ref={visibleContentRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${100 / scale}%`,
          }}
        >
          <HudPanel className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5">
            <div className="mb-4">
              <span className="font-display text-sm text-ember tracking-wide">
                {tournamentName.toUpperCase()}
              </span>
            </div>
            <BracketView matches={matches} numPlayers={numPlayers} scrollable={true} />
          </HudPanel>
        </div>
      </div>

      {/*
        Versão usada apenas para exportação: sem scroll, com todas as
        rodadas expostas lado a lado. Fica fora da tela (position fixed
        + opacidade zero), mas continua no DOM para que o html-to-image
        consiga capturá-la por completo, sem cortes. Não é afetada pelo
        encaixe acima — a exportação precisa do tamanho real, não do
        reduzido.
      */}
      {matches.length > 0 && (
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
          <div ref={ref} className="bg-asphalt-panel border border-asphalt-border rounded-sm p-5 inline-block">
            <div className="mb-4">
              <span className="font-display text-sm text-ember tracking-wide">
                {tournamentName.toUpperCase()}
              </span>
            </div>
            <BracketView matches={matches} numPlayers={numPlayers} scrollable={false} />
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <ExportImageButton
          targetRef={ref}
          fileName={`chave-${tournamentName.toLowerCase().replace(/\s+/g, "-")}.png`}
          label="EXPORTAR CHAVE"
        />
      )}
    </div>
  );
}
