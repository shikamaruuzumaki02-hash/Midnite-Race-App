import HudPanel from '@/components/HudPanel';
import GarageCarousel from '@/components/garage/GarageCarousel';
import type { Garage } from '@/lib/garage';

interface GarageCardProps {
  garage: Garage;
}

export default function GarageCard({ garage }: GarageCardProps) {
  const driverName = garage.profiles?.name ?? 'Piloto desconhecido';

  return (
    <HudPanel>
      <div className="p-3">
        <h3 className="mb-3 font-mono text-lg uppercase tracking-wide text-ink">
          {driverName}
        </h3>
        <GarageCarousel photos={garage.garage_photos} altPrefix={`Carro de ${driverName}`} />
      </div>
    </HudPanel>
  );
}
