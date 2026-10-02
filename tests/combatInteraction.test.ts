import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAction, makeToken } from "./helpers";

/**
 * Interação do V3 ligada ao runtime da Mesa: turno da IA, reação fora do turno,
 * condições que bloqueiam ação e efeitos de condição no início do turno.
 */
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function setup(tokens: ReturnType<typeof makeToken>[]) {
  const bridge = await import("../src/game/vttBridge");
  const runtime = await import("../src/tactics/engine/runtimeCommands");
  const ai = await import("../src/tactics/engine/ai");
  for (const token of tokens) bridge.addToken(token);
  bridge.startCombat();
  return { bridge, runtime, ai };
}

describe("turno da IA", () => {
  it("move a ameaça até o herói, ataca e passa o turno", async () => {
    const attack = makeAction({ id: "garra", name: "Garra", rangeM: 1.5 });
    const foe = makeToken({ id: "goblin", name: "Goblin", side: "threats", gx: 2, gy: 5, initiative: 40, movementM: 9, tacticalActions: [attack] });
    const hero = makeToken({ id: "heroi", name: "Herói", side: "heroes", gx: 6, gy: 5, initiative: -20, hp: 60, hpMax: 60 });
    const { bridge, ai } = await setup([foe, hero]);
    expect(bridge.getCombatState().activeTokenId).toBe("goblin");

    const report = ai.runAiTurn("goblin");
    const after = bridge.getBoard().tokens.find((token) => token.id === "goblin")!;
    expect(Math.max(Math.abs(after.gx - 6), Math.abs(after.gy - 5))).toBeLessThanOrEqual(1);
    expect(report.steps.length).toBeGreaterThan(1);
    expect(bridge.getCombatState().activeTokenId).toBe("heroi");
  });

  it("não age fora do turno da ameaça", async () => {
    const foe = makeToken({ id: "goblin", side: "threats", gx: 2, gy: 5, initiative: -20 });
    const hero = makeToken({ id: "heroi", side: "heroes", gx: 6, gy: 5, initiative: 40 });
    const { ai } = await setup([foe, hero]);
    expect(() => ai.runAiTurn("goblin")).toThrow(/turno/);
  });
});

describe("reação fora do turno", () => {
  it("ação de reação é aceita fora do turno; ação padrão continua exigindo o turno", async () => {
    const reaction = makeAction({ id: "reagir", name: "Contra-ataque", kind: "reaction", rangeM: 1.5 });
    const standard = makeAction({ id: "golpe", name: "Golpe", rangeM: 1.5 });
    const foe = makeToken({ id: "goblin", side: "threats", gx: 4, gy: 5, initiative: -20, tacticalActions: [reaction, standard] });
    const hero = makeToken({ id: "heroi", side: "heroes", gx: 5, gy: 5, initiative: 40, hp: 60, hpMax: 60 });
    const { bridge, runtime } = await setup([foe, hero]);
    expect(bridge.getCombatState().activeTokenId).toBe("heroi");

    expect(() => runtime.executeTacticalAction("goblin", "golpe", ["heroi"])).toThrow(/turno/);
    expect(() => runtime.executeTacticalAction("goblin", "reagir", ["heroi"])).not.toThrow();
    // A reação da rodada foi gasta: uma segunda é recusada.
    expect(() => runtime.executeTacticalAction("goblin", "reagir", ["heroi"])).toThrow(/reação/i);
  });
});

