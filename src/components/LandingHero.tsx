"use client";

/**
 * Tela de abertura da homepage — estilo "menu de título" de jogo de
 * corrida. Logo grande e centralizada, com um glow âmbar pulsante atrás
 * e uma linha de luz horizontal varrendo lentamente, como o farol de um
 * carro passando na pista. Tudo em CSS puro, sem imagens externas.
 */
export default function LandingHero() {
  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-asphalt flex items-center justify-center">
      {/* Textura de fundo: grid sutil, lembrando o piso de uma garagem */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)",
        }}
        aria-hidden="true"
      />

      {/* Glow âmbar pulsante, centralizado atrás da logo */}
      <div
        className="absolute w-[480px] h-[480px] rounded-full bg-ember/20 blur-[100px] animate-pulse-glow"
        aria-hidden="true"
      />

      {/* Linha de luz horizontal varrendo lentamente, como um farol */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-[-50%] w-[60%] h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent animate-sweep-light" />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <span className="h-px w-10 bg-ember" />
          <span className="font-mono text-[11px] text-ember tracking-[0.3em]">
            BEM-VINDO À CENA
          </span>
          <span className="h-px w-10 bg-ember" />
        </div>

        <h1
          className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none tracking-wider text-ink opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.25s" }}
        >
          MIDNITE<span className="text-ember">BR</span>
        </h1>

        <div
          className="font-mono text-xs sm:text-sm tracking-[0.35em] text-ink-faint mt-3 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          SSR — STREET SERIES
        </div>

        <p
          className="font-mono text-xs text-ink-dim mt-8 max-w-xs opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.55s" }}
        >
          Competições, garagens e o hall dos campeões da cena de street racing.
        </p>
      </div>
    </div>
  );
}
