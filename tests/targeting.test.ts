import { describe, expect, it } from "vitest";
import { coverBetween, hasLineOfEffect, isFlanking, rangeM, targetDefense, withinRange } from "../src/tactics/engine/targeting";
import { makeBoard, makeToken } from "./helpers";

describe("targeting tático", () => {
  it("calcula alcance e bloqueia linha de efeito por parede", () => {
    const source = makeToken({ id: "source", gx: 1, gy: 1 });
    const target = makeToken({ id: "target", side: "threats", gx: 4, gy: 1 });
    const board = makeBoard([source, target], { walls: [{ id: "wall", type: "wall", x1: 3, y1: 0, x2: 3, y2: 3 }] });

    expect(rangeM(source, target)).toBe(4.5);
    expect(withinRange(source, target, 4.5)).toBe(true);
    expect(hasLineOfEffect(board, source, target)).toBe(false);
    expect(coverBetween(board, source, target)).toBe("total");
    expect(targetDefense(board, source, target)).toBe(target.defense + 99);
  });

  it("detecta cobertura parcial e flanqueamento", () => {
    const attacker = makeToken({ id: "attacker", gx: 1, gy: 2 });
    const target = makeToken({ id: "target", side: "threats", gx: 2, gy: 2 });
    const ally = makeToken({ id: "ally", gx: 3, gy: 2 });
    const board = makeBoard([attacker, target, ally], { map: { ...makeBoard().map, terrain: { "2,2": { type: "cover", elevation: 0 } } } });

    expect(isFlanking(board, attacker, target)).toBe(true);
    const distantTarget = { ...target, gx: 4 };
    const covered = makeBoard([attacker, distantTarget], { map: { ...board.map, terrain: { "2,2": { type: "cover", elevation: 0 } } } });
    expect(coverBetween(covered, attacker, distantTarget)).toBe("partial");
  });
});
