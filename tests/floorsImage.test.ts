import { describe, expect, it } from "vitest";
import { activeFloor, floorLabel, floorOf, floorsOf, moveTokenToFloor, visibleOnFloor } from "../src/game/floors";
import { FULL_CROP, clampCrop, cropToObjectPosition, squareCrop } from "../src/game/imageEditor";
import type { BoardLight, BoardWall } from "../src/game/types";
import { makeBoard, makeToken } from "./helpers";

describe("andares", () => {
  const terreo = makeToken({ id: "a", gx: 1, gy: 1 });
  const cima = makeToken({ id: "b", gx: 2, gy: 2, floor: 1 });
  const porao = makeToken({ id: "c", gx: 3, gy: 3, floor: -1 });
  const parede: BoardWall = { id: "w", type: "wall", x1: 0, y1: 0, x2: 1, y2: 0, floor: 1 };
  const luz: BoardLight = { id: "l", x: 5, y: 5, type: "torch", name: "T", radius: 3, color: "#fff", intensity: 1, enabled: true, floor: 1 };
  const board = makeBoard([terreo, cima, porao], { walls: [parede], lights: [luz] });

  it("ausente significa terreo — cenas antigas continuam validas", () => {
    expect(floorOf(terreo)).toBe(0);
    expect(floorOf(undefined)).toBe(0);
    expect(activeFloor(makeBoard([]))).toBe(0);
  });

  it("rotula terreo, andares e subsolo", () => {
    expect(floorLabel(0)).toBe("Térreo");
    expect(floorLabel(2)).toBe("2º andar");
    expect(floorLabel(-1)).toBe("Subsolo 1");
  });

  it("lista os andares com conteudo, de baixo para cima", () => {
    const lista = floorsOf(board);
    expect(lista.map((f) => f.index)).toEqual([-1, 0, 1]);
    expect(lista.find((f) => f.index === 1)).toMatchObject({ tokens: 1, walls: 1, lights: 1 });
  });

  it("a cena mostra um andar por vez", () => {
    const noTerreo = visibleOnFloor(board, 0);
    expect(noTerreo.tokens.map((t) => t.id)).toEqual(["a"]);
    expect(noTerreo.walls).toHaveLength(0);

    const emCima = visibleOnFloor(board, 1);
    expect(emCima.tokens.map((t) => t.id)).toEqual(["b"]);
    expect(emCima.walls).toHaveLength(1);
    expect(emCima.lights).toHaveLength(1);
  });

  it("mover de andar preserva a posicao no plano", () => {
    const movido = moveTokenToFloor(terreo, 2);
    expect(movido).toMatchObject({ floor: 2, gx: 1, gy: 1 });
  });
});

describe("editor de imagem", () => {
  it("recorte fica dentro da imagem e com tamanho minimo", () => {
    expect(clampCrop({ x: -1, y: 2, width: 5, height: 0 })).toEqual({ x: 0, y: 1 - 0.05, width: 1, height: 0.05 });
    expect(clampCrop({})).toEqual(FULL_CROP);
  });

  it("recorte quadrado centra no lado maior", () => {
    expect(squareCrop(200, 100)).toEqual({ x: 0.25, y: 0, width: 0.5, height: 1 });
    expect(squareCrop(100, 200)).toEqual({ x: 0, y: 0.25, width: 1, height: 0.5 });
    expect(squareCrop(150, 150)).toEqual(FULL_CROP);
    expect(squareCrop(0, 0)).toEqual(FULL_CROP);
  });

  it("converte recorte em object-position", () => {
    expect(cropToObjectPosition(FULL_CROP)).toBe("50% 50%");
    expect(cropToObjectPosition({ x: 0.25, y: 0, width: 0.5, height: 1 })).toBe("50% 50%");
    expect(cropToObjectPosition({ x: 0, y: 0, width: 0.5, height: 1 })).toBe("0% 50%");
  });
});
