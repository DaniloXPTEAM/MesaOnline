import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CELL_PX, MIN_ZOOM, boardPixelSize, clampZoom, fitScale, focusCamera, gridFromImage, imagePlacement, imageStyle, snapOffset,
} from "../src/game/mapView";

describe("palco: tamanho e enquadramento", () => {
  it("o tabuleiro tem células quadradas, com qualquer proporção de mapa", () => {
    const wide = boardPixelSize(30, 10);
    expect(wide).toEqual({ width: 30 * CELL_PX, height: 10 * CELL_PX });
    expect(wide.width / 30).toBe(wide.height / 10);
  });

  it("enquadra qualquer mapa na área visível, mesmo os muito grandes", () => {
    const zone = { width: 800, height: 560 };
    for (const [cols, rows] of [[8, 8], [20, 20], [60, 40], [200, 200]]) {
      const board = boardPixelSize(cols, rows);
      const scale = fitScale(zone, board);
      expect(board.width * scale).toBeLessThanOrEqual(zone.width);
      expect(board.height * scale).toBeLessThanOrEqual(zone.height);
      expect(scale).toBeGreaterThanOrEqual(MIN_ZOOM);
    }
  });

  it("mapa pequeno não passa do zoom máximo de enquadramento", () => {
    expect(fitScale({ width: 2000, height: 2000 }, boardPixelSize(4, 4))).toBeLessThanOrEqual(2.6);
  });

  it("o zoom do usuário tem limites", () => {
    expect(clampZoom(100)).toBe(3);
    expect(clampZoom(0)).toBe(MIN_ZOOM);
  });
});

describe("focar", () => {
  const map = { cols: 20, rows: 20 };
  const board = boardPixelSize(20, 20);

  it("token no centro do mapa não desloca a câmera", () => {
    const camera = focusCamera({ x: 9.5, y: 9.5 }, { cols: 20, rows: 20 }, board, 1);
    expect(Math.abs(camera.x)).toBeLessThan(1);
    expect(Math.abs(camera.y)).toBeLessThan(1);
  });

  it("token no canto leva a câmera para o canto, proporcional ao zoom", () => {
    const at1 = focusCamera({ x: 0, y: 0 }, map, board, 1);
    const at2 = focusCamera({ x: 0, y: 0 }, map, board, 2);
    expect(at1.x).toBeGreaterThan(0);
    expect(at1.y).toBeGreaterThan(0);
    expect(at2.x).toBeCloseTo(at1.x * 2, 5);
  });
});

describe("importação de mapa em imagem", () => {
  it("sugere a grade pelo tamanho da imagem, mantendo a proporção", () => {
    expect(gridFromImage(1400, 1050)).toEqual({ cols: 20, rows: 15 });
    expect(gridFromImage(2100, 2100)).toEqual({ cols: 30, rows: 30 });
  });

  it("limita imagens gigantes e ignora tamanho inválido", () => {
    expect(gridFromImage(60000, 60000)).toEqual({ cols: 200, rows: 200 });
    expect(gridFromImage(0, 0)).toEqual({ cols: 20, rows: 20 });
    expect(gridFromImage(100, 100)).toEqual({ cols: 4, rows: 4 });
  });
});

describe("posição da imagem", () => {
  it("sem alinhamento a imagem cobre a grade", () => {
    expect(imagePlacement({})).toEqual({ offsetX: 0, offsetY: 0, scale: 1 });
    expect(imageStyle({}).transform).toBe("translate(0px, 0px) scale(1)");
  });

  it("aplica deslocamento em células e escala", () => {
    expect(imageStyle({ offsetX: 1.5, offsetY: -0.5, imageScale: 1.2 }).transform).toBe(`translate(${1.5 * CELL_PX}px, ${-0.5 * CELL_PX}px) scale(1.2)`);
  });

  it("arredonda o deslocamento em passos de 1/20 de célula", () => {
    expect(snapOffset(0.31)).toBeCloseTo(0.3, 5);
    expect(snapOffset(-0.224)).toBeCloseTo(-0.2, 5);
  });
});

describe("alinhamento gravado no mapa da cena", () => {
  beforeEach(() => { localStorage.clear(); vi.resetModules(); });

  it("o Mestre grava posição e escala; ficam na cena", async () => {
    const bridge = await import("../src/game/vttBridge");
    const map = bridge.getBoard().map;
    bridge.updateMap({ ...map, offsetX: 1.25, offsetY: -0.4, imageScale: 1.1 });
    const saved = bridge.getBoard().map;
    expect(saved.offsetX).toBe(1.25);
    expect(saved.offsetY).toBe(-0.4);
    expect(saved.imageScale).toBe(1.1);
    expect(saved.id).toBe(map.id);
  });
});
