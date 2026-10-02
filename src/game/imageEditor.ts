/**
 * EDITOR DE IMAGEM — recorte, posicionamento e colar da área de transferência.
 *
 * Recuperado de `Vtt/app.js` (`abrirEditorImagem`, `applyCrop`, `usarPasteImg`,
 * `carregarImagemArquivo`, `_capturarThumb`).
 *
 * Funções puras + um utilitário de canvas. Sem dependência de React, para dar
 * para testar o recorte sem montar a interface.
 */
export interface CropRect {
  /** fração 0..1 da largura/altura da imagem original */
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

/** Mantém o recorte dentro da imagem e com tamanho mínimo utilizável. */
export function clampCrop(crop: Partial<CropRect>, min = 0.05): CropRect {
  const width = Math.min(1, Math.max(min, crop.width ?? 1));
  const height = Math.min(1, Math.max(min, crop.height ?? 1));
  const x = Math.min(1 - width, Math.max(0, crop.x ?? 0));
  const y = Math.min(1 - height, Math.max(0, crop.y ?? 0));
  return { x, y, width, height };
}

/** Recorte quadrado centrado — o formato que um token pede. */
export function squareCrop(imageWidth: number, imageHeight: number): CropRect {
  if (imageWidth <= 0 || imageHeight <= 0) return FULL_CROP;
  if (imageWidth === imageHeight) return FULL_CROP;
  if (imageWidth > imageHeight) {
    const width = imageHeight / imageWidth;
    return { x: (1 - width) / 2, y: 0, width, height: 1 };
  }
  const height = imageWidth / imageHeight;
  return { x: 0, y: (1 - height) / 2, width: 1, height };
}

/** `object-position` equivalente ao recorte, para posicionar sem recortar. */
export function cropToObjectPosition(crop: CropRect): string {
  const px = crop.width >= 1 ? 50 : (crop.x / (1 - crop.width)) * 100;
  const py = crop.height >= 1 ? 50 : (crop.y / (1 - crop.height)) * 100;
  return `${Math.round(px)}% ${Math.round(py)}%`;
}

/** Aplica o recorte de verdade e devolve um data URL. Requer canvas. */
export async function applyCrop(
  source: string, crop: CropRect, maxSize = 512,
): Promise<string> {
  if (typeof document === "undefined") return source;
  const img = await loadImage(source);
  const rect = clampCrop(crop);
  const sx = Math.round(img.naturalWidth * rect.x);
  const sy = Math.round(img.naturalHeight * rect.y);
  const sw = Math.max(1, Math.round(img.naturalWidth * rect.width));
  const sh = Math.max(1, Math.round(img.naturalHeight * rect.height));
  const escala = Math.min(1, maxSize / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * escala));
  canvas.height = Math.max(1, Math.round(sh * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Extrai a primeira imagem de um evento de colar (`usarPasteImg` do VTT).
 * Devolve null quando a área de transferência não traz imagem.
 */
export function imageFromClipboard(event: ClipboardEvent): Promise<string | null> {
  const itens = Array.from(event.clipboardData?.items || []);
  const alvo = itens.find((item) => item.type.startsWith("image/"));
  const file = alvo?.getAsFile();
  if (!file) return Promise.resolve(null);
  return fileToDataUrl(file);
}

export function fileToDataUrl(file: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
