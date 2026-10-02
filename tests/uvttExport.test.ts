import { describe, expect, it } from "vitest";
import { isUvtt, parseUvtt } from "../src/game/uvtt";
import { base64FromDataUrl, buildUvtt } from "../src/game/uvttExport";
import type { BoardLight, BoardWall } from "../src/game/types";
import { makeBoard, makeMap } from "./helpers";

const walls: BoardWall[] = [
  { id: "w1", type: "wall", x1: 1, y1: 1, x2: 5, y2: 1 },
  { id: "w2", type: "wall", x1: 5, y1: 1, x2: 5, y2: 4 },
  { id: "d1", type: "door", x1: 2, y1: 6, x2: 3, y2: 6, open: false },
  { id: "d2", type: "door", x1: 7, y1: 6, x2: 8, y2: 6, open: true },
  { id: "j1", type: "window", x1: 9, y1: 2, x2: 9, y2: 3 },
];
const lights: BoardLight[] = [
  { id: "l1", x: 4, y: 4, type: "torch", name: "Tocha", radius: 6, color: "#ffad55", intensity: 0.8, enabled: true },
  { id: "l2", x: 8, y: 8, type: "torch", name: "Apagada", radius: 3, color: "#ffffff", intensity: 1, enabled: false },
];

describe("exportar UVTT", () => {
  const board = makeBoard([], { walls, lights, map: makeMap({ cols: 24, rows: 18, offsetX: 1.5, offsetY: -0.25, imageScale: 1.1 }) });
  const file = buildUvtt(board, "QUJD");

  it("gera um arquivo que o importador reconhece", () => {
    expect(isUvtt(file)).toBe(true);
    expect(file.image).toBe("QUJD");
    expect((file.resolution as { map_size: { x: number; y: number } }).map_size).toEqual({ x: 24, y: 18 });
  });

  it("separa paredes, portas/janelas e só leva luzes acesas", () => {
    expect((file.line_of_sight as unknown[]).length).toBe(2);
    expect((file.portals as unknown[]).length).toBe(3);
    expect((file.lights as unknown[]).length).toBe(1);
  });

  it("ida e volta: a cena reimportada tem a mesma grade, paredes, portas, luz e alinhamento", () => {
    const back = parseUvtt(file, "volta");
    expect(back.map.cols).toBe(24);
    expect(back.map.rows).toBe(18);
    expect(back.map.image).toBe("data:image/png;base64,QUJD");
    expect(back.map.offsetX).toBe(1.5);
    expect(back.map.offsetY).toBe(-0.25);
    expect(back.map.imageScale).toBe(1.1);
    expect(back.walls.filter((wall) => wall.type === "wall")).toHaveLength(2);
    const doors = back.walls.filter((wall) => wall.type === "door");
    expect(doors).toHaveLength(2);
    expect(doors.map((door) => Boolean(door.open)).sort()).toEqual([false, true]);
    expect(back.walls.filter((wall) => wall.type === "window")).toHaveLength(1);
    expect(back.lights).toHaveLength(1);
    expect(back.lights[0]).toMatchObject({ x: 4, y: 4, color: "#ffad55" });
    expect(back.lights[0].radius).toBeCloseTo(6, 5);
  });

  it("extrai o base64 de uma imagem embutida e recusa o que não é base64", () => {
    expect(base64FromDataUrl("data:image/png;base64,AAAA")).toBe("AAAA");
    expect(base64FromDataUrl("/tactics/mapa.jpg")).toBeNull();
  });
});
