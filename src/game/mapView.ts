/**
 * Regras puras da vista do mapa (palco): tamanho do tabuleiro, enquadramento,
 * foco em uma célula, grade sugerida a partir da imagem e posição da imagem.
 * O palco (`components/mesa/MapStage.tsx`) só aplica estes números.
 */

/** Lado, em pixels, de uma célula no palco. Células sempre quadradas. */
export const CELL_PX = 52;

/** Zoom mínimo baixo o bastante para caber mapas enormes. */
export const MIN_ZOOM = 0.03;
export const MAX_ZOOM = 3;
/** Ao enquadrar, mapas pequenos não passam deste zoom. */
export const MAX_FIT_ZOOM = 2.6;

export interface Size { width: number; height: number }

/** Tamanho do tabuleiro: exatamente colunas × linhas de células quadradas. */
export function boardPixelSize(cols: number, rows: number): Size {
  return { width: Math.max(1, cols) * CELL_PX, height: Math.max(1, rows) * CELL_PX };
}

/** Zoom que faz o mapa inteiro caber na área visível, por maior que seja o mapa. */
export function fitScale(zone: Size, board: Size, margin = 16): number {
  if (zone.width <= 0 || zone.height <= 0) return 1;
  const scale = Math.min((zone.width - margin) / board.width, (zone.height - margin) / board.height, MAX_FIT_ZOOM);
  return Math.max(MIN_ZOOM, scale);
}

/** Limita um zoom escolhido pelo usuário. */
export function clampZoom(scale: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
}

/** Deslocamento da câmera que põe a célula no centro da área visível (zoom mantido). */
export function focusCamera(cell: { x: number; y: number }, map: { cols: number; rows: number }, board: Size, scale: number): { x: number; y: number } {
  const dx = ((cell.x + 0.5) / map.cols) * board.width - board.width / 2;
  const dy = ((cell.y + 0.5) / map.rows) * board.height - board.height / 2;
  return { x: -dx * scale, y: -dy * scale };
}

/** Grade sugerida para uma imagem (célula padrão de 70 px), com teto para imagens gigantes. */
export function gridFromImage(width: number, height: number, cellPx = 70): { cols: number; rows: number } {
  const clamp = (value: number) => Math.max(4, Math.min(200, Math.round(value)));
  if (!(width > 0) || !(height > 0)) return { cols: 20, rows: 20 };
  return { cols: clamp(width / cellPx), rows: clamp(height / cellPx) };
}

/** Posição e escala da imagem em relação à grade (em células). */
export interface ImagePlacement { offsetX: number; offsetY: number; scale: number }

export function imagePlacement(map: { offsetX?: number; offsetY?: number; imageScale?: number }): ImagePlacement {
  return {
    offsetX: Number.isFinite(map.offsetX) ? Number(map.offsetX) : 0,
    offsetY: Number.isFinite(map.offsetY) ? Number(map.offsetY) : 0,
    scale: Number.isFinite(map.imageScale) && Number(map.imageScale) > 0 ? Number(map.imageScale) : 1,
  };
}

/** Arredonda o deslocamento para passos de 1/20 de célula (alinhamento firme, sem tremer). */
export function snapOffset(value: number, step = 0.05): number {
  return Math.round(value / step) * step;
}

/** Estilo da imagem do mapa a partir da posição e da escala. */
export function imageStyle(map: { offsetX?: number; offsetY?: number; imageScale?: number }): { transform: string; transformOrigin: string } {
  const placement = imagePlacement(map);
  return {
    transform: `translate(${placement.offsetX * CELL_PX}px, ${placement.offsetY * CELL_PX}px) scale(${placement.scale})`,
    transformOrigin: "0 0",
  };
}
