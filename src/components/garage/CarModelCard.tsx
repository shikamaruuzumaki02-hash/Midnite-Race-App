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
      <div className="relative flex h-24 items-center overflow-hidden rounded-lg border border-asphalt-border bg-asphalt-card transition-colors hover:border-ember">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-y-0 right-0 w-2/3"
            style={{
              background:
                'radial-gradient(ellipse 80% 100% at 85% 50%, rgba(255,90,31,0.35) 0%, rgba(255,90,31,0.12) 45%, transparent 75%)',
            }}
          />

          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="pointer-events-none absolute bottom-0 right-0 h-full max-w-[55%] object-contain object-bottom opacity-90"
            />
          )}

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.7) 40%, rgba(10,10,12,0.05) 100%)',
            }}
          />
        </div>

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

        <HudPanel className="pointer-events-none absolute inset-0 z-20">
          {null}
        </HudPanel>
      </div>
    </Link>
  );
}