describe("condições no combate", () => {
  it("Atordoado não pode gastar ação", async () => {
    const hero = makeToken({ id: "heroi", initiative: 40, conditions: ["Atordoado"], tacticalActions: [makeAction({ id: "golpe" })] });
    const foe = makeToken({ id: "goblin", side: "threats", gx: 2, gy: 1, initiative: -20 });
    const { runtime } = await setup([hero, foe]);
    expect(() => runtime.executeTacticalAction("heroi", "golpe", ["goblin"])).toThrow(/Atordoado/);
  });

  it("Em Chamas causa dano no início do turno", async () => {
    const hero = makeToken({ id: "heroi", initiative: 40, hp: 30, hpMax: 30 });
    const foe = makeToken({ id: "goblin", side: "threats", gx: 8, gy: 8, initiative: -20 });
    const { bridge } = await setup([hero, foe]);
    const { applyTurnStartConditions } = await import("../src/tactics/engine/conditionTicks");
    // A condição entra depois de começar o combate, para o efeito rodar só uma vez.
    bridge.updateToken("heroi", { conditions: ["Em Chamas"] });
    applyTurnStartConditions("heroi");
    const lost = 30 - bridge.getBoard().tokens.find((token) => token.id === "heroi")!.hp;
    expect(lost).toBeGreaterThanOrEqual(1);
    expect(lost).toBeLessThanOrEqual(6);
  });

  it("Sangrando: passa e para de sangrar, ou falha e perde vida", async () => {
    const hero = makeToken({ id: "heroi", initiative: 40, hp: 30, hpMax: 30, fortitude: 0 });
    const foe = makeToken({ id: "goblin", side: "threats", gx: 8, gy: 8, initiative: -20 });
    const { bridge } = await setup([hero, foe]);
    const { applyTurnStartConditions } = await import("../src/tactics/engine/conditionTicks");
    bridge.updateToken("heroi", { conditions: ["Sangrando"] });
    applyTurnStartConditions("heroi");
    const after = bridge.getBoard().tokens.find((token) => token.id === "heroi")!;
    const stopped = !(after.conditions || []).includes("Sangrando");
    expect(stopped ? after.hp === 30 : after.hp < 30).toBe(true);
  });
});

describe("movimento no T20: uma ação de movimento é usada inteira", () => {
  it("andar 3 m gasta a ação de movimento; o restante do deslocamento não sobra", async () => {
    const hero = makeToken({ id: "heroi", gx: 1, gy: 1, movementM: 9, initiative: 40 });
    const foe = makeToken({ id: "goblin", side: "threats", gx: 10, gy: 10, initiative: -20 });
    const { bridge, runtime } = await setup([hero, foe]);

    runtime.executeTacticalMove("heroi", 3, 1); // 3 m: bem menos que os 9 m
    expect(bridge.getCombatState().resources.heroi.movement).toBe(0);
    expect(bridge.getCombatState().resources.heroi.standard).toBe(1);

    // Um segundo deslocamento só é possível convertendo a ação padrão, e com o deslocamento inteiro de novo.
    runtime.executeTacticalMove("heroi", 9, 1);
    expect(bridge.getCombatState().resources.heroi.standard).toBe(0);
    expect(bridge.getBoard().tokens.find((token) => token.id === "heroi")!.gx).toBe(9);

    // Sem ação de movimento nem padrão: uma terceira caminhada é recusada.
    expect(() => runtime.executeTacticalMove("heroi", 10, 2)).toThrow(/movimento|padrão/i);
  });

  it("depois de andar ainda dá para atacar (ação padrão), mas não andar de novo sem gastá-la", async () => {
    const attack = makeAction({ id: "golpe", rangeM: 1.5 });
    const hero = makeToken({ id: "heroi", gx: 1, gy: 1, movementM: 9, initiative: 40, tacticalActions: [attack] });
    const foe = makeToken({ id: "goblin", side: "threats", gx: 5, gy: 1, initiative: -20 });
    const { bridge, runtime } = await setup([hero, foe]);
    runtime.executeTacticalMove("heroi", 4, 1);
    runtime.executeTacticalAction("heroi", "golpe", ["goblin"]);
    expect(bridge.getCombatState().resources.heroi).toMatchObject({ movement: 0, standard: 0 });
    expect(() => runtime.executeTacticalMove("heroi", 3, 1)).toThrow();
  });
});
