import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getCarModels } from '@/lib/garage';
import { sortModelsByFixedOrder } from '@/lib/carModels';
import Sidebar from '@/components/Sidebar';
import CarModelCard from '@/components/garage/CarModelCard';
import HazardHeader from '@/components/HazardHeader';
import { Warehouse } from 'lucide-react';
import type { Tournament } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function GaragemPage() {
  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (tournaments ?? []) as Tournament[];

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
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} role={profile?.role ?? null} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
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
      </main>
    </div>
  );
}
