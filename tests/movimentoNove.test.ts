import { describe, expect, it } from "vitest";
import { setActiveGrid } from "../src/game/distance";
import { reachableCells } from "../src/tactics/engine/movement";
import { makeBoard, makeMap, makeToken } from "./helpers";

describe("deslocamento de 9 m com casas de 1,5 m", () => {
  it("alcança 6 casas em linha reta, não 9", () => {
    setActiveGrid({ scale: 1.5 });
    const token = makeToken({ gx: 10, gy: 10, movementM: 9 });
    const board = makeBoard([token], { map: makeMap({ cols: 30, rows: 30 }) });
    const reach = reachableCells(board, token);
    const retaX = [...reach.keys()].map((key) => key.split(",").map(Number)).filter(([x, y]) => y === 10).map(([x]) => Math.abs(x - 10));
    expect(Math.max(...retaX)).toBe(6);
    expect(reach.has("17,10")).toBe(false);
    const diagonal = [...reach.keys()].map((key) => key.split(",").map(Number)).filter(([x, y]) => x - 10 === y - 10).map(([x]) => Math.abs(x - 10));
    expect(Math.max(...diagonal)).toBeLessThan(6); // a diagonal custa mais (regra de diagonal do projeto)
  });
});
