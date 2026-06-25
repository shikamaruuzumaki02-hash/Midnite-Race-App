export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Carrega uma imagem a partir de uma URL (incluindo blob: URLs locais).
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
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
