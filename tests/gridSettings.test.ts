import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_GRID, activeGrid, cellsBetween, distanceBetween, formatDistance,
  metersToCells, setActiveGrid,
} from "../src/game/distance";
import { rangeM } from "../src/tactics/engine/targeting";
import { reachableCells } from "../src/tactics/engine/movement";
import { makeBoard, makeToken } from "./helpers";

/**
 * A grade ATIVA é a fonte única: trocar escala/métrica vale para régua,
 * movimento, alcance e áreas ao mesmo tempo — sem 1.5 fixo espalhado.
 */
afterEach(() => setActiveGrid(DEFAULT_GRID));

describe("grade ativa", () => {
  it("comeca no padrao T20", () => {
    expect(activeGrid()).toEqual(DEFAULT_GRID);
    expect(activeGrid().scale).toBe(1.5);
    expect(activeGrid().distanceMode).toBe("double_diagonal");
  });

  it("trocar a escala muda distancia e formatacao", () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(6);
    setActiveGrid({ scale: 5, unit: "ft" });
    expect(distanceBetween({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(20);
    expect(formatDistance(20)).toBe("20 ft");
    expect(metersToCells(20)).toBe(4);
  });

  it("trocar a metrica muda a diagonal para todos", () => {
    const a = { x: 0, y: 0 }, b = { x: 4, y: 4 };
    expect(cellsBetween(a, b)).toBe(8);          // dupla diagonal
    setActiveGrid({ distanceMode: "square" });
    expect(cellsBetween(a, b)).toBe(4);          // Chebyshev
    setActiveGrid({ distanceMode: "euclidean" });
    expect(cellsBetween(a, b)).toBeCloseTo(5.66, 1);
  });

  it("grade hexagonal usa distancia de cubo", () => {
    setActiveGrid({ type: "hex" });
    expect(cellsBetween({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
    expect(cellsBetween({ x: 0, y: 0 }, { x: 0, y: 2 })).toBeLessThanOrEqual(2);
  });

  it("alcance e movimento seguem a grade ativa, juntos", () => {
    const a = makeToken({ id: "a", gx: 0, gy: 0 });
    const b = makeToken({ id: "b", gx: 4, gy: 4 });
    expect(rangeM(a, b)).toBe(12);

    setActiveGrid({ distanceMode: "square" });
    expect(rangeM(a, b)).toBe(6); // regua e alcance mudam juntos

    // e o movimento tambem: com Chebyshev a diagonal passa a custar 1
    const andarilho = makeToken({ id: "t", gx: 5, gy: 5, movementM: 9 });
    expect(reachableCells(makeBoard([andarilho]), andarilho).get("6,6")).toBe(1);
    setActiveGrid(DEFAULT_GRID);
    expect(reachableCells(makeBoard([andarilho]), andarilho).get("6,6")).toBe(2);
  });

  it("setActiveGrid preenche o que faltar com o padrao", () => {
    setActiveGrid({ scale: 3 });
    expect(activeGrid()).toEqual({ ...DEFAULT_GRID, scale: 3 });
    setActiveGrid(null);
    expect(activeGrid()).toEqual(DEFAULT_GRID);
  });
});
