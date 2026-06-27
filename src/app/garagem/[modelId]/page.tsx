import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getCarModelById, getGaragesByModel, getUserGarageForModel } from '@/lib/garage';
import Sidebar from '@/components/Sidebar';
import GarageCard from '@/components/garage/GarageCard';
import GaragePhotoUpload from '@/components/garage/GaragePhotoUpload';
import CreateGarageButton from '@/components/garage/CreateGarageButton';
import HazardHeader from '@/components/HazardHeader';
import { Car } from 'lucide-react';
import type { Tournament } from '@/types/database';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { modelId: string };
}

export default async function ModeloGaragemPage({ params }: PageProps) {
  const { modelId } = params;

  const model = await getCarModelById(modelId);
  if (!model) notFound();

  const supabase = createClient();
  const { userId, profile } = await getCurrentProfile();

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (tournaments ?? []) as Tournament[];

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  const allGarages = await getGaragesByModel(modelId);

  const userGarage = user ? await getUserGarageForModel(user.id, modelId) : null;
  const otherGarages = allGarages.filter((g) => g.id !== userGarage?.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar tournaments={list} profile={profile} loggedIn={!!userId} />

      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-10 pt-20 lg:pt-8 pb-8 max-w-6xl mx-auto">
          <HazardHeader icon={Car} title={model.name} />

          {user && (
            <div className="my-6">
              <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-ink">
                Sua garagem
              </h2>

              {userGarage ? (
                <div className="rounded-lg border border-asphalt-border bg-asphalt-card p-3">
                  <GaragePhotoUpload
                    garageId={userGarage.id}
                    userId={user.id}
                    initialPhotos={userGarage.garage_photos}
                  />
                </div>
              ) : (
                <CreateGarageButton userId={user.id} modelId={modelId} />
              )}
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-ink">
              Garagens dos pilotos
            </h2>

            {otherGarages.length === 0 ? (
              <p className="font-mono text-sm text-ink-faint">
                Nenhuma garagem ainda pra este modelo.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {otherGarages.map((garage) => (
                  <GarageCard key={garage.id} garage={garage} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
