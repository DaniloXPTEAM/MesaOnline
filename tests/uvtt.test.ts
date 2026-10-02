import { describe, expect, it } from "vitest";
import { isUvtt, parseUvtt } from "../src/game/uvtt";

/** Formato real do Dungeondraft (.dd2vtt), forma padrão. */
const PADRAO = {
  format: 0.3,
  resolution: { map_origin: { x: 0, y: 0 }, map_size: { x: 24, y: 18 }, pixels_per_grid: 256 },
  line_of_sight: [
    [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 4 }],
    [{ x: 8, y: 2 }, { x: 8, y: 6 }],
  ],
  objects_line_of_sight: [[{ x: 10, y: 10 }, { x: 12, y: 10 }]],
  portals: [
    { position: { x: 5, y: 2 }, bounds: [{ x: 5, y: 2 }, { x: 5, y: 3 }], closed: true },
    { position: { x: 9, y: 4 }, bounds: [{ x: 9, y: 4 }, { x: 10, y: 4 }], closed: false },
  ],
  lights: [
    { position: { x: 6, y: 6 }, range: 4, intensity: 0.8, color: "ffffcc88", shadows: true },
  ],
  image: "iVBORw0KGgoAAAANS",
};

describe("deteccao", () => {
  it("reconhece UVTT e recusa JSON qualquer", () => {
    expect(isUvtt(PADRAO)).toBe(true);
    expect(isUvtt({ walls: [] })).toBe(true);
    expect(isUvtt({ name: "ficha", level: 3 })).toBe(false);
    expect(isUvtt(null)).toBe(false);
  });
});

describe("importacao no formato padrao", () => {
  const r = parseUvtt(PADRAO, "Cripta");

  it("le o tamanho do mapa e o nome", () => {
    expect(r.map.cols).toBe(24);
    expect(r.map.rows).toBe(18);
    expect(r.map.name).toBe("Cripta");
    expect(r.map.image.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("converte polilinhas em segmentos de parede", () => {
    // 2 segmentos da 1a linha + 1 da 2a + 1 de objects = 4 paredes
    expect(r.walls.filter((w) => w.type === "wall")).toHaveLength(4);
    const primeira = r.walls[0];
    expect(primeira).toMatchObject({ x1: 1, y1: 1, x2: 5, y2: 1 });
  });

  it("portais viram portas com estado real", () => {
    const portas = r.walls.filter((w) => w.type === "door");
    expect(portas).toHaveLength(2);
    expect(portas[0].open).toBe(false); // closed: true
    expect(portas[1].open).toBe(true);  // closed: false
  });

  it("luzes chegam com posicao, raio em metros e cor legivel", () => {
    expect(r.lights).toHaveLength(1);
    expect(r.lights[0]).toMatchObject({ x: 6, y: 6, enabled: true });
    expect(r.lights[0].radius).toBeCloseTo(6); // 4 casas x 1,5 m
    expect(r.lights[0].color).toBe("#ffcc88"); // AARRGGBB -> #RRGGBB
  });
});

describe("robustez", () => {
  it("aplica o deslocamento de map_origin", () => {
    const r = parseUvtt({
      resolution: { map_origin: { x: 2, y: 3 }, map_size: { x: 10, y: 10 } },
      line_of_sight: [[{ x: 4, y: 5 }, { x: 6, y: 5 }]],
    });
    expect(r.walls[0]).toMatchObject({ x1: 2, y1: 2, x2: 4, y2: 2 });
  });

  it("aceita a forma legada walls x,y,x2,y2", () => {
    const r = parseUvtt({ walls: [{ x: 1, y: 1, x2: 3, y2: 1, type: "window" }] });
    expect(r.walls).toHaveLength(1);
    expect(r.walls[0].type).toBe("window");
  });

  it("arquivo sem imagem avisa em vez de quebrar", () => {
    const r = parseUvtt({ resolution: { map_size: { x: 5, y: 5 } } });
    expect(r.map.image).toBe("");
    expect(r.aviso).toMatch(/imagem/i);
    expect(r.walls).toEqual([]);
  });

  it("dados corrompidos nao derrubam o parser", () => {
    const r = parseUvtt({ line_of_sight: [null, [{ x: 1 }], "lixo"], portals: [{}], lights: [{}] });
    expect(r.walls).toEqual([]);
    expect(r.lights).toEqual([]);
  });
});
