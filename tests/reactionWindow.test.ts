import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAction, makeToken } from "./helpers";

/** Prompt de reação: o ataque pausa, o dono do alvo escolhe e o ataque continua. */
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function setup(options: { heroReaction?: boolean } = {}) {
  const bridge = await import("../src/game/vttBridge");
  const runtime = await import("../src/tactics/engine/runtimeCommands");
  const ai = await import("../src/tactics/engine/ai");
  const attack = makeAction({ id: "garra", name: "Garra", rangeM: 1.5, autoHit: true, damage: "1d4" });
  const shield = makeAction({ id: "escudo", name: "Escudo da Fé", category: "spell", kind: "reaction", effect: "buff", target: "self", pmCost: 1, damage: undefined, attackSkill: undefined });
  const foe = makeToken({ id: "goblin", name: "Goblin", side: "threats", gx: 5, gy: 5, initiative: 40, tacticalActions: [attack] });
  const hero = makeToken({ id: "heroi", name: "Herói", side: "heroes", gx: 6, gy: 5, initiative: -20, hp: 60, hpMax: 60, pm: 5, pmMax: 5, tacticalActions: options.heroReaction === false ? [] : [shield] });
  bridge.addToken(foe);
  bridge.addToken(hero);
  bridge.startCombat();
  return { bridge, runtime, ai };
}

describe("janela de reação", () => {
  it("pausa o ataque contra herói com reação e bloqueia ações e fim de turno até a resposta", async () => {
    const { bridge, runtime } = await setup();
    const before = bridge.getBoard().tokens.find((token) => token.id === "heroi")!.hp;
    runtime.executeTacticalAction("goblin", "garra", ["heroi"]);
    const pending = bridge.getCombatState().pendingReaction!;
    expect(pending.reactorId).toBe("heroi");
    expect(pending.options.map((option) => option.actionId)).toEqual(["escudo"]);
    expect(bridge.getBoard().tokens.find((token) => token.id === "heroi")!.hp).toBe(before); // ainda não bateu
    expect(() => bridge.endTurn()).toThrow(/reação/i);
    expect(() => runtime.executeTacticalAction("goblin", "garra", ["heroi"])).toThrow(/reação/i);
  });

  it("usar a reação gasta a reação e o PM, e depois o ataque acontece", async () => {
    const { bridge, runtime } = await setup();
    runtime.executeTacticalAction("goblin", "garra", ["heroi"]);
    const pending = bridge.getCombatState().pendingReaction!;
    runtime.executeAnswerReaction(pending.id, "escudo");
    const hero = bridge.getBoard().tokens.find((token) => token.id === "heroi")!;
    expect(bridge.getCombatState().pendingReaction).toBeUndefined();
    expect(bridge.getCombatState().resources.heroi.reaction).toBe(0);
    expect(hero.pm).toBe(4);
    expect(hero.hp).toBeLessThan(60); // acerto automático de 1d4
  });

  it("recusar a reação retoma o ataque sem gastar nada", async () => {
    const { bridge, runtime } = await setup();
    runtime.executeTacticalAction("goblin", "garra", ["heroi"]);
    runtime.executeAnswerReaction(bridge.getCombatState().pendingReaction!.id, null);
    const hero = bridge.getBoard().tokens.find((token) => token.id === "heroi")!;
    expect(hero.pm).toBe(5);
    expect(hero.hp).toBeLessThan(60);
    expect(bridge.getCombatState().pendingReaction).toBeUndefined();
  });

  it("sem reação disponível, o ataque resolve direto", async () => {
    const { bridge, runtime } = await setup({ heroReaction: false });
    runtime.executeTacticalAction("goblin", "garra", ["heroi"]);
    expect(bridge.getCombatState().pendingReaction).toBeUndefined();
    expect(bridge.getBoard().tokens.find((token) => token.id === "heroi")!.hp).toBeLessThan(60);
  });

  it("turno da IA espera a resposta e só encerra o turno depois", async () => {
    const { bridge, runtime, ai } = await setup();
    const report = ai.runAiTurn("goblin");
    expect(report.steps.join(" ")).toMatch(/reação/i);
    expect(bridge.getCombatState().activeTokenId).toBe("goblin");
    runtime.executeAnswerReaction(bridge.getCombatState().pendingReaction!.id, null);
    expect(bridge.getCombatState().activeTokenId).toBe("heroi");
    expect(bridge.getBoard().tokens.find((token) => token.id === "heroi")!.hp).toBeLessThan(60);
  });
});
