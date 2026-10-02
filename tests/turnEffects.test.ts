import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers";

/**
 * Regressão da auditoria de paridade: `emitTacticalEvent("onTurnStart", …)`
 * nunca era disparado, então `expireEffectsAtTurn` nunca rodava e efeitos com
 * duração em rodadas duravam a cena inteira.
 */
describe("expiração de efeitos no início do turno", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("remove o efeito de rodadas e a condição quando o turno do alvo volta", async () => {
    const bridge = await import("../src/game/vttBridge");
    // O import é o que liga o bus tático ao runtime.
    const { addTacticalEffect } = await import("../src/tactics/engine/reactiveTriggers");

    const hero = makeToken({ id: "hero-expira", name: "Alyssa", initiative: 20 });
    const foe = makeToken({ id: "foe-expira", name: "Goblin", side: "threats", gx: 4, gy: 4, initiative: 1 });
    bridge.addToken(hero);
    bridge.addToken(foe);
    bridge.startCombat();

    const round = bridge.getCombatState().round;
    addTacticalEffect(hero.id, {
      id: "efeito-curto",
      name: "Escudo da Fé",
      sourceId: "spell:escudo-da-fe",
      sourceName: "Escudo da Fé",
      kind: "rounds",
      expiresRound: round + 1,
      condition: "Abençoado",
      mods: { defense: 2 },
    });

    expect(bridge.getBoard().tokens.find((token) => token.id === hero.id)?.effects).toHaveLength(1);

    // Uma volta completa da iniciativa: o turno do herói recomeça.
    const total = bridge.getCombatState().order.length;
    for (let step = 0; step < total; step += 1) bridge.endTurn();

    const persisted = bridge.getBoard().tokens.find((token) => token.id === hero.id)!;
    expect(bridge.getCombatState().round).toBeGreaterThan(round);
    expect(persisted.effects || []).toHaveLength(0);
    expect(persisted.conditions || []).not.toContain("Abençoado");
  });

  it("preserva efeito sem prazo e efeito que ainda não venceu", async () => {
    const bridge = await import("../src/game/vttBridge");
    const { addTacticalEffect } = await import("../src/tactics/engine/reactiveTriggers");

    const hero = makeToken({ id: "hero-mantem", name: "Alyssa", initiative: 20 });
    const foe = makeToken({ id: "foe-mantem", name: "Goblin", side: "threats", gx: 4, gy: 4, initiative: 1 });
    bridge.addToken(hero);
    bridge.addToken(foe);
    bridge.startCombat();

    const round = bridge.getCombatState().round;
    addTacticalEffect(hero.id, { id: "de-cena", name: "Bênção", sourceId: "s", sourceName: "Bênção", kind: "scene" });
    addTacticalEffect(hero.id, { id: "longo", name: "Arma Mágica", sourceId: "s2", sourceName: "Arma Mágica", kind: "rounds", expiresRound: round + 10 });

    const total = bridge.getCombatState().order.length;
    for (let step = 0; step < total; step += 1) bridge.endTurn();

    const ids = (bridge.getBoard().tokens.find((token) => token.id === hero.id)?.effects || []).map((effect) => effect.id);
    expect(ids).toContain("de-cena");
    expect(ids).toContain("longo");
  });

  it("por padrão o efeito termina no início do turno do conjurador, não do alvo", async () => {
    const bridge = await import("../src/game/vttBridge");
    const { addTacticalEffect } = await import("../src/tactics/engine/reactiveTriggers");
    const hero = makeToken({ id: "hero-conj", name: "Alyssa", initiative: 20 });
    const foe = makeToken({ id: "foe-alvo", name: "Goblin", side: "threats", gx: 4, gy: 4, initiative: 1 });
    bridge.addToken(hero);
    bridge.addToken(foe);
    bridge.startCombat();
    const round = bridge.getCombatState().round;
    addTacticalEffect(foe.id, { id: "no-alvo", name: "Hipnotismo", kind: "rounds", expiresRound: round + 1, casterId: hero.id, condition: "Fascinado" });

    bridge.endTurn(); // começa o turno do alvo: o efeito ainda vale
    expect(bridge.getBoard().tokens.find((token) => token.id === foe.id)?.effects).toHaveLength(1);
    bridge.endTurn(); // volta ao conjurador na rodada seguinte: termina
    const after = bridge.getBoard().tokens.find((token) => token.id === foe.id)!;
    expect(after.effects || []).toHaveLength(0);
    expect(after.conditions || []).not.toContain("Fascinado");
  });

  it("lê a duração do descritor da magia", async () => {
    const { parseDurationRounds } = await import("../src/tactics/engine/spellEffects");
    expect(parseDurationRounds("1 turno")).toBe(1);
    expect(parseDurationRounds("5 rodadas")).toBe(5);
    expect(parseDurationRounds("Instantânea")).toBeNull();
    const rolled = parseDurationRounds("1d4 rodadas")!;
    expect(rolled).toBeGreaterThanOrEqual(1);
    expect(rolled).toBeLessThanOrEqual(4);
  });
});
