'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Upload, Loader2, Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  deleteGaragePhoto,
  insertGaragePhoto,
  deleteGarage,
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
  const [loadingSlots, setLoadingSlots] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const slots = Array.from({ length: MAX_GARAGE_PHOTOS }, (_, i) => i);

  function getPhotoForSlot(slot: number): GaragePhoto | undefined {
    return photos.find((p) => p.position === slot);
  }

  function getEmptySlots(currentPhotos: GaragePhoto[]): number[] {
    return slots.filter((slot) => !currentPhotos.find((p) => p.position === slot));
  }

  async function uploadToSlot(
    slot: number,
    file: File,
    currentPhotos: GaragePhoto[]
  ): Promise<GaragePhoto> {
    const supabase = createClient();
    const existingPhoto = currentPhotos.find((p) => p.position === slot);

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${garageId}-${slot}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('garage-photos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('garage-photos')
      .getPublicUrl(fileName);

    if (existingPhoto) {
      await deleteGaragePhoto(existingPhoto.id);
    }

    return await insertGaragePhoto(garageId, urlData.publicUrl, slot);
  }

  // Upload em massa — preenche slots vagos em ordem
  async function handleBulkUpload(files: FileList) {
    setError(null);
    const fileArray = Array.from(files);
    const emptySlots = getEmptySlots(photos);

    if (emptySlots.length === 0) {
      setError('Todos os slots já estão preenchidos.');
      return;
    }

    const slotsToFill = emptySlots.slice(0, fileArray.length);
    const filesToUpload = fileArray.slice(0, slotsToFill.length);

    if (fileArray.length > emptySlots.length) {
      setError(
        `Você tem ${emptySlots.length} slot(s) disponível(is). Apenas as primeiras ${emptySlots.length} fotos serão enviadas.`
      );
    }

    setLoadingSlots(new Set(slotsToFill));

    try {
      const results = await Promise.all(
        filesToUpload.map((file, i) => uploadToSlot(slotsToFill[i], file, photos))
      );

      setPhotos((prev) => {
        const withoutReplaced = prev.filter(
          (p) => !slotsToFill.includes(p.position)
        );
        return [...withoutReplaced, ...results];
      });
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar fotos. Tente novamente.');
    } finally {
      setLoadingSlots(new Set());
    }
  }

  // Upload individual por slot (substituição)
  async function handleFileSelected(slot: number, file: File) {
    setError(null);
    setLoadingSlots((prev) => new Set(prev).add(slot));

    try {
      const inserted = await uploadToSlot(slot, file, photos);
      setPhotos((prev) => [
        ...prev.filter((p) => p.position !== slot),
        inserted,
      ]);
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar foto. Tente novamente.');
    } finally {
      setLoadingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    }
  }

  async function handleRemove(slot: number) {
    const photo = getPhotoForSlot(slot);
    if (!photo) return;

    setError(null);
    setLoadingSlots((prev) => new Set(prev).add(slot));

    try {
      await deleteGaragePhoto(photo.id);
      const remainingPhotos = photos.filter((p) => p.id !== photo.id);
      setPhotos(remainingPhotos);

      if (remainingPhotos.length === 0) {
        await deleteGarage(garageId);
        router.refresh();
        return;
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao remover foto. Tente novamente.');
    } finally {
      setLoadingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    }
  }

  const isAnyLoading = loadingSlots.size > 0;
  const emptyCount = getEmptySlots(photos).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-mono text-sm uppercase tracking-wide text-ink-muted">
          Suas fotos ({photos.length}/{MAX_GARAGE_PHOTOS})
        </h4>

        {emptyCount > 0 && (
          <button
            type="button"
            disabled={isAnyLoading}
            onClick={() => bulkInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-ink hover:text-ember disabled:opacity-50"
          >
            <Images className="h-4 w-4" />
            Enviar até {emptyCount} foto{emptyCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {/* Input oculto para upload em massa */}
      <input
        ref={bulkInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleBulkUpload(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((slot) => {
          const photo = getPhotoForSlot(slot);
          const isLoading = loadingSlots.has(slot);

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
                ref={(el) => { fileInputRefs.current[slot] = el; }}
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
