/**
 * Cabeçalho de seção com faixa diagonal preto/âmbar, inspirado nas
 * faixas de "atenção" usadas nos painéis de Need for Speed Most Wanted
 * (ex: a barra "STANDINGS" / "POSITION · NAME · TIME"). Usado para
 * títulos de seção que merecem destaque mais forte que um <h2> comum.
 */
export default function HazardHeader({
  icon: Icon,
  title,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-sm border border-ember/40 mb-4"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, #161619 0px, #161619 10px, #0a0a0c 10px, #0a0a0c 20px)",
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-asphalt/70">
        {Icon && <Icon size={16} className="text-ember shrink-0" />}
        <h2 className="font-display text-sm tracking-[0.15em] text-ember">
          {title.toUpperCase()}
        </h2>
      </div>
    </div>
  );
}
