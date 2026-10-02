import { isoLayout } from "../tactics/iso-layout";
import { getCell } from "./rules";
import type { BattleMap } from "./types";
import type { Size } from "./mapView";

/**
 * Visão 2D / isométrica do palco. A geometria é a do V3 religada: `tactics/iso-layout.ts`
 * (losango 52 × 27, escala pelo tamanho do mapa, `map.isoGrid`/`map.isoImage`) e o giro em passos de
 * 90° do `IsometricBoard` (`components/BattleBoard.tsx`). O mapa é desenhado por
 * `components/IsometricMapCanvas.tsx` (uma projeção contínua, faces laterais nas células elevadas).
 */
export type StageViewMode = "2d" | "iso";
export type StageRotation = 0 | 90 | 180 | 270;

/** Espaço de desenho da visão isométrica (o mesmo do canvas do V3). */
export const ISO_STAGE_SIZE: Size = { width: 1000, height: 700 };

export function nextRotation(rotation: StageRotation, direction: 1 | -1): StageRotation {
  return ((((rotation / 90 + direction) % 4) + 4) % 4 * 90) as StageRotation;
}

export function rotateCell(x: number, y: number, cols: number, rows: number, rotation: StageRotation): { x: number; y: number } {
  const step = rotation / 90;
  if (step === 1) return { x: rows - 1 - y, y: x };
  if (step === 2) return { x: cols - 1 - x, y: rows - 1 - y };
  if (step === 3) return { x: y, y: cols - 1 - x };
  return { x, y };
}

/** Ponto do centro da célula no espaço isométrico, com a elevação já descontada. */
export function isoPoint(map: BattleMap, x: number, y: number, rotation: StageRotation): { x: number; y: number; elevation: number } {
  const layout = isoLayout(map, rotation / 90);
  const rotated = rotateCell(x, y, map.cols, map.rows, rotation);
  const elevation = getCell(map, x, y).elevation;
  return {
    x: layout.originX + (rotated.x - rotated.y) * layout.tileW / 2,
    y: layout.originY + (rotated.x + rotated.y) * layout.tileH / 2 - elevation * layout.elevationStep,
    elevation,
  };
}

/** Deslocamento da câmera que leva uma célula ao centro da tela (zoom mantido). */
export function isoFocus(map: BattleMap, cell: { x: number; y: number }, rotation: StageRotation, scale: number): { x: number; y: number } {
  const point = isoPoint(map, cell.x, cell.y, rotation);
  return { x: -(point.x - ISO_STAGE_SIZE.width / 2) * scale, y: -(point.y - ISO_STAGE_SIZE.height / 2) * scale };
}
