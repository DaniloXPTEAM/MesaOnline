import type { BoardWall, BoardWallType } from "../../game/types";
import { getBoard, removeWall, upsertWall } from "../../game/vttBridge";
import { activeFloor } from "../../game/floors";

export function createBoardBarrier(
  type: Exclude<BoardWallType, "invisible">,
  from: { x: number; y: number },
  to: { x: number; y: number } = from,
  floor = activeFloor(getBoard()),
): BoardWall {
  const wall: BoardWall = {
    id: `wall-${crypto.randomUUID()}`,
    floor,
    type,
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y,
    open: type === "door" || type === "window" ? false : undefined,
    locked: false,
    name: type === "door" ? "Porta" : type === "window" ? "Janela" : "Parede",
  };
  upsertWall(wall);
  return wall;
}

export function toggleBarrier(wallId: string): BoardWall {
  const wall = getBoard().walls.find((entry) => entry.id === wallId);
  if (!wall) throw new Error("Parede, porta ou janela não encontrada.");
  if (wall.type !== "door" && wall.type !== "window") return wall;
  if (wall.locked) throw new Error(`${wall.name || "A barreira"} está trancada.`);
  const next = { ...wall, open: !wall.open };
  upsertWall(next);
  return next;
}

export function deleteBarrier(wallId: string): void {
  removeWall(wallId);
}
