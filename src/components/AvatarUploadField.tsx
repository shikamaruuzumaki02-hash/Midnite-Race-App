"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";
import { getCroppedImageFile } from "@/lib/cropImage";
import { Upload, Loader2, Check, X } from "lucide-react";

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

  // Estado do modal de crop
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem (JPG, PNG, etc.).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 8MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setRawImageSrc(localUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);

    // Permite escolher o mesmo arquivo de novo depois, se necessário
    e.target.value = "";
  }

  const onCropComplete = useCallback((_croppedAreaPercent: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  function cancelCrop() {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  }

  async function confirmCrop() {
    if (!rawImageSrc || !croppedArea) return;

    setUploading(true);
    setError(null);

    try {
      const croppedFile = await getCroppedImageFile(
        rawImageSrc,
        croppedArea,
        `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      );

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(croppedFile.name, croppedFile, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError(`Erro ao enviar a imagem: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(croppedFile.name);
      const publicUrl = publicUrlData.publicUrl;

      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar a imagem.");
    } finally {
      URL.revokeObjectURL(rawImageSrc);
      setRawImageSrc(null);
      setUploading(false);
    }
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
          <Upload size={14} />
          ESCOLHER FOTO
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}

      {rawImageSrc && (
        <div className="fixed inset-0 z-50 bg-asphalt/95 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={rawImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="p-4 space-y-3 bg-asphalt-panel border-t border-asphalt-border">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-ink-faint shrink-0">ZOOM</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-ember"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelCrop}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-asphalt-card border border-asphalt-border rounded-sm text-xs font-mono text-ink-faint hover:text-ink transition-colors disabled:opacity-50"
              >
                <X size={14} />
                CANCELAR
              </button>
              <button
                type="button"
                onClick={confirmCrop}
                disabled={uploading || !croppedArea}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ember text-asphalt font-display tracking-wide rounded-sm hover:bg-ember-light transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    ENVIANDO...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    USAR FOTO
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
