'use client';

import { useState, useRef } from 'react';
import type { GaragePhoto } from '@/lib/garage';

interface GarageCarouselProps {
  photos: GaragePhoto[];
  altPrefix?: string;
}

export default function GarageCarousel({ photos, altPrefix = 'Foto da garagem' }: GarageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-asphalt-border bg-asphalt-card">
        <p className="font-mono text-sm text-ink-faint">Sem fotos ainda</p>
      </div>
    );
  }

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;

    const slideWidth = container.clientWidth;
    const newIndex = Math.round(container.scrollLeft / slideWidth);
    setActiveIndex(newIndex);
  }

  function scrollToIndex(index: number) {
    const container = containerRef.current;
    if (!container) return;

    const slideWidth = container.clientWidth;
    container.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-lg"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="aspect-[16/9] w-full flex-shrink-0 snap-start"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.photo_url}
              alt={`${altPrefix} ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 md:hover:scale-105"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir para foto ${index + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === activeIndex ? 'bg-ember' : 'bg-asphalt-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
