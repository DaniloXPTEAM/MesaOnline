import { describe, expect, it } from "vitest";
import { ISO_STAGE_SIZE, isoFocus, isoPoint, nextRotation, rotateCell } from "../src/game/isoView";
import type { BattleMap } from "../src/game/types";

const map = (overrides: Partial<BattleMap> = {}): BattleMap => ({ id: "m", name: "Teste", location: "", image: "", cols: 10, rows: 8, terrain: {}, ...overrides });

describe("visão isométrica (V3 religado)", () => {
  it("gira em passos de 90° e volta ao início depois de 4", () => {
    let rotation = 0 as ReturnType<typeof nextRotation>;
    const seen: number[] = [];
    for (let i = 0; i < 4; i += 1) { rotation = nextRotation(rotation, 1); seen.push(rotation); }
    expect(seen).toEqual([90, 180, 270, 0]);
    expect(nextRotation(0, -1)).toBe(270);
  });

  it("girar 4 vezes uma célula devolve a própria célula, e a rotação é uma bijeção", () => {
    for (const rotation of [0, 90, 180, 270] as const) {
      const seen = new Set<string>();
      for (let x = 0; x < 10; x += 1) for (let y = 0; y < 8; y += 1) {
        const r = rotateCell(x, y, 10, 8, rotation);
        seen.add(`${r.x},${r.y}`);
      }
      expect(seen.size).toBe(80);
    }
  });

  it("a célula (0,0) fica acima da (9,7) na tela e a elevação sobe a célula", () => {
    const flat = map();
    const top = isoPoint(flat, 0, 0, 0);
    const bottom = isoPoint(flat, 9, 7, 0);
    expect(top.y).toBeLessThan(bottom.y);
    const raised = map({ terrain: { "3,3": { type: "normal", elevation: 2 } } });
    expect(isoPoint(raised, 3, 3, 0).y).toBeLessThan(isoPoint(flat, 3, 3, 0).y);
    expect(isoPoint(raised, 3, 3, 0).elevation).toBe(2);
  });

  it("focar uma célula a leva ao centro do espaço isométrico", () => {
    const flat = map();
    const target = isoFocus(flat, { x: 4, y: 4 }, 0, 1);
    const point = isoPoint(flat, 4, 4, 0);
    expect(point.x + target.x).toBeCloseTo(ISO_STAGE_SIZE.width / 2);
    expect(point.y + target.y).toBeCloseTo(ISO_STAGE_SIZE.height / 2);
  });
});
