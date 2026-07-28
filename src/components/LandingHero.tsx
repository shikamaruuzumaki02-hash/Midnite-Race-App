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
    <div className="relative flex-1 min-h-screen overflow-hidden bg-asphalt metal-surface vignette-dark flex items-center justify-center">
      {/* Vídeo de fundo — baixa opacidade, integrado ao grafite */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity pointer-events-none"
        src="https://nznlnzvnabulnzzjrixx.supabase.co/storage/v1/object/public/videos/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/* Camada escura por cima do vídeo pra reforçar integração com o fundo */}
      <div className="absolute inset-0 bg-asphalt/60" aria-hidden="true" />

      {/* Textura de fundo: grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 40px)",
        }}
        aria-hidden="true"
      />

      {/*
        Glow de fundo neutro (antes era laranja, cobrindo a tela com um
        "banho" âmbar que não existe no visual de referência — lá o fundo
        é preto/grafite frio, quase sem cor, com no máximo um brilho
        branco-sujo sutil).
      */}
      <div
        className="absolute w-[480px] h-[480px] rounded-full bg-white/[0.05] blur-[100px] animate-pulse-glow"
        aria-hidden="true"
      />

      {/* Linha de luz varrendo — branco-sujo, não âmbar */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-[-50%] w-[60%] h-px bg-gradient-to-r from-transparent via-ink/40 to-transparent animate-sweep-light" />
      </div>

      {/* Conteúdo central — sem px pra logo poder ocupar largura total */}
      <div className="relative z-10 flex flex-col items-center text-center w-full">
        <div
          className="flex items-center gap-2 mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="h-px w-10 bg-ink-faint" />
          <span className="font-mono text-sm font-semibold text-ink-muted tracking-[0.3em]">
            BEM-VINDO À CENA
          </span>
          <span className="h-px w-10 bg-ink-faint" />
        </div>

        {/* Logo — largura fixa em px, estável entre SSR e cliente */}
        <div
          className="opacity-0 animate-fade-in-up w-[340px] sm:w-[480px] lg:w-[600px]"
          style={{ animationDelay: "0.25s" }}
        >
          <Logo className="w-full h-auto" />
        </div>

        {/* Feed animado */}
        {allItems.length > 0 && (
          <div
            className="mt-8 opacity-0 animate-fade-in-up px-6"
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
                <span className="h-px w-6 bg-ink-faint shrink-0" />
              )}
              <span
                className="font-display text-base sm:text-lg tracking-wide text-ink max-w-[300px] sm:max-w-sm text-center leading-snug"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
              >
                {currentItem}
              </span>
              {!isEvent && (
                <span className="h-px w-6 bg-ink-faint shrink-0" />
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
          className="lg:hidden mt-10 flex items-center gap-3 px-8 py-3.5 border-[1.5px] border-ember/60 rounded-sm font-display text-base font-semibold tracking-[0.2em] text-ember opacity-0 animate-fade-in-up animate-pulse-glow"
          style={{ animationDelay: "0.7s" }}
        >
          TOCAR PARA COMEÇAR
        </button>
      </div>
    </div>
  );
}
