export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Carrega uma imagem a partir de uma URL e SÓ resolve a Promise quando o
 * elemento está, de fato, completamente carregado e com dimensões
 * conhecidas. Isso é verificado de duas formas (não apenas uma) para
 * evitar falsos positivos: o evento "load" precisa ter disparado E as
 * propriedades naturalWidth/naturalHeight precisam estar populadas.
 *
 * Esta é a única função de carregamento de imagem usada em todo o fluxo
 * de crop, para reduzir o número de lugares onde uma condição de corrida
 * poderia ocorrer.
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    function checkReady() {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(
          new Error(
            "A imagem carregou, mas sem conteúdo válido. Tente selecionar a foto novamente."
          )
        );
      }
    }

    img.onload = checkReady;
    img.onerror = () =>
      reject(new Error("Não foi possível abrir esta imagem. Tente outra foto."));

    img.src = src;

    // Caso a imagem já esteja em cache do navegador, o evento "load" pode
    // não disparar de novo — "complete" cobre esse caso.
    if (img.complete && img.naturalWidth > 0) {
      checkReady();
    }
  });
}

/**
 * Uma única tentativa de ler um File como data: URL via FileReader.
 * Rejeita a Promise se o FileReader disparar onerror ou devolver algo
 * vazio/inválido.
 */
function attemptFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error("Não foi possível ler o arquivo selecionado."));
      }
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converte um File em uma data: URL (base64), com retry automático.
 *
 * Em alguns aparelhos Android, o File vindo da galeria/câmera referencia
 * um content provider do sistema que às vezes ainda não terminou de
 * "liberar" o arquivo no momento em que o FileReader tenta lê-lo — a
 * leitura falha sem motivo aparente, mas tentar de novo um pouco depois
 * costuma funcionar, porque o provider já resolveu nesse intervalo.
 *
 * O que importa aqui é o tempo real de espera entre tentativas (o
 * provider do Android precisa de segundos, não milissegundos, pra
 * liberar o arquivo) — por isso o delay cresce 1s a cada tentativa
 * (1s, 2s, 3s, 4s, 5s...), em vez de várias tentativas rápidas em
 * sequência, que tendem a falhar todas pelo mesmo motivo.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  const MAX_ATTEMPTS = 6;
  const DELAY_STEP_MS = 1000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptFileToDataUrl(file);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await wait(DELAY_STEP_MS * attempt);
      }
    }
  }

  console.error("fileToDataUrl: todas as tentativas falharam", lastError);
  throw new Error("Tente novamente em alguns segundos.");
}

/**
 * Recorta uma imagem (a partir de uma data: URL) de acordo com a área de
 * crop fornecida e devolve um File já cortado, em formato JPEG.
 */
export async function getCroppedImageFile(
  imageSrc: string,
  cropArea: CropArea,
  outputFileName: string
): Promise<File> {
  const image = await loadImageElement(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cropArea.width);
  canvas.height = Math.round(cropArea.height);

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
