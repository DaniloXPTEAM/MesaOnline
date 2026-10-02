import { describe, expect, it } from "vitest";
import { pathTo, reachableCells, reachableWithPaths } from "../src/tactics/engine/movement";
import type { BoardWall } from "../src/game/types";
import { makeBoard, makeToken } from "./helpers";

/**
 * Prévia de caminho (`_wayCells` do VTT antigo): destino → rota válida,
 * respeitando obstáculos, terreno e elevação — a MESMA regra do custo.
 */
describe("pathfinding", () => {
  it("caminho reto inclui as duas pontas", () => {
    const token = makeToken({ id: "t", gx: 2, gy: 2, movementM: 12 });
    const caminho = pathTo(makeBoard([token]), token, { x: 5, y: 2 });
    expect(caminho[0]).toBe("2,2");
    expect(caminho[caminho.length - 1]).toBe("5,2");
    expect(caminho).toHaveLength(4);
  });

  it("destino fora do alcance devolve caminho vazio", () => {
    const token = makeToken({ id: "t", gx: 0, gy: 0, movementM: 3 }); // 2 casas
    expect(pathTo(makeBoard([token]), token, { x: 11, y: 11 })).toEqual([]);
  });

  it("o custo do caminho bate com reachableCells", () => {
    const token = makeToken({ id: "t", gx: 3, gy: 3, movementM: 15 });
    const board = makeBoard([token]);
    const destino = { x: 6, y: 6 };
    const custo = reachableCells(board, token).get("6,6");
    const nos = reachableWithPaths(board, token);
    expect(nos.get("6,6")?.cost).toBe(custo);
  });

  it("contorna parede em vez de atravessar", () => {
    const parede: BoardWall = { id: "w", type: "wall", x1: 4, y1: 0, x2: 4, y2: 5 };
    const token = makeToken({ id: "t", gx: 3, gy: 2, movementM: 30 });
    const board = makeBoard([token], { walls: [parede] });
    const caminho = pathTo(board, token, { x: 5, y: 2 });
    expect(caminho.length).toBeGreaterThan(2); // nao foi em linha reta
    expect(caminho[caminho.length - 1]).toBe("5,2");
  });

  it("prefere desviar de terreno dificil quando compensa", () => {
    const token = makeToken({ id: "t", gx: 0, gy: 1, movementM: 30 });
    const board = makeBoard([token], {
      map: { ...makeBoard([]).map, terrain: {
        "1,1": { type: "difficult", elevation: 0 },
        "2,1": { type: "difficult", elevation: 0 },
      } },
    });
    const caminho = pathTo(board, token, { x: 3, y: 1 });
    // o caminho existe e nao passa pelas duas celulas caras ao mesmo tempo
    expect(caminho[caminho.length - 1]).toBe("3,1");
    const caras = caminho.filter((c) => c === "1,1" || c === "2,1").length;
    expect(caras).toBeLessThan(2);
  });

  it("voar ignora o terreno e vai reto", () => {
    const token = makeToken({ id: "t", gx: 0, gy: 1, movementM: 9, flyM: 30 });
    const board = makeBoard([token], {
      map: { ...makeBoard([]).map, terrain: { "1,1": { type: "difficult", elevation: 4 } } },
    });
    const caminho = pathTo(board, token, { x: 3, y: 1 }, { mode: "fly" });
    expect(caminho).toEqual(["0,1", "1,1", "2,1", "3,1"]);
  });

  it("origem e sempre alcancavel com custo zero", () => {
    const token = makeToken({ id: "t", gx: 7, gy: 7, movementM: 9 });
    const nos = reachableWithPaths(makeBoard([token]), token);
    expect(nos.get("7,7")).toEqual({ cost: 0, from: null });
  });
});
