import { describe, expect, it } from "vitest";
import { setActiveGrid } from "../src/game/distance";
import { blockCenter, coveredCells, footprintOf, tokenCovers } from "../src/game/tokenSize";
import { footprintOccupied, moverOf, reachableCells } from "../src/tactics/engine/movement";
import { rangeM } from "../src/tactics/engine/targeting";
import { makeBoard, makeMap, makeToken } from "./helpers";

setActiveGrid({ scale: 1.5 });
const board = (tokens: ReturnType<typeof makeToken>[], extra = {}) => makeBoard(tokens, { map: makeMap({ cols: 30, rows: 30 }), ...extra });

describe("ocupação de casas por tamanho", () => {
  it("lados do bloco: 1, 2, 3 e 6 casas", () => {
    expect(["pequeno", "medio", "grande", "enorme", "colossal"].map((size) => footprintOf(size as never))).toEqual([1, 1, 2, 3, 6]);
    expect(coveredCells(makeToken({ gx: 4, gy: 5, size: "grande" })).map((c) => `${c.x},${c.y}`)).toEqual(["4,5", "4,6", "5,5", "5,6"]);
    expect(coveredCells(makeToken({ gx: 0, gy: 0, size: "colossal" })).length).toBe(36);
    expect(blockCenter(makeToken({ gx: 4, gy: 5, size: "grande" }))).toEqual({ x: 5, y: 6 });
  });
  it("outra unidade não pode estar em nenhuma casa do bloco", () => {
    const ogro = makeToken({ id: "ogro", gx: 10, gy: 10, size: "grande", side: "threats" });
    const heroi = makeToken({ id: "h", gx: 8, gy: 10, side: "heroes" });
    const b = board([ogro, heroi]);
    expect(tokenCovers(ogro, 11, 11)).toBe(true);
    expect(footprintOccupied(b, heroi, { x: 11, y: 11 })).toBe(true);
    expect(footprintOccupied(b, heroi, { x: 12, y: 12 })).toBe(false);
    // o herói não chega a casas do bloco do ogro
    const reach = reachableCells(b, heroi);
    expect(reach.has("10,10")).toBe(false);
    expect(reach.has("11,11")).toBe(false);
  });
  it("criatura Grande só passa onde cabe 2x2 e não termina sobre outro token", () => {
    const grande = makeToken({ id: "g", gx: 10, gy: 10, size: "grande", movementM: 9 });
    const aliado = makeToken({ id: "a", gx: 13, gy: 10, side: grande.side });
    const b = board([grande, aliado]);
    const reach = reachableCells(b, grande);
    expect(reach.has("11,10")).toBe(true); // bloco 11..12
    expect(reach.has("12,10")).toBe(false); // bloco 12..13 pegaria o aliado
    expect(reach.has("13,10")).toBe(false); // bloco 13..14 também
    expect(reach.has("14,10")).toBe(true); // aliado pode ser atravessado, mas não ocupado
  });
  it("não sai do mapa: o bloco inteiro precisa caber", () => {
    const grande = makeToken({ id: "g", gx: 27, gy: 5, size: "grande", movementM: 9 });
    const reach = reachableCells(board([grande]), grande);
    expect(reach.has("28,5")).toBe(true);
    expect(reach.has("29,5")).toBe(false); // 29+1 = 30 estoura as 30 colunas
  });
  it("alcance e adjacência contam da casa mais próxima do bloco", () => {
    const grande = makeToken({ id: "g", gx: 10, gy: 10, size: "grande" });
    const heroi = makeToken({ id: "h", gx: 12, gy: 11 });
    expect(rangeM(grande, heroi)).toBeCloseTo(1.5);
    expect(rangeM(makeToken({ gx: 10, gy: 10 }), heroi)).toBeGreaterThan(1.5);
  });
  it("o par montado anda pelo bloco da montaria", () => {
    const cavalo = makeToken({ id: "m", gx: 10, gy: 10, size: "grande", riderId: "c" });
    const cav = makeToken({ id: "c", gx: 10, gy: 10, mountId: "m" });
    const b = board([cavalo, cav]);
    expect(moverOf(b, cav).id).toBe("m");
    expect(coveredCells(cav).length).toBe(0); // dentro da montaria, sem espaço próprio
  });
});
