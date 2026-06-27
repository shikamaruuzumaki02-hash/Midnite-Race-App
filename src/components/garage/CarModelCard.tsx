import Link from 'next/link';
import HudPanel from '@/components/HudPanel';
import { getCarModelImage } from '@/lib/carModels';
import type { CarModel } from '@/lib/garage';

interface CarModelCardProps {
  model: CarModel;
  garageCount: number;
}

export default function CarModelCard({ model, garageCount }: CarModelCardProps) {
  const image = getCarModelImage(model.name);

  return (
    <Link href={`/garagem/${model.id}`}>
      <HudPanel className="relative flex h-24 items-center overflow-hidden rounded-lg border border-asphalt-border bg-asphalt-card transition-colors hover:border-ember">
        {image && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[60%] items-center justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="h-[160%] max-w-full object-contain opacity-45"
            />
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.85) 40%, rgba(10,10,12,0.1) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col gap-1 px-4">
          <span className="font-display text-base uppercase tracking-wide text-ink sm:text-lg">
            {model.name}
          </span>
          <span className="font-mono text-xs text-ember">
            {garageCount === 0
              ? 'Nenhuma garagem'
              : garageCount === 1
                ? '1 garagem'
                : `${garageCount} garagens`}
          </span>
        </div>
      </HudPanel>
    </Link>
  );
}
