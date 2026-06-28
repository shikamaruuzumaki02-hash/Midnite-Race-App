import Image from "next/image";

/**
 * Logo MIDNITEBR / SSR - STREET SERIES, estilo grafite/sticker.
 * Imagem PNG (gerada por IA, fundo transparente) em vez de SVG -
 * mais simples de manter e evita arquivos de codigo gigantes.
 * Tamanho controlado via className no wrapper (ex: "w-44", "w-full").
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ position: "relative", width: "100%", aspectRatio: "2408 / 731" }}>
      <Image
        src="/images/midnitebr-logo.png"
        alt="Midnite Brasil SSR"
        fill
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
}
