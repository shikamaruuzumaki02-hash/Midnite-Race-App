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
 * A causa raiz do erro intermitente nesse fluxo era outra: o componente
 * que chama esta função limpava o valor do <input type="file"> antes da
 * leitura terminar, o que em alguns navegadores Android revoga a
 * permissão temporária de acesso ao arquivo (NotReadableError) — corrigido
 * movendo essa limpeza para depois da leitura. O retry abaixo continua
 * como uma rede de segurança extra para casos de lentidão genuína do
 * dispositivo, mas não é mais a defesa principal contra o bug.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  const MAX_ATTEMPTS = 3;
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
  throw new Error("Não foi possível ler o arquivo selecionado. Tente novamente.");
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
