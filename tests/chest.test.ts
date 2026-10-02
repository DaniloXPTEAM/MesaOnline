import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers";
import type { BoardObject } from "../src/game/types";

/** Baú interativo: trancado, CD, armadilha, testes do jogador e o que o jogador pode saber. */
beforeEach(() => { localStorage.clear(); vi.resetModules(); });
afterEach(() => { vi.restoreAllMocks(); });

const chest = (overrides: Partial<BoardObject> = {}): BoardObject => ({
  id: "bau-1", kind: "chest", name: "Baú velho", x: 6, y: 5, opened: false, locked: false, contents: ["T$ 120", "Poção de cura"], ...overrides,
});

async function setup(object: BoardObject, heroOverrides = {}) {
  const bridge = await import("../src/game/vttBridge");
  const commands = await import("../src/tactics/engine/objectCommands");
  bridge.addToken(makeToken({ id: "ladino", name: "Sirih", gx: 5, gy: 5, hp: 30, hpMax: 30, level: 4, ...heroOverrides }));
  bridge.setObjects([object]);
  const get = () => bridge.getBoard().objects[0];
  const hero = () => bridge.getBoard().tokens.find((token) => token.id === "ladino")!;
  return { bridge, commands, get, hero };
}

const tranca = { id: "tranca-arcana", name: "Tranca Arcana", category: "spell", kind: "standard", effect: "text", target: "cell", description: "", pmCost: 1, rangeM: 1.5, color: "arcane" } as never;

const roll = (natural: number) => vi.spyOn(Math, "random").mockReturnValue((natural - 1) / 20 + 0.001);

describe("baú: abrir e trancado", () => {
  it("destrancado abre, revela o conteúdo e carimba a animação", async () => {
    const { commands, get } = await setup(chest());
    commands.executeObjectAction("ladino", "bau-1", "open");
    expect(get().opened).toBe(true);
    expect(get().revealAt).toBeGreaterThan(0);
  });

  it("trancado não abre: o baú treme e nada é rolado", async () => {
    const { bridge, commands, get } = await setup(chest({ locked: true, lockDc: 25 }));
    commands.executeObjectAction("ladino", "bau-1", "open");
    expect(get().opened).toBe(false);
    expect(get().shakeAt).toBeGreaterThan(0);
    expect(bridge.getCombatState().rolls).toHaveLength(0);
  });

  it("só interage de perto (casa adjacente)", async () => {
    const { commands } = await setup(chest({ x: 9, y: 9 }));
    expect(() => commands.executeObjectAction("ladino", "bau-1", "open")).toThrow(/perto/);
  });
});

describe("baú: CD da fechadura", () => {
  it("Ladinagem acima da CD arromba (destranca, sem abrir); abaixo, o baú treme", async () => {
    const { commands, get } = await setup(chest({ locked: true, lockDc: 12 }));
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "unlock");
    expect(get().locked).toBe(false);
    expect(get().opened).toBe(false);
  });

  it("falhar no teste mantém trancado e faz tremer", async () => {
    const { commands, get } = await setup(chest({ locked: true, lockDc: 40 }));
    roll(1);
    commands.executeObjectAction("ladino", "bau-1", "unlock");
    expect(get().locked).toBe(true);
    expect(get().shakeAt).toBeGreaterThan(0);
  });

  it("forçar é teste de Força e vai para o histórico de rolagens", async () => {
    const { bridge, commands, get } = await setup(chest({ locked: true, lockDc: 5 }));
    roll(15);
    commands.executeObjectAction("ladino", "bau-1", "force");
    expect(get().locked).toBe(false);
    expect(bridge.getCombatState().rolls[0].action).toMatch(/Força/);
  });

  it("CD padrão do baú é 25 (fechadura média); sem gazua, –5 em Ladinagem", async () => {
    const { effectiveLockDc } = await import("../src/game/chest");
    expect(effectiveLockDc({}, 25)).toBe(25);
    const { commands, get, bridge } = await setup(chest({ locked: true, lockDc: 20 }));
    roll(20); // 20 + 2 (nível 4) – 5 (sem gazua) = 17, abaixo da CD 20
    commands.executeObjectAction("ladino", "bau-1", "unlock");
    expect(get().locked).toBe(true);
    expect(bridge.getCombatState().rolls[0].modifier).toBe(-3);
  });

  it("Tranca Arcana soma +10 (e +5 por aprimoramento) à CD de Ladinagem e de Força", async () => {
    const { effectiveLockDc } = await import("../src/game/chest");
    expect(effectiveLockDc({ lockDc: 25, magicLocked: true }, 25)).toBe(35);
    expect(effectiveLockDc({ lockDc: 25, magicLocked: true, magicBonus: 5 }, 25)).toBe(40);
    const { commands, get } = await setup(chest({ locked: true, lockDc: 12, magicLocked: true }));
    roll(20); // Força 0 + 20 = 20, abaixo de 12 + 10
    commands.executeObjectAction("ladino", "bau-1", "force");
    expect(get().locked).toBe(true);
  });

  it("só a magia Tranca Arcana ajuda: quem a conhece abre por 2 PM e tranca por 1 PM", async () => {
    const { commands, get, hero } = await setup(chest({ locked: true, lockDc: 30, magicLocked: true }), { tacticalActions: [tranca], pm: 8 });
    commands.executeObjectAction("ladino", "bau-1", "arcane-open");
    expect(get().locked).toBe(false);
    expect(get().magicLocked).toBe(false);
    expect(hero().pm).toBe(6);
    commands.executeObjectAction("ladino", "bau-1", "arcane-lock");
    expect(get().locked).toBe(true);
    expect(get().magicLocked).toBe(true);
    expect(hero().pm).toBe(5);
  });

  it("sem conhecer Tranca Arcana, ou sem PM, a ação é recusada", async () => {
    const semMagia = await setup(chest({ locked: true }));
    expect(() => semMagia.commands.executeObjectAction("ladino", "bau-1", "arcane-open")).toThrow(/não conhece/);
    vi.resetModules();
    localStorage.clear();
    const semPm = await setup(chest({ locked: true }), { tacticalActions: [tranca], pm: 1 });
    expect(() => semPm.commands.executeObjectAction("ladino", "bau-1", "arcane-open")).toThrow(/PM insuficientes/);
  });
});

