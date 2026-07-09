"use client";

import { useEffect, useState } from "react";

// Frases fixas de estilo NFS — preenchem quando não há eventos reais
// ou intercalam com eles pra manter a vibe mesmo em site zerado.
const NFS_PHRASES = [
  "A noite pertence aos que ousam.",
  "Velocidade é respeito.",
  "Nas ruas, reputação é tudo.",
  "Cada pista tem sua história.",
  "O asfalto não mente.",
  "Piloto nasce. Campeão se faz.",
  "A cena não dorme.",
  "Quem para, fica pra trás.",
  "Corrida boa não precisa de plateia.",
  "O motor fala quando as palavras faltam.",
];

const DISPLAY_DURATION_MS = 3500; // tempo que cada item fica visível
const BLINK_DURATION_MS = 120;    // velocidade do pisca (estilo terminal)
const BLINK_CYCLES = 3;           // quantas vezes pisca antes de trocar

export default function LandingHero({ liveEvents = [] }: { liveEvents?: string[] }) {
  // Mescla eventos reais com frases NFS, intercalando
  const allItems = buildFeed(liveEvents, NFS_PHRASES);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (allItems.length === 0) return;

    const timer = setTimeout(async () => {
      // Pisca N vezes antes de trocar
      for (let i = 0; i < BLINK_CYCLES; i++) {
        setVisible(false);
        await sleep(BLINK_DURATION_MS);
        setVisible(true);
        await sleep(BLINK_DURATION_MS);
      }
      setVisible(false);
      await sleep(BLINK_DURATION_MS);
      setIndex((prev) => (prev + 1) % allItems.length);
      setVisible(true);
    }, DISPLAY_DURATION_MS);

    return () => clearTimeout(timer);
  }, [index, allItems.length]);

  const currentItem = allItems[index] ?? "";
  const isEvent = index < liveEvents.length * 2 && liveEvents.length > 0;

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-asphalt flex items-center justify-center">
      {/* Textura de fundo: grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)",
        }}
        aria-hidden="true"
      />

      {/* Glow âmbar pulsante */}
      <div
        className="absolute w-[480px] h-[480px] rounded-full bg-ember/20 blur-[100px] animate-pulse-glow"
        aria-hidden="true"
      />

      {/* Linha de luz varrendo */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-[-50%] w-[60%] h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent animate-sweep-light" />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div
          className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
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

        {/* Feed animado estilo terminal */}
        {allItems.length > 0 && (
          <div
            className="mt-8 h-8 flex items-center justify-center opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.55s" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-1.5 border border-asphalt-border rounded-sm bg-asphalt-panel/60"
              style={{
                transition: `opacity ${BLINK_DURATION_MS}ms step-end`,
                opacity: visible ? 1 : 0,
              }}
            >
              {isEvent && (
                <span className="w-1.5 h-1.5 rounded-full bg-checkpoint shrink-0 animate-pulse" />
              )}
              <span className="font-mono text-[11px] text-ink-muted max-w-[260px] sm:max-w-xs truncate">
                {currentItem}
              </span>
              {/* Cursor piscante estilo terminal */}
              <span className="font-mono text-[11px] text-ember animate-pulse select-none">▮</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            const btn = document.querySelector<HTMLButtonElement>(
              'button[aria-label="Abrir menu"]'
            );
            btn?.click();
          }}
          className="lg:hidden mt-10 flex items-center gap-3 px-7 py-3 border border-ember/50 rounded-sm font-display text-sm tracking-[0.2em] text-ember opacity-0 animate-fade-in-up animate-pulse-glow"
          style={{ animationDelay: "0.7s" }}
        >
          TOCAR PARA COMEÇAR
        </button>
      </div>
    </div>
  );
}

// Intercala eventos reais com frases NFS pra o feed não ficar
// só de frases quando não há atividade, nem só de eventos quando há muitos.
function buildFeed(events: string[], phrases: string[]): string[] {
  if (events.length === 0) return shuffleArray([...phrases]);

  const result: string[] = [];
  const shuffledPhrases = shuffleArray([...phrases]);
  const maxItems = Math.min(events.length + shuffledPhrases.length, 14);
  let ei = 0;
  let pi = 0;

  while (result.length < maxItems) {
    // Alterna: 1 evento, 1 frase, 1 evento, 2 frases...
    if (ei < events.length) {
      result.push(events[ei++]);
    }
    if (pi < shuffledPhrases.length && result.length < maxItems) {
      result.push(shuffledPhrases[pi++]);
    }
    if (pi < shuffledPhrases.length && result.length < maxItems) {
      result.push(shuffledPhrases[pi++]);
    }
  }

  return result;
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
