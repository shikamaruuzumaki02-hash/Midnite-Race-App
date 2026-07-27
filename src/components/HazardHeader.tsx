/**
 * Painel com "cantos de mira" estilo HUD de jogo de corrida (inspirado em
 * Need for Speed Most Wanted): pequenas marcações em L nos quatro cantos,
 * dando a sensação de um overlay de interface de corrida, não de um card
 * de site comum.
 *
 * Uso: envolver qualquer bloco de conteúdo que deve parecer um "painel
 * de jogo" (cabeçalhos de seção, destaques, modais). Por padrão os cantos
 * são neutros (cinza-metálico) — passe cornerColor="border-ember" apenas
 * quando o painel precisa sinalizar algo específico (selecionado, vencedor,
 * destaque real), não como decoração padrão.
 */
export default function HudPanel({
  children,
  className = "",
  cornerColor = "border-ink-faint",
}: {
  children: React.ReactNode;
  className?: string;
  cornerColor?: string;
}) {
  const cornerBase = `absolute w-3 h-3 ${cornerColor}`;

  return (
    <div className={`relative ${className}`}>
      <span className={`${cornerBase} top-0 left-0 border-l-2 border-t-2`} aria-hidden="true" />
      <span className={`${cornerBase} top-0 right-0 border-r-2 border-t-2`} aria-hidden="true" />
      <span className={`${cornerBase} bottom-0 left-0 border-l-2 border-b-2`} aria-hidden="true" />
      <span className={`${cornerBase} bottom-0 right-0 border-r-2 border-b-2`} aria-hidden="true" />
      {children}
    </div>
  );
}
