import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectWalls, type RasterImage } from "../src/game/autoWalls";

/** Imagem sintética: `cols × rows` células de `px` pixels; `colorOf(x, y)` dá o RGB de cada célula. */
function raster(cols: number, rows: number, colorOf: (x: number, y: number) => [number, number, number], px = 4): RasterImage {
  const width = cols * px, height = rows * px;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = colorOf(Math.floor(x / px), Math.floor(y / px));
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

const sorted = (list: Array<{ x1: number; y1: number; x2: number; y2: number }>) => list.map((s) => `${s.x1},${s.y1}-${s.x2},${s.y2}`).sort();

describe("paredes automáticas", () => {
  it("áreas escuras: o contorno de um bloco preto vira 4 paredes inteiras", () => {
    const image = raster(5, 4, (x, y) => (x >= 1 && x <= 2 && y === 1 ? [10, 10, 10] : [200, 190, 170]));
    expect(sorted(detectWalls(image, 5, 4, { mode: "dark", sensitivity: 0.5 }))).toEqual(["1,1-1,2", "1,1-3,1", "1,2-3,2", "3,1-3,2"]);
  });

  it("mapa uniforme não gera parede em nenhum modo", () => {
    const image = raster(6, 6, () => [180, 170, 150]);
    expect(detectWalls(image, 6, 6, { mode: "dark", sensitivity: 1 })).toEqual([]);
    expect(detectWalls(image, 6, 6, { mode: "edges", sensitivity: 1 })).toEqual([]);
  });

  it("contornos: uma linha escura de 4 casas vira parede; ponto isolado de 1 casa é ruído e some", () => {
    const line = raster(6, 6, (x, y) => (y === 3 && x >= 1 && x <= 4 ? [20, 20, 20] : [220, 210, 190]));
    const walls = detectWalls(line, 6, 6, { mode: "edges", sensitivity: 0.5 });
    expect(walls.length).toBeGreaterThan(0);
    expect(walls.every((wall) => Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) >= 2)).toBe(true);
    const dot = raster(6, 6, (x, y) => (x === 2 && y === 2 ? [20, 20, 20] : [220, 210, 190]));
    expect(detectWalls(dot, 6, 6, { mode: "edges", sensitivity: 0.5 })).toEqual([]);
  });

  it("recusa quando acha segmentos demais, dizendo o que fazer", () => {
    const image = raster(5, 4, (x, y) => (x >= 1 && x <= 2 && y === 1 ? [10, 10, 10] : [200, 190, 170]));
    expect(() => detectWalls(image, 5, 4, { mode: "dark", sensitivity: 0.5, maxSegments: 3 })).toThrow(/Diminua a sensibilidade/);
  });
});

describe("setAutoWalls (estado da mesa)", () => {
  beforeEach(() => { localStorage.clear(); vi.resetModules(); });

  it("troca só as paredes automáticas do andar, mantém as feitas à mão e desfaz numa ação", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.upsertWall({ id: "mao-1", type: "wall", x1: 0, y1: 0, x2: 2, y2: 0 });
    bridge.setAutoWalls([{ x1: 1, y1: 1, x2: 3, y2: 1 }, { x1: 3, y1: 1, x2: 3, y2: 4 }], 0);
    let walls = bridge.getRuntimeSnapshot().board.walls;
    expect(walls.filter((wall) => wall.auto)).toHaveLength(2);
    bridge.setAutoWalls([{ x1: 0, y1: 5, x2: 4, y2: 5 }], 0);
    walls = bridge.getRuntimeSnapshot().board.walls;
    expect(walls.filter((wall) => wall.auto)).toHaveLength(1);
    expect(walls.some((wall) => wall.id === "mao-1")).toBe(true);
    bridge.setAutoWalls([], 0);
    expect(bridge.getRuntimeSnapshot().board.walls.filter((wall) => wall.auto)).toHaveLength(0);
    bridge.undoBoard();
    expect(bridge.getRuntimeSnapshot().board.walls.filter((wall) => wall.auto)).toHaveLength(1);
  });
});
