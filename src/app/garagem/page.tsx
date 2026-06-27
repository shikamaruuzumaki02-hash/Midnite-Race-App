import { createClient } from '@/lib/supabase/server';
import { getCarModels } from '@/lib/garage';
import { sortModelsByFixedOrder } from '@/lib/carModels';
import CarModelCard from '@/components/garage/CarModelCard';
import HazardHeader from '@/components/HazardHeader';
import { Warehouse } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GaragemPage() {
  const supabase = createClient();
  const allModels = await getCarModels();
  const models = sortModelsByFixedOrder(allModels);

  const { data: garageCounts } = await supabase
    .from('garages')
    .select('model_id');

  const countByModel: Record<string, number> = {};
  (garageCounts ?? []).forEach((g: { model_id: string }) => {
    countByModel[g.model_id] = (countByModel[g.model_id] ?? 0) + 1;
  });

  return (
    <div className="px-4 pt-20 lg:px-8 lg:pt-8">
      <HazardHeader icon={Warehouse} title="Garagem" />

      <p className="mb-6 mt-4 font-mono text-sm text-ink-muted">
        Escolha um modelo pra ver as garagens dos pilotos.
      </p>

      <div className="flex flex-col gap-3">
        {models.map((model) => (
          <CarModelCard
            key={model.id}
            model={model}
            garageCount={countByModel[model.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