describe("baú: armadilha", () => {
  const trap = { name: "Dardo envenenado", armed: true, detectDc: 15, disarmDc: 15, damage: "2d6", damageType: "Perfuração", condition: "Enjoado" };

  it("abrir dispara a armadilha em quem abriu (dano e condição) e a desarma", async () => {
    const { commands, get, hero } = await setup(chest({ trap }));
    roll(1);
    commands.executeObjectAction("ladino", "bau-1", "open");
    expect(hero().hp).toBeLessThan(30);
    expect(hero().conditions).toContain("Enjoado");
    expect(get().trap?.armed).toBe(false);
  });

  it("passar na resistência reduz o dano à metade e evita a condição", async () => {
    const { commands, hero } = await setup(chest({ trap: { ...trap, damage: "2d6", save: "reflexes", saveDc: 1 } }), { reflexes: 10 });
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "open");
    expect(hero().conditions || []).not.toContain("Enjoado");
    expect(hero().hp).toBeGreaterThan(30 - 7);
  });

  it("Misticismo detecta se há MAGIA no baú (não armadilha), com a CD que o Mestre define", async () => {
    const { bridge, commands, get } = await setup(chest({ locked: true, magicLocked: true, magicDc: 15, trap }));
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "recognize");
    expect(get().magicRevealed).toBe(true);
    expect(get().trap?.revealed).toBeUndefined(); // armadilha é com Percepção
    expect(bridge.getCombatState().rolls[0].action).toMatch(/Misticismo/);
    const { objectForPlayer } = await import("../src/game/chest");
    const seen = objectForPlayer(get());
    expect(seen.magicLocked).toBe(true);
    expect(seen.magicDc).toBeUndefined();
  });

  it("falhar no Misticismo, ou não haver magia, dá a mesma resposta e nada é revelado", async () => {
    const withMagic = await setup(chest({ locked: true, magicLocked: true, magicDc: 40 }));
    roll(1);
    withMagic.commands.executeObjectAction("ladino", "bau-1", "recognize");
    expect(withMagic.get().magicRevealed).toBeUndefined();
    vi.resetModules();
    localStorage.clear();
    const noMagic = await setup(chest({ locked: true }));
    roll(20);
    noMagic.commands.executeObjectAction("ladino", "bau-1", "recognize");
    expect(noMagic.get().magicRevealed).toBeUndefined();
  });

  it("procurar armadilha é Percepção e desarmar é Ladinagem, cada uma com a CD do Mestre", async () => {
    const { bridge, commands } = await setup(chest({ trap }));
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "search");
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "disarm");
    const actions = bridge.getCombatState().rolls.map((entry) => entry.action);
    expect(actions.some((action) => /Percepção/.test(action))).toBe(true);
    expect(actions.some((action) => /Ladinagem/.test(action))).toBe(true);
  });

  it("Percepção bem-sucedida revela a armadilha; depois dá para desarmar", async () => {
    const { commands, get, hero } = await setup(chest({ trap }));
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "search");
    expect(get().trap?.revealed).toBe(true);
    roll(20);
    commands.executeObjectAction("ladino", "bau-1", "disarm");
    expect(get().trap?.armed).toBe(false);
    commands.executeObjectAction("ladino", "bau-1", "open");
    expect(hero().hp).toBe(30);
  });

  it("não dá para desarmar o que ainda não foi encontrado", async () => {
    const { commands } = await setup(chest({ trap }));
    expect(() => commands.executeObjectAction("ladino", "bau-1", "disarm")).toThrow(/não conhece/);
  });

  it("errar o desarme por 5 ou mais dispara a armadilha", async () => {
    const { commands, get, hero } = await setup(chest({ trap: { ...trap, revealed: true, disarmDc: 40 } }));
    roll(1);
    commands.executeObjectAction("ladino", "bau-1", "disarm");
    expect(get().trap?.armed).toBe(false);
    expect(hero().hp).toBeLessThan(30);
  });
});

