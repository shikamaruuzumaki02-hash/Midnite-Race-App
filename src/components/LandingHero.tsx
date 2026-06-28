"use client";

import Logo from "@/components/Logo";

/**
 * Tela de abertura da homepage — estilo "menu de título" de jogo de
 * corrida. Logo grande e centralizada, com um glow âmbar pulsante atrás
 * e uma linha de luz horizontal varrendo lentamente, como o farol de um
 * carro passando na pista. Tudo em CSS puro, sem imagens externas.
 *
 * O botão "TOCAR PARA COMEÇAR" abaixo da logo só aparece em mobile
 * (lg:hidden) e simula um clique no botão hambúrguer já existente na
 * Sidebar, que abre o menu deslizante. Em desktop a Sidebar já fica
 * sempre visível e fixa, então o botão não tem função ali.
 */
export default function LandingHero() {
  function openMobileMenu() {
    const hamburgerButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Abrir menu"]'
    );
    hamburgerButton?.click();
  }

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
        <div className="flex items-center gap-2 mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <span className="h-px w-10 bg-ember" />
          <span className="font-mono text-[11px] text-ember tracking-[0.3em]">
            BEM-VINDO À CENA
          </span>
          <span className="h-px w-10 bg-ember" />
        </div>

        <div
          className="opacity-0 animate-fade-in-up w-full max-w-2xl"
          style={{ animationDelay: "0.25s" }}
        >
          <Logo className="w-full" />
        </div>

        <p
          className="font-mono text-xs text-ink-dim mt-8 max-w-xs opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.55s" }}
        >
          Competições, garagens e o hall dos campeões da cena de street racing.
        </p>

        <button
          type="button"
          onClick={openMobileMenu}
          className="lg:hidden mt-10 flex items-center gap-3 px-7 py-3 border border-ember/50 rounded-sm font-display text-sm tracking-[0.2em] text-ember opacity-0 animate-fade-in-up animate-pulse-glow"
          style={{ animationDelay: "0.7s" }}
        >
          TOCAR PARA COMEÇAR
        </button>
      </div>
    </div>
  );
}
