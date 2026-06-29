'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  deleteGaragePhoto,
  insertGaragePhoto,
  deleteGarage,
  getNextAvailablePosition,
  MAX_GARAGE_PHOTOS,
  type GaragePhoto,
} from '@/lib/garage';

interface GaragePhotoUploadProps {
  garageId: string;
  userId: string;
  initialPhotos: GaragePhoto[];
}

export default function GaragePhotoUpload({
  garageId,
  userId,
  initialPhotos,
}: GaragePhotoUploadProps) {
  const [photos, setPhotos] = useState<GaragePhoto[]>(initialPhotos);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const router = useRouter();

  const slots = Array.from({ length: MAX_GARAGE_PHOTOS }, (_, i) => i);

  function getPhotoForSlot(slot: number): GaragePhoto | undefined {
    return photos.find((p) => p.position === slot);
  }

  async function handleFileSelected(slot: number, file: File) {
    setError(null);
    setLoadingSlot(slot);

    try {
      const supabase = createClient();
      const existingPhoto = getPhotoForSlot(slot);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${garageId}-${slot}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('garage-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('garage-photos')
        .getPublicUrl(fileName);

      const newUrl = urlData.publicUrl;

      if (existingPhoto) {
        await deleteGaragePhoto(existingPhoto.id);
        const inserted = await insertGaragePhoto(garageId, newUrl, slot);
        setPhotos((prev) => [...prev.filter((p) => p.id !== existingPhoto.id), inserted]);
      } else {
        const inserted = await insertGaragePhoto(garageId, newUrl, slot);
        setPhotos((prev) => [...prev, inserted]);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar foto. Tente novamente.');
    } finally {
      setLoadingSlot(null);
    }
  }

  async function handleRemove(slot: number) {
    const photo = getPhotoForSlot(slot);
    if (!photo) return;

    setError(null);
    setLoadingSlot(slot);

    try {
      await deleteGaragePhoto(photo.id);
      const remainingPhotos = photos.filter((p) => p.id !== photo.id);
      setPhotos(remainingPhotos);

      // Uma garagem nunca deve existir sem nenhuma foto. Se essa era a
      // última foto restante, a garagem inteira é excluída (o cascade no
      // banco já cuidaria das fotos, mas aqui já não resta nenhuma).
      if (remainingPhotos.length === 0) {
        await deleteGarage(garageId);
        router.refresh();
        return;
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao remover foto. Tente novamente.');
    } finally {
      setLoadingSlot(null);
    }
  }

  return (
    <div>
      <h4 className="mb-2 font-mono text-sm uppercase tracking-wide text-ink-muted">
        Suas fotos ({photos.length}/{MAX_GARAGE_PHOTOS})
      </h4>

      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((slot) => {
          const photo = getPhotoForSlot(slot);
          const isLoading = loadingSlot === slot;

          return (
            <div
              key={slot}
              className="relative aspect-square overflow-hidden rounded-lg border border-asphalt-border bg-asphalt-card"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.photo_url}
                  alt={`Foto slot ${slot + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Upload className="h-5 w-5 text-ink-faint" />
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="h-5 w-5 animate-spin text-ember" />
                </div>
              )}

              {!isLoading && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slot]?.click()}
                    className="rounded p-1 text-ink hover:text-ember"
                    aria-label={photo ? 'Substituir foto' : 'Enviar foto'}
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => handleRemove(slot)}
                      className="rounded p-1 text-ink hover:text-danger"
                      aria-label="Remover foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <input
                ref={(el) => {
                  fileInputRefs.current[slot] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(slot, file);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
                }
