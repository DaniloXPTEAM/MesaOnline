import type { BoardObject, BoardState } from "./types";

export const OBJECT_KIND_LABEL: Record<BoardObject["kind"], string> = { item: "Item", chest: "Baú", treasure: "Tesouro" };

/** Primeira casa livre de objeto ao redor de `origin` (ou a própria, se tudo estiver ocupado). Com `includeOrigin`, a própria casa vale primeiro (item largado aos pés). */
export function freeObjectSpot(board: Pick<BoardState, "map" | "objects">, floor: number, origin: { x: number; y: number }, includeOrigin = false): { x: number; y: number } {
  const taken = new Set(board.objects.filter((object) => Math.trunc(object.floor ?? 0) === floor).map((object) => `${object.x},${object.y}`));
  const offsets = [...(includeOrigin ? [[0, 0]] : []), [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2], [0, 0]];
  return offsets.map(([dx, dy]) => ({ x: origin.x + dx, y: origin.y + dy }))
    .find((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < board.map.cols && cell.y < board.map.rows && !taken.has(`${cell.x},${cell.y}`)) || origin;
}

export function newBoardObject(kind: BoardObject["kind"], floor: number, spot: { x: number; y: number }, name?: string, image?: string): BoardObject {
  return { id: `object-${crypto.randomUUID()}`, floor, kind, name: name || (kind === "item" ? "Item de cena" : OBJECT_KIND_LABEL[kind]), x: spot.x, y: spot.y, opened: false, locked: false, contents: [], ...(image ? { image } : {}) };
}
