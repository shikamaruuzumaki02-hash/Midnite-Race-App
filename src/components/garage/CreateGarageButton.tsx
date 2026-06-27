'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { createGarage } from '@/lib/garage';

interface CreateGarageButtonProps {
  userId: string;
  modelId: string;
}

export default function CreateGarageButton({ userId, modelId }: CreateGarageButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      await createGarage(userId, modelId);
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
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="flex items-center gap-2 rounded-md bg-ember px-4 py-2 font-display text-sm uppercase tracking-wide text-asphalt transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Criar minha garagem
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
