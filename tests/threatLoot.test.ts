import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import threats from "../ficha-modernrpg/t20/vtt/ameacas.json";
import { makeToken } from "./helpers";

/** Derrotar uma ameaça do bestiário solta um baú de espólio sorteado pelas tabelas reais. */
// Sorteio fixo (d% = 51): sem isso a rolagem pode cair em "sem tesouro" e o teste oscilaria.
beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.spyOn(Math, "random").mockReturnValue(0.5); });
afterEach(() => { vi.restoreAllMocks(); });

const list = threats as { id: string; nd: string; tesouro?: string }[];
const withTreasure = list.find((threat) => /^padr[aã]o$/i.test((threat.tesouro || "").trim()) && /^\d+$/.test(threat.nd));
const withNone = list.find((threat) => /^nenhum\.?$/i.test((threat.tesouro || "").trim()));

async function setup(bestiaryId: string, overrides = {}) {
  const bridge = await import("../src/game/vttBridge");
  await import("../src/game/espolio/threatLoot");
  bridge.addToken(makeToken({ id: "monstro", name: "Monstro", side: "threats", gx: 4, gy: 6, hp: 10, hpMax: 10, bestiaryId, ...overrides }));
  return bridge;
}

describe("espólio da ameaça", () => {
  it("ao ficar sem PV, a ameaça solta um baú de espólio na casa onde caiu", async () => {
    expect(withTreasure).toBeTruthy();
    const bridge = await setup(withTreasure!.id);
    bridge.updateToken("monstro", { hp: 0 });
    const chests = bridge.getBoard().objects;
    expect(chests).toHaveLength(1);
    expect(chests[0]).toMatchObject({ kind: "chest", name: "Espólio de Monstro", x: 4, y: 6, opened: false, locked: false });
    expect(bridge.getBoard().tokens.find((token) => token.id === "monstro")?.lootDropped).toBe(true);
  });

  it("não repete o baú se o token cai de novo", async () => {
    const bridge = await setup(withTreasure!.id);
    bridge.updateToken("monstro", { hp: 0 });
    bridge.updateToken("monstro", { hp: 5 });
    bridge.updateToken("monstro", { hp: 0 });
    expect(bridge.getBoard().objects.filter((object) => object.name.startsWith("Espólio"))).toHaveLength(1);
  });

  it("tesouro Nenhum, herói e token sem ficha não soltam baú", async () => {
    expect(withNone).toBeTruthy();
    const none = await setup(withNone!.id);
    none.updateToken("monstro", { hp: 0 });
    expect(none.getBoard().objects).toHaveLength(0);

    vi.resetModules();
    localStorage.clear();
    const hero = await setup(withTreasure!.id, { side: "heroes" });
    hero.updateToken("monstro", { hp: 0 });
    expect(hero.getBoard().objects).toHaveLength(0);

    vi.resetModules();
    localStorage.clear();
    const unknown = await setup("nao-existe");
    unknown.updateToken("monstro", { hp: 0 });
    expect(unknown.getBoard().objects).toHaveLength(0);
  });

  it("o Mestre cria (ou refaz) o baú à mão com force", async () => {
    const bridge = await setup(withNone!.id);
    const { dropLootChest } = await import("../src/game/espolio/threatLoot");
    expect(dropLootChest("monstro")).toBeNull();
    expect(dropLootChest("monstro", { force: true })).not.toBeNull();
    expect(bridge.getBoard().objects).toHaveLength(1);
  });
});
