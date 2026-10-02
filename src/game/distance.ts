/**
 * FONTE ÚNICA DE VERDADE PARA DISTÂNCIA, GRADE E ESCALA.
 *
 * Régua, movimento, alcance e áreas DEVEM consultar este módulo.
 * Antes desta unificação a régua media Chebyshev (`Math.max(|dx|,|dy|) * 1.5`)
 * enquanto o movimento cobrava a regra T20 de dupla diagonal — uma diagonal de
 * 4 casas era exibida como 6 m e cobrada como 12 m.
 *
 * Recuperado de `Vtt/app.js` (`_rulerFlatDist`, `drawRulerPreview`,
 * `BOARD.distanceMode`, `BOARD.gridType`, `gridScaleVal`, `gridScaleUnit`).
 */

export type DistanceMode = "square" | "double_diagonal" | "euclidean";
export type GridType = "square" | "hex";

export interface GridSettings {
  /** metros (ou unidade escolhida) por célula */
  scale: number;
  /** rótulo da unidade, ex.: "m" */
  unit: string;
  /** métrica de distância; Tormenta 20 usa dupla diagonal */
  distanceMode: DistanceMode;
  /** formato da grade */
  type: GridType;
}

/** Padrão Tormenta 20: 1 quadrado = 1,5 m e diagonal custa o dobro. */
export const DEFAULT_GRID: GridSettings = {
  scale: 1.5,
  unit: "m",
  distanceMode: "double_diagonal",
  type: "square",
};

export const DISTANCE_MODE_LABEL: Record<DistanceMode, string> = {
  square: "Quadrada (Chebyshev)",
  double_diagonal: "Dupla diagonal (T20)",
  euclidean: "Euclidiana",
};

export function gridSettings(partial?: Partial<GridSettings> | null): GridSettings {
  return { ...DEFAULT_GRID, ...(partial || {}) };
}

/**
 * Grade ATIVA da cena. Todas as funcoes deste modulo caem aqui por padrao,
 * entao trocar a escala/metrica na UI vale para regua, movimento, alcance e
 * areas ao mesmo tempo — sem `1.5` fixo espalhado pelo codigo.
 */
let ATIVA: GridSettings = DEFAULT_GRID;

export function activeGrid(): GridSettings { return ATIVA; }

export function setActiveGrid(partial?: Partial<GridSettings> | null): GridSettings {
  ATIVA = gridSettings(partial);
  return ATIVA;
}

export interface Cell {
  x: number;
  y: number;
}

/**
 * Custo em CÉLULAS entre duas posições de grade.
 * Para `double_diagonal` cada passo diagonal vale 2 células (regra T20).
 */
export function cellsBetween(a: Cell, b: Cell, grid: GridSettings = activeGrid()): number {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  if (grid.type === "hex") {
    // Coordenadas offset "odd-r" convertidas para cubo.
    const ac = offsetToCube(a);
    const bc = offsetToCube(b);
    return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
  }
  switch (grid.distanceMode) {
    case "square":
      return Math.max(dx, dy);
    case "euclidean":
      return Math.hypot(dx, dy);
    case "double_diagonal":
    default:
      // diagonais contam duas vezes: (retas) + 2 × (diagonais)
      return Math.max(dx, dy) + Math.min(dx, dy);
  }
}

/**
 * Custo de UM passo de grade, em células.
 * É a mesma regra de `cellsBetween`, usada pelo Dijkstra do movimento.
 */
export function stepCost(dx: number, dy: number, grid: GridSettings = activeGrid()): number {
  return cellsBetween({ x: 0, y: 0 }, { x: dx, y: dy }, grid);
}

/** Distância na unidade da cena (metros por padrão). */
export function distanceBetween(a: Cell, b: Cell, grid: GridSettings = activeGrid()): number {
  return cellsBetween(a, b, grid) * grid.scale;
}

/** Converte metros em orçamento de células (usado pelo alcance de movimento). */
export function metersToCells(meters: number, grid: GridSettings = activeGrid()): number {
  return grid.scale > 0 ? meters / grid.scale : 0;
}

/** Converte células em metros. */
export function cellsToMeters(cells: number, grid: GridSettings = activeGrid()): number {
  return cells * grid.scale;
}

/** `true` se `b` está dentro de `rangeM` a partir de `a`, pela métrica da cena. */
export function withinRange(a: Cell, b: Cell, rangeM: number, grid: GridSettings = activeGrid()): boolean {
  return distanceBetween(a, b, grid) <= rangeM;
}

/** Rótulo pronto para a interface, ex.: "7,5 m". */
export function formatDistance(meters: number, grid: GridSettings = activeGrid()): string {
  const rounded = Math.round(meters * 10) / 10;
  return `${rounded.toLocaleString("pt-BR")} ${grid.unit}`;
}

function offsetToCube(cell: Cell) {
  const q = cell.x - (cell.y - (cell.y & 1)) / 2;
  const r = cell.y;
  return { q, r, s: -q - r };
}
