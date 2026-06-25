export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1600;

/**
 * Lê um File e devolve uma data: URL (base64) com o conteúdo completo já
 * em memória. Diferente de URL.createObjectURL, que cria uma referência
 * "lazy" ao arquivo, FileReader força a leitura completa dos bytes antes
 * de resolver — o que evita problemas de timing onde a imagem parece
 * carregada mas ainda não está pronta para ser desenhada em canvas
 * (sintoma: falha às vezes, funciona "insistindo").
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}

/**
 * Carrega uma imagem a partir de uma URL (data: ou blob:) garantindo que
 * o elemento <img> está pronto para ser desenhado em canvas.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "Não foi possível abrir esta imagem. Tente outra foto ou salve-a novamente antes de enviar."
        )
      );
    image.src = url;
  });
}

/**
 * Recebe o File recém-selecionado pelo usuário e devolve uma data: URL
 * pronta para o crop, já redimensionada caso a imagem original seja
 * maior que MAX_DIMENSION (comum em fotos de celular Android, que podem
 * vir em 4000px+).
 */
export async function prepareImageForCrop(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const { naturalWidth: width, naturalHeight: height } = image;

  if (!width || !height) {
    throw new Error(
      "Esta imagem não pôde ser processada. Tente salvá-la de novo (print da tela) ou use outra foto."
    );
  }

  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return dataUrl;
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

  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Recorta uma imagem de acordo com a área de crop fornecida (em pixels reais
 * da imagem original) e devolve um File já cortado, em formato JPEG.
 *
 * @param imageSrc data: URL (ou blob:) da imagem original
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
