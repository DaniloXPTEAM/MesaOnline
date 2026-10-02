/**
 * Enquadramento da imagem do token: o círculo (molde) fica fixo e a pessoa arrasta a imagem por baixo dele, escolhendo
 * a cabeça ou o corpo inteiro. A comportamento vem do formulário "Novo token" do VTT antigo (posição X/Y da imagem);
 * a tela é nossa. No fim, o enquadramento é "assado" numa imagem quadrada: o token já nasce com o recorte certo.
 *
 * Geometria em pixels da caixa de prévia (`box`): a imagem cobre a caixa inteira (como `object-fit: cover`) vezes o zoom, e
 * `x`/`y` deslocam o centro dela a partir do centro da caixa.
 */
export interface TokenFrame { zoom: number; x: number; y: number }

export const FRAME_BOX = 240;
export const FRAME_OUT = 512;
export const FRAME_ZOOM_MIN = 1;
export const FRAME_ZOOM_MAX = 4;
export const DEFAULT_FRAME: TokenFrame = { zoom: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Tamanho com que a imagem aparece na caixa: cobre o círculo e cresce com o zoom. */
export function framedSize(naturalWidth: number, naturalHeight: number, box: number, zoom: number): { width: number; height: number } {
  const base = Math.max(box / Math.max(1, naturalWidth), box / Math.max(1, naturalHeight));
  const z = clamp(zoom, FRAME_ZOOM_MIN, FRAME_ZOOM_MAX);
  return { width: naturalWidth * base * z, height: naturalHeight * base * z };
}

/** Mantém a imagem cobrindo a caixa toda: não dá para arrastá-la deixando um vazio dentro do círculo. */
export function clampFrame(naturalWidth: number, naturalHeight: number, box: number, frame: TokenFrame): TokenFrame {
  const zoom = clamp(frame.zoom, FRAME_ZOOM_MIN, FRAME_ZOOM_MAX);
  const { width, height } = framedSize(naturalWidth, naturalHeight, box, zoom);
  const maxX = Math.max(0, (width - box) / 2);
  const maxY = Math.max(0, (height - box) / 2);
  return { zoom, x: clamp(frame.x, -maxX, maxX), y: clamp(frame.y, -maxY, maxY) };
}

/** Retângulo (em pixels da saída) onde a imagem inteira deve ser desenhada para reproduzir a prévia. */
export function bakeRect(naturalWidth: number, naturalHeight: number, frame: TokenFrame, box = FRAME_BOX, out = FRAME_OUT): { x: number; y: number; width: number; height: number } {
  const safe = clampFrame(naturalWidth, naturalHeight, box, frame);
  const { width, height } = framedSize(naturalWidth, naturalHeight, box, safe.zoom);
  const k = out / box;
  return { x: (box / 2 + safe.x - width / 2) * k, y: (box / 2 + safe.y - height / 2) * k, width: width * k, height: height * k };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não consegui abrir a imagem."));
    image.src = src;
  });
}

/** Gera a imagem quadrada do token com o enquadramento escolhido. Sem canvas (testes), devolve a imagem como veio. */
export async function bakeToken(src: string, frame: TokenFrame, box = FRAME_BOX, out = FRAME_OUT): Promise<string> {
  if (typeof document === "undefined") return src;
  // GIF animado: desenhar no canvas guardaria só o 1º quadro. Fica o arquivo original, que o <img> do token anima sozinho.
  if (/^data:image\/gif/i.test(src) || /\.gif(\?|$)/i.test(src)) return src;
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = out; canvas.height = out;
  const context = canvas.getContext("2d");
  if (!context) return src;
  const rect = bakeRect(image.naturalWidth, image.naturalHeight, frame, box, out);
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  return canvas.toDataURL("image/webp", 0.9);
}
