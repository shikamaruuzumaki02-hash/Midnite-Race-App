import { createClient } from '@/lib/supabase/server';
import { getCarModels } from '@/lib/garage';
import CarModelCard from '@/components/garage/CarModelCard';
import HazardHeader from '@/components/HazardHeader';
import { Warehouse } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GaragemPage() {
  const supabase = createClient();
  const models = await getCarModels();

  const { data: garageCounts } = await supabase
    .from('garages')
    .select('model_id');

  const countByModel: Record<string, number> = {};
  (garageCounts ?? []).forEach((g: { model_id: string }) => {
    countByModel[g.model_id] = (countByModel[g.model_id] ?? 0) + 1;
  });

  return (
    <div className="pt-20 lg:pt-8">
      <HazardHeader icon={Warehouse} title="Garagem" />

      <p className="mb-6 mt-4 font-mono text-sm text-ink-muted">
        Escolha um modelo pra ver as garagens dos pilotos.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
