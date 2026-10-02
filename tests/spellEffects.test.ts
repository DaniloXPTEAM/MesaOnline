import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeAction, makeToken } from "./helpers";

describe("efeitos de magia", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => vi.restoreAllMocks());

  it("resolve efeito específico antes do parser genérico", async () => {
    const { addToken, getBoard } = await import("../src/game/vttBridge");
    const { resolveSpellEffect } = await import("../src/tactics/engine/spellEffects");
    const caster = makeToken({ id: "caster-specific", name: "Clériga", pm: 10, pmMax: 10 });
    const target = makeToken({ id: "target-specific", name: "Aliada", gx: 2, gy: 1 });
    addToken(caster); addToken(target);

    const resolution = resolveSpellEffect({
      spell: { name: "Bênção", description: "Aliados recebem bônus." },
      caster,
      targets: [target],
      action: makeAction({ id: "spell-bencao", name: "Bênção", category: "spell", attackSkill: undefined, effect: "buff", target: "ally", damage: undefined, pmCost: 1, rangeM: 9, color: "gold" }),
    });

    const persisted = getBoard().tokens.find((token) => token.id === target.id)!;
    expect(resolution.route).toBe("specific");
    expect(persisted.effects?.[0]?.mods).toMatchObject({ attack: 1, damage: 1 });
    expect(getBoard().tokens.find((token) => token.id === caster.id)?.pm).toBe(9);
  });

  it("resolve magia desconhecida pelo parser genérico com save e metade", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { addToken, getBoard } = await import("../src/game/vttBridge");
    const { resolveSpellEffect } = await import("../src/tactics/engine/spellEffects");
    const caster = makeToken({ id: "caster-generic", name: "Maga", pm: 10, pmMax: 10, spellDC: 16 });
    const target = makeToken({ id: "target-generic", name: "Alvo", side: "threats", gx: 3, gy: 1, hp: 30, hpMax: 30, reflexes: 5 });
    addToken(caster); addToken(target);

    const resolution = resolveSpellEffect({
      spell: { name: "Rajada Experimental", description: "Causa 2d6; Reflexos reduz à metade." },
      caster,
      targets: [target],
      action: makeAction({ id: "spell-generic", name: "Rajada Experimental", category: "spell", attackSkill: undefined, damage: "2d6", save: "reflexes", halfOnSave: true, pmCost: 2, rangeM: 9, color: "arcane" }),
    });

    expect(resolution.route).toBe("generic");
    expect(resolution.results[0].save?.passed).toBe(true);
    expect(resolution.results[0].damage).toBe(4);
    expect(getBoard().tokens.find((token) => token.id === target.id)?.hp).toBe(26);
    expect(getBoard().tokens.find((token) => token.id === caster.id)?.pm).toBe(8);
  });
});
