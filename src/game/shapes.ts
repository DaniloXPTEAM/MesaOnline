/**
 * ÁREAS GEOMÉTRICAS E AURAS.
 *
 * Antes a ferramenta "Áreas" só marcava célula por célula — um contador.
 * Aqui ela ganha as formas do VTT antigo (`shape.kind` circle/rect/freehand)
 * e do V3 (cone e linha, usados por magias de área), mais as auras de token
 * (`aura.radius`, `aura.light`, `aura.active` — 118 referências no legado).
 *
 * Tudo em coordenadas de grade e reaproveitando a regra única de distância
 * (`game/distance.ts`). Não cria matemática paralela.
 */
import { type Cell, type GridSettings, activeGrid, cellsBetween, metersToCells } from "./distance";

export type ShapeKind = "cells" | "circle" | "rect" | "line" | "cone" | "polygon";

export interface ShapeGeometry {
  kind: ShapeKind;
  origin: Cell;
  /** ponto que define raio, canto oposto, fim da linha ou direção do cone */
  to?: Cell;
  /** vértices de um polígono editável, em coordenadas de grade */
  points?: Cell[];
  /** raio/comprimento em metros; quando ausente é derivado de `to` */
  sizeM?: number;
  /** rotação declarativa em graus; cone/linha usam a direção origin→to */
  rotation?: number;
}

export interface AuraSpec {
  radiusM: number;
  /** a aura também ilumina (entra em lightedCells) */
  light?: boolean;
  active?: boolean;
  color?: string;
}

const key = (x: number, y: number) => `${x},${y}`;

/** Células de um círculo centrado em `origin`, raio em metros. */
export function circleCells(origin: Cell, radiusM: number, grid: GridSettings = activeGrid()): string[] {
  const raio = Math.max(0, Math.floor(metersToCells(radiusM, grid)));
  const saida: string[] = [];
  for (let dx = -raio; dx <= raio; dx += 1) {
    for (let dy = -raio; dy <= raio; dy += 1) {
      if (dx * dx + dy * dy > raio * raio) continue;
      const x = origin.x + dx, y = origin.y + dy;
      if (x < 0 || y < 0) continue;
      saida.push(key(x, y));
    }
  }
  return saida;
}

/** Retângulo entre dois cantos, inclusivo. */
export function rectCells(a: Cell, b: Cell): string[] {
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const saida: string[] = [];
  for (let x = x0; x <= x1; x += 1) for (let y = y0; y <= y1; y += 1) {
    if (x < 0 || y < 0) continue;
    saida.push(key(x, y));
  }
  return saida;
}

/** Linha de `a` até `b` (Bresenham), como as linhas de efeito do T20. */
export function lineCells(a: Cell, b: Cell): string[] {
  const saida: string[] = [];
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1;
  let err = dx - dy;
  for (let guard = 0; guard < 4096; guard += 1) {
    if (x >= 0 && y >= 0) saida.push(key(x, y));
    if (x === b.x && y === b.y) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return saida;
}

/**
 * Cone com vértice em `origin` apontando para `towards`, comprimento em metros.
 * Aproximação de grade: meia-abertura de 45°, como o cone do T20.
 */
export function coneCells(
  origin: Cell, towards: Cell, lengthM: number, grid: GridSettings = activeGrid(),
): string[] {
  const alcance = Math.max(1, Math.floor(metersToCells(lengthM, grid)));
  const dirX = towards.x - origin.x, dirY = towards.y - origin.y;
  const norma = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / norma, uy = dirY / norma;
  const saida: string[] = [];
  for (let dx = -alcance; dx <= alcance; dx += 1) {
    for (let dy = -alcance; dy <= alcance; dy += 1) {
      if (!dx && !dy) continue;
      const dist = Math.hypot(dx, dy);
      if (dist > alcance) continue;
      const cos = (dx * ux + dy * uy) / (dist || 1);
      if (cos < Math.SQRT1_2 - 1e-9) continue; // fora dos 45°
      const x = origin.x + dx, y = origin.y + dy;
      if (x < 0 || y < 0) continue;
      saida.push(key(x, y));
    }
  }
  saida.push(key(origin.x, origin.y));
  return saida;
}

/**
 * Preenchimento de polígono por ponto no centro da célula, preservando também
 * todas as bordas Bresenham. Isso torna o resultado estável para AoE, alcance
 * e gatilhos, sem depender de uma prévia de canvas.
 */
export function polygonCells(points: Cell[]): string[] {
  if (points.length < 3) return points.length ? [key(points[0].x, points[0].y)] : [];
  const minX = Math.floor(Math.min(...points.map((point) => point.x)));
  const maxX = Math.ceil(Math.max(...points.map((point) => point.x)));
  const minY = Math.floor(Math.min(...points.map((point) => point.y)));
  const maxY = Math.ceil(Math.max(...points.map((point) => point.y)));
  const inside = (x: number, y: number) => {
    let result = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const a = points[i], b = points[j];
      const crosses = (a.y > y) !== (b.y > y);
      if (crosses && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) result = !result;
    }
    return result;
  };
  const cells = new Set<string>();
  for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) {
    if (x >= 0 && y >= 0 && inside(x + .5, y + .5)) cells.add(key(x, y));
  }
  for (let index = 0; index < points.length; index += 1) {
    const edge = lineCells(points[index], points[(index + 1) % points.length]);
    edge.forEach((cell) => cells.add(cell));
  }
  return [...cells];
}

/** Move uma geometria mantendo raio/dimensões/rotação. */
export function translateGeometry(geometry: ShapeGeometry, dx: number, dy: number): ShapeGeometry {
  const move = (cell: Cell): Cell => ({ x: cell.x + dx, y: cell.y + dy });
  return {
    ...geometry,
    origin: move(geometry.origin),
    ...(geometry.to ? { to: move(geometry.to) } : {}),
    ...(geometry.points ? { points: geometry.points.map(move) } : {}),
  };
}

/** Tokens cujo ponto de grade está dentro das células efetivas da forma. */
export function tokensInCells<T extends { gx: number; gy: number }>(tokens: T[], cells: Iterable<string>): T[] {
  const covered = new Set(cells);
  return tokens.filter((token) => covered.has(key(token.gx, token.gy)));
}

/** Resolve qualquer geometria em células. */
export function shapeCells(geometry: ShapeGeometry, grid: GridSettings = activeGrid()): string[] {
  const { kind, origin, to } = geometry;
  const sizeM = geometry.sizeM ?? (to ? cellsBetween(origin, to, grid) * grid.scale : grid.scale);
  if (kind === "circle") return circleCells(origin, sizeM, grid);
  if (kind === "rect" && to) return rectCells(origin, to);
  if (kind === "line" && to) return lineCells(origin, to);
  if (kind === "cone" && to) return coneCells(origin, to, sizeM, grid);
  if (kind === "polygon") return polygonCells(geometry.points || [origin, ...(to ? [to] : [])]);
  return [key(origin.x, origin.y)];
}

/** Células cobertas pela aura de um token. */
export function auraCells(
  token: { gx: number; gy: number; aura?: AuraSpec | null },
  grid: GridSettings = activeGrid(),
): string[] {
  const aura = token.aura;
  if (!aura || aura.active === false || !(aura.radiusM > 0)) return [];
  return circleCells({ x: token.gx, y: token.gy }, aura.radiusM, grid);
}

export const SHAPE_LABEL: Record<ShapeKind, string> = {
  cells: "Células",
  circle: "Círculo",
  rect: "Retângulo",
  line: "Linha",
  cone: "Cone",
  polygon: "Polígono",
};
