import { describe, expect, it } from "vitest";
import {
  auraCells, circleCells, coneCells, lineCells, rectCells, shapeCells, SHAPE_LABEL,
} from "../src/game/shapes";
import { lightedCells } from "../src/game/vision";
import { makeBoard, makeToken } from "./helpers";

/** Antes a ferramenta "Áreas" só marcava célula por célula — um contador. */
describe("formas geometricas", () => {
  it("circulo respeita o raio em metros", () => {
    // 3 m = 2 casas a 1,5 m
    const cells = circleCells({ x: 5, y: 5 }, 3);
    expect(cells).toContain("5,5");
    expect(cells).toContain("7,5");
    expect(cells).not.toContain("8,5");
  });

  it("retangulo cobre os dois cantos, inclusivo", () => {
    const cells = rectCells({ x: 2, y: 2 }, { x: 4, y: 3 });
    expect(cells).toHaveLength(6);
    expect(cells).toEqual(expect.arrayContaining(["2,2", "4,3", "3,2"]));
  });

  it("linha vai de ponta a ponta", () => {
    const reta = lineCells({ x: 0, y: 0 }, { x: 4, y: 0 });
    expect(reta).toEqual(["0,0", "1,0", "2,0", "3,0", "4,0"]);
    const diagonal = lineCells({ x: 0, y: 0 }, { x: 3, y: 3 });
    expect(diagonal[0]).toBe("0,0");
    expect(diagonal.at(-1)).toBe("3,3");
  });

  it("cone abre 45 graus na direcao apontada", () => {
    const cells = coneCells({ x: 5, y: 5 }, { x: 9, y: 5 }, 6);
    expect(cells).toContain("7,5");        // na direcao
    expect(cells).not.toContain("1,5");    // atras
    expect(cells).not.toContain("5,9");    // perpendicular longe
  });

  it("shapeCells despacha por tipo e cai em celula unica sem destino", () => {
    expect(shapeCells({ kind: "cells", origin: { x: 1, y: 1 } })).toEqual(["1,1"]);
    expect(shapeCells({ kind: "rect", origin: { x: 0, y: 0 }, to: { x: 1, y: 1 } })).toHaveLength(4);
    expect(shapeCells({ kind: "circle", origin: { x: 5, y: 5 }, sizeM: 1.5 }).length).toBeGreaterThan(1);
  });

  it("oferece os 6 tipos no motor", () => {
    expect(Object.keys(SHAPE_LABEL)).toEqual(["cells", "circle", "rect", "line", "cone", "polygon"]);
    expect(shapeCells({ kind: "polygon", origin: { x: 1, y: 1 }, points: [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 2, y: 4 }] })).toContain("2,2");
  });
});

describe("auras", () => {
  it("aura inativa ou sem raio nao cobre nada", () => {
    expect(auraCells({ gx: 1, gy: 1 })).toEqual([]);
    expect(auraCells({ gx: 1, gy: 1, aura: { radiusM: 0 } })).toEqual([]);
    expect(auraCells({ gx: 1, gy: 1, aura: { radiusM: 6, active: false } })).toEqual([]);
  });

  it("aura ativa cobre um circulo em volta do token", () => {
    const cells = auraCells({ gx: 5, gy: 5, aura: { radiusM: 3 } });
    expect(cells).toContain("5,5");
    expect(cells).toContain("6,5");
  });

  it("aura que ilumina entra na cadeia de luz", () => {
    const semAura = makeToken({ id: "t", gx: 5, gy: 5 });
    const comAura = makeToken({ id: "t", gx: 5, gy: 5, aura: { radiusM: 4.5, light: true } });
    expect(lightedCells(makeBoard([semAura])).size).toBe(0);
    const iluminado = lightedCells(makeBoard([comAura]));
    expect(iluminado.has("5,5")).toBe(true);
    expect(iluminado.size).toBeGreaterThan(5);
  });

  it("aura sem light nao ilumina", () => {
    const token = makeToken({ id: "t", gx: 5, gy: 5, aura: { radiusM: 6 } });
    expect(lightedCells(makeBoard([token])).size).toBe(0);
  });
});
