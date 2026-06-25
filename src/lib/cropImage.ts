export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1600;

/**
 * Carrega uma imagem a partir de uma URL (incluindo blob: URLs locais),
 * garantindo que ela esteja totalmente decodificada antes de resolver.
 * Isso evita falhas em fotos grandes de celular, onde o evento "onload"
 * pode disparar antes da imagem estar realmente pronta para ser desenhada.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      try {
        if ("decode" in image) {
          await image.decode();
        }
        resolve(image);
      } catch {
        resolve(image);
      }
    };
    image.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
    image.src = url;
  });
}

/**
 * Recebe a URL local (blob:) de uma foto recém-selecionada e, se ela for
 * maior que MAX_DIMENSION num dos lados, redimensiona para um tamanho
 * razoável antes do crop. Fotos de celular Android costumam vir em
 * resoluções muito altas (4000px+), o que pode travar ou falhar no canvas
 * durante o recorte. Devolve uma nova blob: URL já no tamanho adequado.
 */
export async function prepareImageForCrop(originalUrl: string): Promise<string> {
  const image = await loadImage(originalUrl);

  const { naturalWidth: width, naturalHeight: height } = image;

  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return originalUrl;
  }

  const scale = MAX_DIMENSION / Math.max(width, height);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem neste dispositivo.");

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível preparar a imagem para o recorte."));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Recorta uma imagem de acordo com a área de crop fornecida (em pixels reais
 * da imagem original) e devolve um File já cortado, em formato JPEG.
 *
 * @param imageSrc URL (geralmente um blob: local) da imagem original
 * @param cropArea Área selecionada, em pixels da imagem original
 * @param outputFileName Nome do arquivo de saída
 */
export async function getCroppedImageFile(
  imageSrc: string,
  cropArea: CropArea,
  outputFileName: string
): Promise<File> {
  const image = await loadImage(imageSrc);

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
