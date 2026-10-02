/**
 * ANDARES / MULTINÍVEL.
 *
 * Recuperado de `Vtt/app.js`, onde o andar era codificado no `z` do elemento
 * (`getFloorFromZ`, `selecionarPatamar`, `_invalidateOutdoorCache`): cada
 * parede, luz e token pertencia a um andar, e a cena mostrava um por vez.
 *
 * Aqui o andar é um campo explícito (`floor`), com 0 como padrão — cenas
 * antigas continuam válidas sem migração, porque ausente significa térreo.
 */
import type { BoardLight, BoardObject, BoardShape, BoardState, BoardToken, BoardWall } from "./types";

export interface FloorInfo {
  index: number;
  label: string;
  tokens: number;
  walls: number;
  lights: number;
  shapes: number;
  objects: number;
}

export const GROUND = 0;

/** Andar de um elemento; ausente = térreo. Compatível com cenas antigas. */
export function floorOf(entry: { floor?: number } | null | undefined): number {
  return Math.trunc(entry?.floor ?? GROUND);
}

export function activeFloor(board: BoardState): number {
  return Math.trunc(board.activeFloor ?? GROUND);
}

export function floorLabel(index: number): string {
  if (index === 0) return "Térreo";
  if (index > 0) return `${index}º andar`;
  return `Subsolo ${Math.abs(index)}`;
}

/** Todos os andares com conteúdo, mais o ativo, ordenados de baixo para cima. */
export function floorsOf(board: BoardState): FloorInfo[] {
  const indices = new Set<number>([GROUND, activeFloor(board)]);
  for (const token of board.tokens) indices.add(floorOf(token));
  for (const wall of board.walls) indices.add(floorOf(wall));
  for (const light of board.lights) indices.add(floorOf(light));
  for (const shape of board.shapes) indices.add(floorOf(shape));
  for (const object of board.objects) indices.add(floorOf(object));

  return [...indices].sort((a, b) => a - b).map((index) => ({
    index,
    label: floorLabel(index),
    tokens: board.tokens.filter((t) => floorOf(t) === index).length,
    walls: board.walls.filter((w) => floorOf(w) === index).length,
    lights: board.lights.filter((l) => floorOf(l) === index).length,
    shapes: board.shapes.filter((shape) => floorOf(shape) === index).length,
    objects: board.objects.filter((object) => floorOf(object) === index).length,
  }));
}

/** Elementos do andar visível. É o filtro que a cena aplica antes de desenhar. */
export function visibleOnFloor(board: BoardState, floor = activeFloor(board)): {
  tokens: BoardToken[]; walls: BoardWall[]; lights: BoardLight[]; shapes: BoardShape[]; objects: BoardObject[];
} {
  return {
    tokens: board.tokens.filter((token) => floorOf(token) === floor),
    walls: board.walls.filter((wall) => floorOf(wall) === floor),
    lights: board.lights.filter((light) => floorOf(light) === floor),
    shapes: board.shapes.filter((shape) => floorOf(shape) === floor),
    objects: board.objects.filter((object) => floorOf(object) === floor),
  };
}

/** Move um token de andar, preservando a posição no plano. */
export function moveTokenToFloor(token: BoardToken, floor: number): BoardToken {
  return { ...token, floor: Math.trunc(floor) };
}
