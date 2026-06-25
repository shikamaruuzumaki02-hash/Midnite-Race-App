"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2 } from "lucide-react";

export default function AvatarUploadField({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(currentUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem (JPG, PNG, etc.).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(`Erro ao enviar a imagem: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    setPreview(publicUrl);
    onUploaded(publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <label className="block font-mono text-[11px] text-ink-faint mb-1.5 tracking-wide">
        FOTO DO PILOTO (OPCIONAL)
      </label>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-sm bg-asphalt-card border border-asphalt-border flex items-center justify-center shrink-0 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover" />
          ) : (
            <Upload size={18} className="text-ink-dim" />
          )}
        </div>

        <label className="flex items-center gap-2 px-3 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink-faint hover:text-ember hover:border-ember transition-colors cursor-pointer">
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              ENVIANDO...
            </>
          ) : (
            <>
              <Upload size={14} />
              ESCOLHER FOTO
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}
    </div>
  );
}
