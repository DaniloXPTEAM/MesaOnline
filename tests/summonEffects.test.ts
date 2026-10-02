import { beforeAll, describe, expect, it } from "vitest";
import type { BoardToken } from "../src/game/types";

let addToken: typeof import("../src/game/vttBridge")["addToken"];
let getBoard: typeof import("../src/game/vttBridge")["getBoard"];
let resolveSummonEffect: typeof import("../src/tactics/engine/summonEffects")["resolveSummonEffect"];

beforeAll(async () => {
  localStorage.clear();
  ({ addToken, getBoard } = await import("../src/game/vttBridge"));
  ({ resolveSummonEffect } = await import("../src/tactics/engine/summonEffects"));
});

describe("invocações no BOARD real", () => {
  it("Criar Mortos-Vivos cria seis tokens reais e desconta PM", () => {
    const caster: BoardToken = {
      id: "caster", name: "Necromante", title: "Arcanista 7", side: "heroes", gx: 6, gy: 6,
      symbol: "NE", accent: "#765", hp: 30, hpMax: 30, pm: 20, pmMax: 20,
      defense: 18, initiative: 5, initiativeRoll: 10, luta: 4, pontaria: 8,
      damage: "1d4", crit: 20, critMultiplier: 2, attackType: "ranged", rangeM: 9,
      movementM: 9, level: 7, spellDC: 20, actionIds: [], tacticalActions: [],
      fortitude: 6, reflexes: 8, will: 12, conditions: [],
    };
    addToken(caster);
    const created = resolveSummonEffect({ spellName: "Criar Mortos-Vivos", caster });
    expect(created).toHaveLength(6);
    expect(getBoard().tokens.filter((token) => token.summonedBy === caster.id)).toHaveLength(6);
    expect(new Set(created.map((token) => token.summonGroup)).size).toBe(1);
    expect(created.every((token) => token.hp === 1 && token.defense === 18)).toBe(true);
    expect(getBoard().tokens.find((token) => token.id === caster.id)?.pm).toBe(17);
  });
});
