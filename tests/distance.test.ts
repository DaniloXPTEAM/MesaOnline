import { describe, expect, it } from "vitest";
import {
  DEFAULT_GRID, cellsBetween, distanceBetween, formatDistance,
  gridSettings, metersToCells, stepCost, withinRange,
} from "../src/game/distance";
import { reachableCells } from "../src/tactics/engine/movement";
import { rangeM } from "../src/tactics/engine/targeting";
import { makeBoard, makeToken } from "./helpers";

describe("fonte unica de distancia", () => {
  it("usa dupla diagonal do T20 por padrao", () => {
    expect(DEFAULT_GRID.distanceMode).toBe("double_diagonal");
    expect(DEFAULT_GRID.scale).toBe(1.5);
  });

  it("a diagonal custa o dobro da reta", () => {
    // 4 casas em linha reta = 4 celulas = 6 m
    expect(cellsBetween({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(4);
    expect(distanceBetween({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(6);
    // 4 casas na diagonal = 8 celulas = 12 m (e nao 6 m como no Chebyshev)
    expect(cellsBetween({ x: 0, y: 0 }, { x: 4, y: 4 })).toBe(8);
    expect(distanceBetween({ x: 0, y: 0 }, { x: 4, y: 4 })).toBe(12);
  });

  it("as outras metricas continuam disponiveis", () => {
    const chebyshev = gridSettings({ distanceMode: "square" });
    const euclidiana = gridSettings({ distanceMode: "euclidean" });
    expect(cellsBetween({ x: 0, y: 0 }, { x: 4, y: 4 }, chebyshev)).toBe(4);
    expect(cellsBetween({ x: 0, y: 0 }, { x: 3, y: 4 }, euclidiana)).toBe(5);
  });

  it("stepCost de um passo bate com a regra do Dijkstra", () => {
    expect(stepCost(1, 0)).toBe(1);
    expect(stepCost(0, 1)).toBe(1);
    expect(stepCost(1, 1)).toBe(2);
  });

  it("converte metros e celulas nos dois sentidos", () => {
    expect(metersToCells(9)).toBe(6);
    expect(withinRange({ x: 0, y: 0 }, { x: 4, y: 4 }, 12)).toBe(true);
    expect(withinRange({ x: 0, y: 0 }, { x: 4, y: 4 }, 11)).toBe(false);
  });

  it("formata na unidade da cena", () => {
    expect(formatDistance(7.5)).toBe("7,5 m");
  });
});

describe("regua, alcance e movimento concordam", () => {
  it("rangeM usa a mesma regra da regua", () => {
    const a = makeToken({ id: "a", gx: 0, gy: 0 });
    const b = makeToken({ id: "b", gx: 4, gy: 4 });
    // Antes desta unificacao rangeM devolvia 6 (Chebyshev) e o movimento cobrava 12.
    expect(rangeM(a, b)).toBe(12);
    expect(rangeM(a, b)).toBe(distanceBetween({ x: a.gx, y: a.gy }, { x: b.gx, y: b.gy }));
  });

  it("o alcance de movimento gasta o mesmo que a regua mede", () => {
    const token = makeToken({ id: "andarilho", gx: 5, gy: 5, movementM: 12 });
    const board = makeBoard([token]);
    const alcance = reachableCells(board, token);

    // 12 m = 8 celulas de orcamento. Uma diagonal de 4 casas custa exatamente 8.
    const diagonal4 = alcance.get("9,9");
    expect(diagonal4).toBe(8);
    expect(distanceBetween({ x: 5, y: 5 }, { x: 9, y: 9 })).toBe(12);

    // Uma diagonal de 5 casas custaria 10 celulas (15 m): fora do orcamento.
    expect(alcance.has("10,10")).toBe(false);
    expect(distanceBetween({ x: 5, y: 5 }, { x: 10, y: 10 })).toBe(15);
  });

  it("para toda celula alcancavel, o custo em metros nunca e menor que a regua", () => {
    const token = makeToken({ id: "andarilho", gx: 6, gy: 6, movementM: 15 });
    const board = makeBoard([token]);
    for (const [key, custo] of reachableCells(board, token)) {
      const [x, y] = key.split(",").map(Number);
      const medido = distanceBetween({ x: token.gx, y: token.gy }, { x, y });
      // O caminho pode desviar, entao custa >= a linha reta; nunca menos.
      expect(custo * DEFAULT_GRID.scale).toBeGreaterThanOrEqual(medido - 0.001);
    }
  });
});
