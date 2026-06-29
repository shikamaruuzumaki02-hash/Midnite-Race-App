'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createGarage, insertGaragePhoto } from '@/lib/garage';

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

  async function handleFileSelected(file: File) {
    setLoading(true);
    setError(null);

    try {
      // A garagem só é criada no banco quando a primeira foto já está
      // pronta para ser enviada junto — uma garagem nunca deve existir
      // sem ao menos 1 foto.
      const garage = await createGarage(userId, modelId);

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${garage.id}-0-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('garage-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('garage-photos')
        .getPublicUrl(fileName);

      await insertGaragePhoto(garage.id, urlData.publicUrl, 0);

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
        Escolha uma foto para criar sua garagem.
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
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
        }}
      />
    </div>
  );
}
