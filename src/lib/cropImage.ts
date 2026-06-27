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
 * Cria uma URL local (blob:) a partir de um File selecionado pelo usuário.
 *
 * Esta é a estratégia principal de leitura de arquivo no fluxo de crop,
 * substituindo o antigo uso de FileReader.readAsDataURL. Diferença chave:
 * createObjectURL NÃO lê o conteúdo binário do arquivo para gerar a
 * referência — ele apenas aponta para o objeto File já existente na
 * memória do navegador. Isso evita por completo o tipo de erro
 * intermitente que o FileReader podia disparar no Android ao tentar ler
 * arquivos vindos do content provider do sistema.
 *
 * IMPORTANTE: toda URL criada aqui deve ser liberada com
 * revokeObjectUrlSafe() quando não for mais necessária (crop cancelado,
 * crop confirmado, ou troca de imagem), para evitar acúmulo de memória.
 */
export function fileToObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Libera uma URL criada por fileToObjectUrl. Seguro de chamar mesmo se a
 * URL já tiver sido revogada ou for null/undefined — não lança erro.
 */
export function revokeObjectUrlSafe(url: string | null | undefined): void {
  if (!url) return;
  if (!url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Revogar uma URL já revogada não deve quebrar o fluxo do usuário.
  }
}

/**
 * Se a imagem for maior que maxDimension em qualquer lado, redimensiona
 * proporcionalmente usando um canvas temporário e devolve um novo File
 * (sempre em JPEG, qualidade 0.92). Fotos de câmeras modernas podem vir
 * em 4000px+ de largura, o que deixa o crop pesado e, em alguns
 * dispositivos, pode estourar o limite de memória do canvas. Se a
 * imagem já for pequena, devolve o próprio File original sem mudanças.
 */
export async function downscaleImageIfNeeded(
  file: File,
  maxDimension: number = 1920
): Promise<File> {
  const objectUrl = fileToObjectUrl(file);

  try {
    const image = await loadImageElement(objectUrl);
    const { naturalWidth: width, naturalHeight: height } = image;

    if (width <= maxDimension && height <= maxDimension) {
      return file;
    }

    const scale = Math.min(maxDimension / width, maxDimension / height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Não foi possível redimensionar; segue com o arquivo original.
      return file;
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    if (!blob) return file;

    return new File([blob], file.name, { type: "image/jpeg" });
  } catch (err) {
    console.error("downscaleImageIfNeeded: falhou, usando arquivo original", err);
    return file;
  } finally {
    revokeObjectUrlSafe(objectUrl);
  }
}

/**
 * Recorta uma imagem (a partir de uma URL, seja blob: ou data:) de acordo
 * com a área de crop fornecida e devolve um File já cortado, em JPEG.
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

  try {
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

    return await new Promise((resolve, reject) => {
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
  } catch (err) {
    console.error("getCroppedImageFile: erro ao gerar o recorte", err);
    throw new Error(
      "Não foi possível processar esta imagem. Tente novamente ou use outra foto."
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CÓDIGO MANTIDO COMO REFERÊNCIA, NÃO USADO NO FLUXO ATUAL
// ─────────────────────────────────────────────────────────────────────────
// O fluxo principal de leitura de arquivo passou a usar fileToObjectUrl()
// (via URL.createObjectURL), que não lê o conteúdo binário do arquivo e
// por isso não está sujeito ao tipo de erro abaixo. As funções a seguir
// foram a abordagem anterior (FileReader + retry) e ficam aqui apenas
// como histórico/comparação, caso seja necessário investigar no futuro.

/**
 * Uma única tentativa de ler um File como data: URL via FileReader.
 * @deprecated não usado no fluxo atual — ver comentário acima.
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
 * @deprecated não usado no fluxo atual — ver comentário acima.
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
