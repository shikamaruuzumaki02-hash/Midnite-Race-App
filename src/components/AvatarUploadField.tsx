"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";
import {
  getCroppedImageFile,
  loadImageElement,
  fileToObjectUrl,
  revokeObjectUrlSafe,
  downscaleImageIfNeeded,
} from "@/lib/cropImage";
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
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(currentUrl);

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  // Guarda a blob: URL ativa para poder revogá-la em qualquer caminho de
  // saída (cancelar, confirmar, troca de imagem, ou desmontagem do
  // componente), evitando acúmulo de memória no navegador.
  const activeObjectUrlRef = useRef<string | null>(null);

  function clearActiveObjectUrl() {
    revokeObjectUrlSafe(activeObjectUrlRef.current);
    activeObjectUrlRef.current = null;
  }

  // Libera a blob: URL ativa se o usuário navegar para fora da página ou
  // o componente for desmontado com o crop ainda aberto.
  useEffect(() => {
    return () => {
      clearActiveObjectUrl();
    };
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const inputEl = e.target;
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem (JPG, PNG, etc.).");
      inputEl.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 15MB.");
      inputEl.value = "";
      return;
    }

    setPreparing(true);

    try {
      // Se a foto for muito grande (comum em câmeras modernas), reduz
      // antes de entrar no crop, evitando sobrecarregar o canvas.
      const resizedFile = await downscaleImageIfNeeded(file, 1920);

      const objectUrl = fileToObjectUrl(resizedFile);
      await loadImageElement(objectUrl);

      // Substitui qualquer URL anterior (ex: o usuário escolheu outra
      // foto sem confirmar a primeira).
      clearActiveObjectUrl();
      activeObjectUrlRef.current = objectUrl;

      setRawImageSrc(objectUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    } catch (err) {
      console.error("AvatarUploadField: erro ao preparar imagem", err);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível abrir esta imagem. Tente outra foto."
      );
    } finally {
      setPreparing(false);
      inputEl.value = "";
    }
  }

  const onCropComplete = useCallback((_croppedAreaPercent: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  function cancelCrop() {
    clearActiveObjectUrl();
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
      clearActiveObjectUrl();
      setRawImageSrc(null);
    } catch (err) {
      console.error("AvatarUploadField: erro ao confirmar crop", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar a imagem. Tente novamente ou use outra foto."
      );
    } finally {
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
          {preparing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              PREPARANDO...
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
            disabled={preparing}
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
