'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createGarage, insertGaragePhoto, MAX_GARAGE_PHOTOS } from '@/lib/garage';

interface CreateGarageButtonProps {
  userId: string;
  modelId: string;
}

export default function CreateGarageButton({ userId, modelId }: CreateGarageButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  async function handleFilesSelected(files: FileList) {
    setLoading(true);
    setError(null);

    const fileArray = Array.from(files).slice(0, MAX_GARAGE_PHOTOS);

    try {
      const garage = await createGarage(userId, modelId);
      const supabase = createClient();

      await Promise.all(
        fileArray.map(async (file, slot) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}/${garage.id}-${slot}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('garage-photos')
            .upload(fileName, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('garage-photos')
            .getPublicUrl(fileName);

          await insertGaragePhoto(garage.id, urlData.publicUrl, slot);
        })
      );

      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Erro ao criar garagem. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-asphalt-border p-4 text-center">
      <p className="font-mono text-sm text-ink-muted">
        Você ainda não tem uma garagem pra este modelo.
      </p>
      <p className="font-mono text-xs text-ink-faint">
        Escolha até {MAX_GARAGE_PHOTOS} fotos para criar sua garagem.
      </p>
      <button
        type="button"
        onClick={handleChooseFile}
        disabled={loading}
        className="flex items-center gap-2 rounded-md bg-ember px-4 py-2 font-display text-sm uppercase tracking-wide text-asphalt transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Criar minha garagem
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
