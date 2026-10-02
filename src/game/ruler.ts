import { type Cell, type GridSettings, activeGrid, distanceBetween } from "./distance";

/**
 * Régua com waypoints (recuperada do legado: "Régua com waypoints"). Cada clique
 * acrescenta um ponto; a distância é a soma dos trechos, pela mesma regra de
 * distância da cena (game/distance.ts) que movimento e alcance usam.
 */
export function pathDistance(points: readonly Cell[], grid: GridSettings = activeGrid()): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) total += distanceBetween(points[index - 1], points[index], grid);
  return total;
}

/** Trechos acumulados, ponto a ponto (para mostrar o parcial em cada waypoint). */
export function pathLegs(points: readonly Cell[], grid: GridSettings = activeGrid()): number[] {
  const legs: number[] = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceBetween(points[index - 1], points[index], grid);
    legs.push(total);
  }
  return legs;
}
