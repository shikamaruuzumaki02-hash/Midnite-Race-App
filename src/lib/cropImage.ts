export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1600;

/**
 * Carrega uma imagem a partir de uma URL (incluindo blob: URLs locais).
 *
 * Tenta usar decode() para garantir que a imagem está pronta para ser
 * desenhada em canvas (importante em fotos grandes de celular), mas não
 * trata falha de decode() como erro fatal: alguns formatos (ex: WebP
 * baixado de sites como Pinterest ou ChatGPT) podem falhar no decode()
 * em certos navegadores Android mesmo estando, na prática, prontos para
 * uso. Nesses casos, a imagem é usada normalmente assim que "onload"
 * disparar.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;

    image.onload = async () => {
      if ("decode" in image) {
        try {
          await image.decode();
        } catch {
          // Ignora falha de decode(): a imagem já disparou "onload",
          // então geralmente está pronta para ser desenhada mesmo assim.
        }
      }
      if (!settled) {
        settled = true;
        resolve(image);
      }
    };

    image.onerror = () => {
      if (!settled) {
        settled = true;
        reject(
          new Error(
            "Não foi possível abrir esta imagem. Tente outra foto ou salve-a novamente antes de enviar."
          )
        );
      }
    };

    image.src = url;
  });
}

/**
 * Recebe a URL local (blob:) de uma foto recém-selecionada e, se ela for
 * maior que MAX_DIMENSION num dos lados, redimensiona para um tamanho
 * razoável antes do crop. Fotos de celular Android costumam vir em
 * resoluções muito altas (4000px+), o que pode travar ou falhar no canvas
 * durante o recorte. Devolve uma nova blob: URL já no tamanho adequado.
 *
 * Se a imagem já é pequena, devolve a mesma URL sem reprocessar.
 */
export async function prepareImageForCrop(originalUrl: string): Promise<string> {
  const image = await loadImage(originalUrl);

  const { naturalWidth: width, naturalHeight: height } = image;

  if (!width || !height) {
    // Algumas imagens corrompidas ou em formatos não suportados pelo
    // navegador carregam o elemento <img> mas com dimensões zeradas.
    throw new Error(
      "Esta imagem não pôde ser processada. Tente salvá-la de novo (print da tela) ou use outra foto."
    );
  }

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
