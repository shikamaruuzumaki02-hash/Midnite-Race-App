import Image from "next/image";

/**
 * Logo MIDNITEBR / SSR - STREET SERIES, estilo grafite/sticker.
 * Imagem PNG (fundo transparente). Tamanho via className (ex: "w-44", "w-full").
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[2408/731] transition-transform duration-300 hover:scale-105 ${className}`}
    >
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
