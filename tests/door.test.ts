import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers";
import type { BoardWall } from "../src/game/types";

/** Portas com CD, na mesma arquitetura do baú (tranca comum e tranca mágica). */
beforeEach(() => { localStorage.clear(); vi.resetModules(); });
afterEach(() => { vi.restoreAllMocks(); });

const door = (overrides: Partial<BoardWall> = {}): BoardWall => ({ id: "porta-1", type: "door", x1: 6, y1: 5, x2: 7, y2: 5, open: false, locked: false, name: "Porta de ferro", ...overrides });

async function setup(wall: BoardWall, heroOverrides = {}) {
  const bridge = await import("../src/game/vttBridge");
  const commands = await import("../src/tactics/engine/objectCommands");
  bridge.addToken(makeToken({ id: "ladino", name: "Sirih", gx: 5, gy: 5, hp: 30, hpMax: 30, level: 4, ...heroOverrides }));
  const hero = () => bridge.getBoard().tokens.find((token) => token.id === "ladino")!;
  bridge.upsertWall(wall);
  const get = () => bridge.getBoard().walls.find((entry) => entry.id === "porta-1")!;
  return { bridge, commands, get, hero };
}
const tranca = { id: "tranca-arcana", name: "Tranca Arcana", category: "spell", kind: "standard", effect: "text", target: "cell", description: "", pmCost: 1, rangeM: 1.5, color: "arcane" } as never;

const roll = (natural: number) => vi.spyOn(Math, "random").mockReturnValue((natural - 1) / 20 + 0.001);

describe("porta com CD", () => {
  it("destrancada abre e fecha", async () => {
    const { commands, get } = await setup(door());
    commands.executeDoorAction("ladino", "porta-1", "open");
    expect(get().open).toBe(true);
    commands.executeDoorAction("ladino", "porta-1", "close");
    expect(get().open).toBe(false);
  });

  it("trancada não abre: a porta treme e nada é rolado", async () => {
    const { bridge, commands, get } = await setup(door({ locked: true, lockDc: 25 }));
    commands.executeDoorAction("ladino", "porta-1", "open");
    expect(get().open).toBe(false);
    expect(get().shakeAt).toBeGreaterThan(0);
    expect(bridge.getCombatState().rolls).toHaveLength(0);
  });

  it("Ladinagem contra a CD da fechadura (porta simples: CD 20 por padrão)", async () => {
    const { bridge, commands, get } = await setup(door({ locked: true, lockDc: 10 }));
    roll(20);
    commands.executeDoorAction("ladino", "porta-1", "unlock");
    expect(get().locked).toBe(false);
    expect(bridge.getCombatState().rolls[0].action).toMatch(/Ladinagem/);
  });

  it("falhar mantém trancada e faz tremer", async () => {
    const { commands, get } = await setup(door({ locked: true, lockDc: 40 }));
    roll(1);
    commands.executeDoorAction("ladino", "porta-1", "force");
    expect(get().locked).toBe(true);
    expect(get().shakeAt).toBeGreaterThan(0);
  });

  it("porta sem CD definida usa 20 (fechadura simples) e a Força é teste de atributo", async () => {
    const { effectiveLockDc } = await import("../src/game/chest");
    expect(effectiveLockDc({}, 20)).toBe(20);
    const { bridge, commands, get } = await setup(door({ locked: true }));
    roll(20); // Força 0 + 20 = 20, igual à CD 20
    commands.executeDoorAction("ladino", "porta-1", "force");
    expect(get().locked).toBe(false);
    expect(bridge.getCombatState().rolls[0].action).toMatch(/Força/);
  });

  it("Tranca Arcana na porta: +10 na CD, e só a magia (2 PM) a abre", async () => {
    const { commands, get, hero } = await setup(door({ locked: true, lockDc: 20, magicLocked: true }), { tacticalActions: [tranca], pm: 8 });
    roll(20); // 20 + 2 – 5 (sem gazua) = 17, longe de 30
    commands.executeDoorAction("ladino", "porta-1", "unlock");
    expect(get().locked).toBe(true);
    commands.executeDoorAction("ladino", "porta-1", "arcane-open");
    expect(get().locked).toBe(false);
    expect(hero().pm).toBe(6);
  });

  it("só de perto, e o Mestre sem personagem abre e fecha sem teste", async () => {
    const { commands, get } = await setup(door({ x1: 12, y1: 12, x2: 13, y2: 12, locked: true }));
    expect(() => commands.executeDoorAction("ladino", "porta-1", "open")).toThrow(/perto/);
    commands.executeDoorAction(null, "porta-1", "open");
    expect(get().open).toBe(true);
    expect(get().locked).toBe(false);
  });

  it("o jogador não recebe as CDs da porta", async () => {
    const { wallForPlayer } = await import("../src/game/chest");
    const hidden = wallForPlayer(door({ locked: true, lockDc: 22, magicLocked: true, magicBonus: 5 }));
    expect(hidden.lockDc).toBeUndefined();
    expect(hidden.magicBonus).toBeUndefined();
    expect(hidden.locked).toBe(true);
    expect(hidden.magicLocked).toBeUndefined();
  });
});

describe("porta com armadilha", () => {
  const trap = { name: "Lâmina oculta", armed: true, detectDc: 12, disarmDc: 12, damage: "2d6", damageType: "Corte" };

  it("abrir dispara a armadilha em quem abriu e ela se desarma", async () => {
    const { commands, get, hero } = await setup(door({ trap }));
    roll(1);
    commands.executeDoorAction("ladino", "porta-1", "open");
    expect(get().open).toBe(true);
    expect(hero().hp).toBeLessThan(30);
    expect(get().trap?.armed).toBe(false);
  });

  it("Percepção revela e Ladinagem desarma (CDs do Mestre); o jogador só vê o aviso", async () => {
    const { bridge, commands, get, hero } = await setup(door({ trap }));
    roll(20);
    commands.executeDoorAction("ladino", "porta-1", "search");
    expect(get().trap?.revealed).toBe(true);
    const { wallForPlayer } = await import("../src/game/chest");
    expect(wallForPlayer(get()).trap).toMatchObject({ name: "Lâmina oculta", revealed: true, detectDc: 0, disarmDc: 0 });
    expect(wallForPlayer(get()).trap?.damage).toBeUndefined();
    commands.executeDoorAction("ladino", "porta-1", "disarm");
    expect(get().trap?.armed).toBe(false);
    commands.executeDoorAction("ladino", "porta-1", "open");
    expect(hero().hp).toBe(30);
    const actions = bridge.getCombatState().rolls.map((entry) => entry.action);
    expect(actions.some((action) => /Percepção/.test(action))).toBe(true);
    expect(actions.some((action) => /Ladinagem/.test(action))).toBe(true);
  });

  it("armadilha não revelada não aparece para o jogador", async () => {
    const { wallForPlayer } = await import("../src/game/chest");
    expect(wallForPlayer(door({ trap })).trap).toBeUndefined();
  });
});

