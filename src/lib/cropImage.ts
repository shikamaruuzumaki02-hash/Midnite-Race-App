export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1600;

/**
 * Desenha um ImageBitmap (ou HTMLImageElement) num canvas e devolve uma
 * blob: URL no formato JPEG, redimensionando se necessário.
 */
function drawToJpegUrl(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem neste dispositivo.");

  ctx.drawImage(source, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível preparar a imagem."));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Decodifica um arquivo de imagem de forma robusta, tentando primeiro
 * createImageBitmap (API moderna, mais confiável para arquivos grandes
 * de câmera e formatos como WebP/HEIC) e, se não disponível ou se falhar,
 * recorrendo a uma blob: URL lida via <img> como alternativa.
 */
async function decodeImageFile(
  file: File
): Promise<{ source: ImageBitmap | HTMLImageElement; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Cai para o método alternativo abaixo.
    }
  }

  const blobUrl = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível abrir esta imagem."));
    img.src = blobUrl;
  });

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(blobUrl),
  };
}

/**
 * Recebe o File recém-selecionado pelo usuário e devolve uma blob: URL
 * pronta para o crop, já redimensionada caso a imagem original seja
 * maior que MAX_DIMENSION (comum em fotos de celular Android, que podem
 * vir em 4000px+ e em arquivos grandes).
 */
export async function prepareImageForCrop(file: File): Promise<string> {
  const { source, width, height, cleanup } = await decodeImageFile(file);

  if (!width || !height) {
    cleanup();
    throw new Error(
      "Esta imagem não pôde ser processada. Tente salvá-la de novo (print da tela) ou use outra foto."
    );
  }

  try {
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      // Mesmo sem redimensionar, converte para JPEG num canvas para
      // normalizar o formato (evita problemas com WebP/HEIC no Cropper).
      return await drawToJpegUrl(source, width, height, 0.95);
    }

    const scale = MAX_DIMENSION / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    return await drawToJpegUrl(source, targetWidth, targetHeight, 0.92);
  } finally {
    cleanup();
  }
}

/**
 * Recorta uma imagem de acordo com a área de crop fornecida (em pixels reais
 * da imagem original) e devolve um File já cortado, em formato JPEG.
 *
 * @param imageSrc blob: URL da imagem já preparada (resultado de prepareImageForCrop)
 * @param cropArea Área selecionada, em pixels da imagem original
 * @param outputFileName Nome do arquivo de saída
 */
export async function getCroppedImageFile(
  imageSrc: string,
  cropArea: CropArea,
  outputFileName: string
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível processar o recorte da imagem."));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem neste dispositivo.");

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem cortada."));
          return;
        }
        resolve(new File([blob], outputFileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  });
}
