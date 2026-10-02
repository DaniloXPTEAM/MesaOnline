import { describe, expect, it } from "vitest";
import { addLootToSheet, coinsToTibar, parseLoot, splitTopLevel } from "../src/game/espolio/lootToSheet";
import { makeSheet } from "./helpers";

/** Pegar o conteúdo do baú para a mochila da ficha oficial. */
describe("moedas", () => {
  it("convertem para T$ pela cotação da página do Espólio", () => {
    expect(coinsToTibar("35 TC · 120 T$")).toBe(123.5);
    expect(coinsToTibar("2 TO")).toBe(20);
  });
});

describe("quebra do conteúdo do baú", () => {
  it("vírgula só separa fora de parênteses e colchetes", () => {
    expect(splitTopLevel("Adaga x2, poção de curar ferimentos [2d8+2, forte], gazua (barata, de ferro)")).toEqual(["Adaga x2", "poção de curar ferimentos [2d8+2, forte]", "gazua (barata, de ferro)"]);
  });

  it("linha só de moedas vira moedas; nota da ficha vira vários itens com quantidade", () => {
    const pieces = parseLoot(["120 T$", "Adaga x2, gazua", "3× Poção de cura"]);
    expect(pieces[0]).toEqual({ kind: "coins", tibar: 120 });
    expect(pieces.slice(1).map((piece) => [piece.name, piece.quantity])).toEqual([["Adaga", 2], ["gazua", 1], ["Poção de cura", 3]]);
  });
});

describe("ficha recebe o que foi pego", () => {
  it("soma o dinheiro, usa o catálogo para itens conhecidos e empilha repetidos", () => {
    const sheet = makeSheet({ money: 10, equipment: [] });
    const next = addLootToSheet(sheet, ["120 T$", "Adaga x2, gazua"], "Baú do Capitão");
    expect(next.money).toBe(130);
    const dagger = next.equipment.find((item) => item.name === "Adaga")!;
    expect(dagger).toMatchObject({ quantity: 2, category: "Arma", source: "Baú do Capitão" });
    expect(next.equipment.find((item) => /gazua/i.test(item.name))?.category).toBe("Ferramenta");
    const again = addLootToSheet(next, ["Adaga"], "Baú");
    expect(again.equipment.find((item) => item.name === "Adaga")?.quantity).toBe(3);
    expect(sheet.equipment).toHaveLength(0); // não altera a ficha original
  });

  it("arma pega também entra na lista de ataques, uma vez por nome", () => {
    const sheet = makeSheet({ equipment: [], attacks: [] });
    const once = addLootToSheet(sheet, ["Adaga"], "Baú");
    expect(once.attacks.map((attack) => attack.name)).toContain("Adaga");
    const twice = addLootToSheet(once, ["Adaga"], "Baú");
    expect(twice.attacks.filter((attack) => attack.name === "Adaga")).toHaveLength(1);
  });

  it("item desconhecido entra como Item Geral com o texto e o preço do baú", () => {
    const next = addLootToSheet(makeSheet({ equipment: [] }), ["Estatueta de osso (T$ 50)"], "Baú");
    expect(next.equipment[0]).toMatchObject({ name: "Estatueta de osso (T$ 50)", category: "Item Geral", price: 50, quantity: 1 });
  });

  it("a gazua pega do baú passa a contar para arrombar (sem –5)", async () => {
    const { hasLockpick } = await import("../src/tactics/engine/objectCommands");
    const { upsertCharacterSheet } = await import("../ficha-modernrpg/characterRoute");
    localStorage.clear();
    const sheet = makeSheet({ id: "ladina-1", equipment: [] });
    upsertCharacterSheet(addLootToSheet(sheet, ["Gazua"], "Baú"));
    const { makeToken } = await import("./helpers");
    const token = makeToken({ id: "ladina", modernRpgCharacterId: "ladina-1" });
    expect(hasLockpick(token)).toBe(true);
  });
});