describe("baú: o que o jogador pode saber", () => {
  it("sem CD, sem conteúdo enquanto fechado, armadilha só como aviso depois de revelada", async () => {
    const { objectForPlayer } = await import("../src/game/chest");
    const secret = chest({ locked: true, lockDc: 22, magicLocked: true, magicBonus: 5, trap: { name: "Dardo", armed: true, detectDc: 18, disarmDc: 20, damage: "2d6" } });
    const hidden = objectForPlayer(secret);
    expect(hidden.lockDc).toBeUndefined();
    expect(hidden.magicLocked).toBeUndefined();
    expect(hidden.contents).toEqual([]);
    expect(hidden.trap).toBeUndefined();
    const known = objectForPlayer({ ...secret, trap: { ...secret.trap!, revealed: true }, opened: true, locked: false });
    expect(known.contents).toEqual(["T$ 120", "Poção de cura"]);
    expect(known.trap).toMatchObject({ name: "Dardo", revealed: true, detectDc: 0, disarmDc: 0 });
    expect(known.trap?.damage).toBeUndefined();
  });

  it("o Mestre sem personagem abre e fecha sem teste nem armadilha", async () => {
    const { commands, get, hero } = await setup(chest({ locked: true, trap: { name: "Dardo", armed: true, detectDc: 15, disarmDc: 15, damage: "2d6" } }));
    commands.executeObjectAction(null, "bau-1", "open");
    expect(get().opened).toBe(true);
    expect(hero().hp).toBe(30);
    commands.executeObjectAction(null, "bau-1", "close");
    expect(get().opened).toBe(false);
  });
});

describe("baú: pegar o conteúdo", () => {
  it("só de baú aberto; tira do baú e deixa pendente no token de quem pegou", async () => {
    const { commands, get, hero } = await setup(chest({ opened: false }));
    expect(() => commands.executeObjectAction("ladino", "bau-1", "take")).toThrow(/fechado/);
    commands.executeObjectAction("ladino", "bau-1", "open");
    commands.executeObjectAction("ladino", "bau-1", "take", [0]);
    expect(get().contents).toEqual(["Poção de cura"]);
    expect(hero().pendingLoot).toEqual(["T$ 120"]);
    commands.executeObjectAction("ladino", "bau-1", "take");
    expect(get().contents).toEqual([]);
    expect(hero().pendingLoot).toEqual(["T$ 120", "Poção de cura"]);
    expect(() => commands.executeObjectAction("ladino", "bau-1", "take")).toThrow(/nada/);
  });

  it("quem tem a ficha aplica e o Mestre limpa a pendência", async () => {
    const { commands, hero } = await setup(chest({ opened: true }));
    commands.executeObjectAction("ladino", "bau-1", "take");
    expect(hero().pendingLoot?.length).toBe(2);
    commands.executeClaimLoot("ladino");
    expect(hero().pendingLoot).toEqual([]);
  });
});

describe("baú fechado bloqueia o movimento", () => {
  it("não dá para andar sobre baú fechado nem por ele; aberto, dá", async () => {
    const { bridge } = await setup(chest({ x: 6, y: 5 }));
    const { reachableCells } = await import("../src/tactics/engine/movement");
    const hero = () => bridge.getBoard().tokens.find((token) => token.id === "ladino")!;
    expect(reachableCells(bridge.getBoard(), hero()).has("6,5")).toBe(false);
    expect(() => bridge.moveToken("ladino", 6, 5)).toThrow(/baú fechado/);
    bridge.updateBoardObject("bau-1", { opened: true });
    expect(reachableCells(bridge.getBoard(), hero()).has("6,5")).toBe(true);
    expect(() => bridge.moveToken("ladino", 6, 5)).not.toThrow();
  });

  it("item e tesouro no chão não bloqueiam, e quem está sobre o baú consegue sair", async () => {
    const { bridge } = await setup(chest({ kind: "item", x: 6, y: 5 }));
    expect(() => bridge.moveToken("ladino", 6, 5)).not.toThrow();
    vi.resetModules();
    localStorage.clear();
    const stuck = await setup(chest({ x: 5, y: 5 }));
    expect(() => stuck.bridge.moveToken("ladino", 4, 5)).not.toThrow();
  });
});

