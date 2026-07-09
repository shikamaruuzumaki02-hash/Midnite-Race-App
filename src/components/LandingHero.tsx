"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

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

const VISIBLE_DURATION_MS = 3500;
const FADE_DURATION_MS = 600;

function buildFeed(events: string[], phrases: string[]): string[] {
  if (events.length === 0) return [...phrases];
  const result: string[] = [];
  let ei = 0;
  let pi = 0;
  while (ei < events.length || pi < phrases.length) {
    if (ei < events.length) result.push(events[ei++]);
    if (pi < phrases.length) result.push(phrases[pi++]);
    if (pi < phrases.length) result.push(phrases[pi++]);
  }
  return result.slice(0, 16);
}

export default function LandingHero({ liveEvents = [] }: { liveEvents?: string[] }) {
  const allItems = buildFeed(liveEvents, NFS_PHRASES);
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (allItems.length <= 1) return;

    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % allItems.length);
        setFading(false);
      }, FADE_DURATION_MS);
    }, VISIBLE_DURATION_MS + FADE_DURATION_MS);

    return () => clearInterval(interval);
  }, [allItems.length]);

  const currentItem = allItems[index] ?? "";
  const isEvent = liveEvents.includes(currentItem);

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
      <div className="relative z-10 flex flex-col items-center text-center px-3">
        <div
          className="flex items-center gap-2 mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="h-px w-10 bg-ember" />
          <span className="font-mono text-[11px] text-ember tracking-[0.3em]">
            BEM-VINDO À CENA
          </span>
          <span className="h-px w-10 bg-ember" />
        </div>

        <div
          className="opacity-0 animate-fade-in-up w-full max-w-3xl"
          style={{ animationDelay: "0.25s" }}
        >
          <Logo className="w-full h-auto" />
        </div>

        {/* Feed animado — substitui o parágrafo de descrição estático */}
        {allItems.length > 0 && (
          <div
            className="mt-8 opacity-0 animate-fade-in-up px-4"
            style={{ animationDelay: "0.55s" }}
          >
            <div
              style={{
                transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
                opacity: fading ? 0 : 1,
              }}
              className="flex items-center justify-center gap-2.5"
            >
              {isEvent ? (
                <span className="w-2 h-2 rounded-full bg-checkpoint shrink-0 animate-pulse" />
              ) : (
                <span className="h-px w-6 bg-ember/60 shrink-0" />
              )}
              <span
                className="font-display text-base sm:text-lg tracking-wide text-ink max-w-[300px] sm:max-w-sm text-center leading-snug"
                style={{ textShadow: "0 0 24px rgba(255,90,31,0.25)" }}
              >
                {currentItem}
              </span>
              {!isEvent && (
                <span className="h-px w-6 bg-ember/60 shrink-0" />
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            const hamburgerButton = document.querySelector<HTMLButtonElement>(
              'button[aria-label="Abrir menu"]'
            );
            hamburgerButton?.click();
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
