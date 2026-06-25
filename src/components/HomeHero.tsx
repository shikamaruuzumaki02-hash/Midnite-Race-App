import { Flag } from "lucide-react";

/**
 * Cabeçalho da página inicial. Usa uma textura sutil em CSS puro
 * (linhas diagonais finas, lembrando o piso de uma garagem ou pista
 * vista de cima) para dar atmosfera sem depender de imagens externas.
 */
export default function HomeHero() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-asphalt-border mb-8">
      {/* Textura de fundo: linhas diagonais finas, estilo piso de garagem */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)",
        }}
        aria-hidden="true"
      />

      {/* Faixa de luz âmbar sutil, como um farol refletindo no asfalto */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-ember/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative px-6 lg:px-10 py-8 lg:py-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-px w-8 bg-ember" />
          <span className="font-mono text-[10px] text-ember tracking-[0.2em]">
            MIDNITE BRASIL
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Flag size={22} className="text-ember shrink-0" />
          <h1 className="font-display text-2xl lg:text-3xl tracking-wide text-ink">
            COMPETIÇÕES
          </h1>
        </div>
        <p className="font-mono text-xs text-ink-faint mt-2 max-w-md">
          Ligas e chaves de mata-mata da cena de street racing.
        </p>
      </div>
    </div>
  );
}
