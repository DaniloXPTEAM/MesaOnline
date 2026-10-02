import { describe, expect, it } from "vitest";
import { DEFAULT_FRAME, FRAME_BOX, FRAME_OUT, bakeRect, clampFrame, framedSize } from "../src/game/tokenFrame";

const norm = (f: { zoom: number; x: number; y: number }) => ({ zoom: f.zoom, x: f.x + 0, y: f.y + 0 });

describe("enquadramento do token", () => {
  it("a imagem sempre cobre o círculo: o lado menor ocupa a caixa inteira", () => {
    expect(framedSize(300, 200, 240, 1)).toEqual({ width: 360, height: 240 });
    expect(framedSize(200, 300, 240, 1)).toEqual({ width: 240, height: 360 });
    expect(framedSize(300, 200, 240, 2)).toEqual({ width: 720, height: 480 });
  });

  it("não deixa arrastar até aparecer um vazio dentro do círculo", () => {
    // 300x200 em caixa 240: sobra 120 px na largura (±60) e nada na altura
    expect(norm(clampFrame(300, 200, 240, { zoom: 1, x: 500, y: 500 }))).toEqual({ zoom: 1, x: 60, y: 0 });
    expect(norm(clampFrame(300, 200, 240, { zoom: 1, x: -500, y: -500 }))).toEqual({ zoom: 1, x: -60, y: 0 });
    // com zoom 2 sobra mais nas duas direções
    expect(clampFrame(300, 200, 240, { zoom: 2, x: 999, y: 999 })).toEqual({ zoom: 2, x: 240, y: 120 });
    // o zoom também tem limites
    expect(clampFrame(300, 200, 240, { zoom: 99, x: 0, y: 0 }).zoom).toBe(4);
    expect(clampFrame(300, 200, 240, { zoom: 0.1, x: 0, y: 0 }).zoom).toBe(1);
  });

  it("o desenho final reproduz a prévia na escala da saída, centrado quando não há deslocamento", () => {
    const rect = bakeRect(300, 200, DEFAULT_FRAME);
    const k = FRAME_OUT / FRAME_BOX;
    expect(rect.width).toBeCloseTo(360 * k);
    expect(rect.height).toBeCloseTo(240 * k);
    expect(rect.x + rect.width / 2).toBeCloseTo(FRAME_OUT / 2);
    expect(rect.y + rect.height / 2).toBeCloseTo(FRAME_OUT / 2);
    const moved = bakeRect(300, 200, { zoom: 1, x: 30, y: 0 });
    expect(moved.x + moved.width / 2).toBeCloseTo(FRAME_OUT / 2 + 30 * k);
  });
});
