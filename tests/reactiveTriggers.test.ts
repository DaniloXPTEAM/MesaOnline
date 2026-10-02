import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAction, makeToken } from "./helpers";

describe("gatilhos reativos portados", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("Aparência Inofensiva exige Vontade, cancela o ataque e funciona uma vez por cena por atacante", async () => {
    const { addToken, getBoard } = await import("../src/game/vttBridge");
    const { resolveIncomingAttackReaction } = await import("../src/tactics/engine/reactiveTriggers");
    const attacker = makeToken({ id: "attacker", name: "Bandido", side: "threats", will: 0 });
    const target = makeToken({
      id: "innocent", name: "Inocente", tacticalActions: [makeAction({ id: "power-innocent", name: "Aparência Inofensiva", category: "power", effect: "text", attackSkill: undefined, damage: undefined })],
    });
    addToken(attacker); addToken(target);

    const first = resolveIncomingAttackReaction(attacker, target, makeAction(), { roll: () => 2 });
    expect(first.key).toBe("aparencia-inofensiva");
    expect(first.prevented).toBe(true);
    expect(getBoard().tokens.find((token) => token.id === target.id)?.effects?.some((effect) => effect.id.includes("reaction-use:aparencia-inofensiva"))).toBe(true);

    const second = resolveIncomingAttackReaction(attacker, getBoard().tokens.find((token) => token.id === target.id)!, makeAction(), { roll: () => 2 });
    expect(second.prevented).toBe(false);
  });

  it("Desprezar os Covardes concede RD 5 quando o alvo está caído", async () => {
    const { addToken, getBoard } = await import("../src/game/vttBridge");
    const { damageReductionFor, mitigateDamage } = await import("../src/tactics/engine/reactiveTriggers");
    const target = makeToken({
      id: "knight", conditions: ["Caído"],
      tacticalActions: [makeAction({ id: "power-cowards", name: "Desprezar os Covardes", category: "power", effect: "text", attackSkill: undefined, damage: undefined })],
    });
    const attacker = makeToken({ id: "coward", side: "threats", gx: 2, gy: 1 });
    addToken(target); addToken(attacker);

    const current = getBoard().tokens.find((token) => token.id === target.id)!;
    expect(damageReductionFor(current, "Corte", attacker)).toBe(5);
    expect(mitigateDamage(current, 12, "Corte", attacker)).toEqual({ amount: 7, reduced: 5 });
  });
});
