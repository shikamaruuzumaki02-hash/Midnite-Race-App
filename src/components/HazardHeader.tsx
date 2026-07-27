import type { LucideIcon } from "lucide-react";

/**
 * Cabeçalho de seção com faixa diagonal, inspirado nas barras de "atenção"
 * usadas nos painéis de Need for Speed Most Wanted (ex: a barra
 * "STANDINGS" / "POSITION · NAME · TIME"). Usado para títulos de seção
 * que merecem destaque mais forte que um <h2> comum.
 *
 * Por padrão é neutro (cinza-metálico/preto, como a maioria dos HUDs do
 * jogo) — passe accent={true} apenas nas seções que realmente precisam
 * chamar atenção com a cor de marca, não como estilo padrão de todo
 * cabeçalho do site.
 */
export default function HazardHeader({
  icon: Icon,
  title,
  accent = false,
}: {
  icon?: LucideIcon;
  title: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm border mb-4 ${
        accent ? "border-ember/40" : "border-asphalt-borderLight"
      }`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, #161619 0px, #161619 10px, #0a0a0c 10px, #0a0a0c 20px)",
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-asphalt/70">
        {Icon && (
          <Icon size={16} className={`shrink-0 ${accent ? "text-ember" : "text-ink-muted"}`} />
        )}
        <h2
          className={`font-display text-sm tracking-[0.15em] ${
            accent ? "text-ember" : "text-ink-muted"
          }`}
        >
          {title.toUpperCase()}
        </h2>
      </div>
    </div>
  );
}
