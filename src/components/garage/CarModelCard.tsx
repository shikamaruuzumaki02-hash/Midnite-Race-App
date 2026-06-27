import Link from 'next/link';
import { Car } from 'lucide-react';
import HudPanel from '@/components/HudPanel';
import type { CarModel } from '@/lib/garage';

interface CarModelCardProps {
  model: CarModel;
  garageCount: number;
}

export default function CarModelCard({ model, garageCount }: CarModelCardProps) {
  return (
    <Link href={`/garagem/${model.id}`}>
      <HudPanel className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-asphalt-border bg-asphalt-card p-4 text-center transition-colors hover:border-ember">
        <Car className="h-8 w-8 text-ember" />
        <span className="font-display text-base uppercase tracking-wide text-ink">
          {model.name}
        </span>
        <span className="font-mono text-xs text-ink-faint">
          {garageCount === 0
            ? 'Nenhuma garagem'
            : garageCount === 1
              ? '1 garagem'
              : `${garageCount} garagens`}
        </span>
      </HudPanel>
    </Link>
  );
}
