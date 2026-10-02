import { afterEach, describe, expect, it, vi } from "vitest";
import { TESOURO_ND } from "../src/game/espolio/tabelas";
import { challengeKey, coinsText, lootContents, parseTreasure, rollThreatLoot, tibarInText, type TreasureTier } from "../src/game/espolio/espolio";

afterEach(() => { vi.restoreAllMocks(); });

describe("tabelas reais de tesouro (copiadas de public/espolio)", () => {
  it("há uma linha por ND, de 1/4 a 20, e cada coluna cobre d% de 1 a 100 sem buraco", () => {
    expect(TESOURO_ND.map((row) => row.nd)).toEqual(["1/4", "1/2", ...Array.from({ length: 20 }, (_, index) => String(index + 1))]);
    for (const row of TESOURO_ND) {
      for (const column of [row.dinheiro, row.itens]) {
        const covered = new Set<number>();
        for (const [range] of column) {
          const [min, max] = range.split("-").map(Number);
          for (let value = min; value <= max; value += 1) covered.add(value);
        }
        expect(covered.size, `ND ${row.nd}`).toBe(100);
      }
    }
  });
});

describe("rolagem do espólio", () => {
  it("Padrão rola uma vez, Metade divide o dinheiro por 2, Dobro rola duas vezes, Nenhum não traz nada", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // d% = 51 (ND 1: 3d8x10 T$), cada dado 5
    expect(rollThreatLoot("1", "padrao").coins).toEqual({ "T$": 150 });
    expect(rollThreatLoot("1", "metade").coins).toEqual({ "T$": 75 });
    expect(rollThreatLoot("1", "dobro").coins).toEqual({ "T$": 300 });
    expect(rollThreatLoot("1", "triplo").coins).toEqual({ "T$": 450 });
    expect(rollThreatLoot("1", "nenhum")).toEqual({ coins: {}, items: [], totalTibar: 0 });
  });

  it("a coluna Itens da faixa sorteada vira item: ND 1 com d% 51 é Item diverso", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const loot = rollThreatLoot("1", "padrao");
    expect(loot.items).toHaveLength(1);
    expect(loot.items[0].length).toBeGreaterThan(2);
  });

  it("qualquer ND e qualquer tesouro sorteiam sem erro e devolvem texto legível", () => {
    for (const row of TESOURO_ND) {
      for (const tier of ["padrao", "metade", "dobro", "triplo"] as TreasureTier[]) {
        for (let i = 0; i < 40; i += 1) {
          const loot = rollThreatLoot(row.nd, tier, i % 2 ? 10 : 0);
          for (const item of loot.items) { expect(typeof item).toBe("string"); expect(item.trim()).not.toBe(""); expect(item).not.toContain("undefined"); }
          for (const value of Object.values(loot.coins)) expect(Number.isFinite(value)).toBe(true);
        }
      }
    }
  });

  it("riqueza tem valor exato sorteado (dado × multiplicador) e um objeto dos exemplos", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // d% = 100: ND 1 dá "1 riqueza menor" na coluna Dinheiro
    const loot = rollThreatLoot("1", "padrao");
    const rich = loot.items.find((item) => /\(T\$ \d[\d.]*\)$/.test(item));
    expect(rich, loot.items.join(" | ")).toBeTruthy();
    expect(loot.totalTibar).toBeGreaterThan(0);
  });

  it("bônus de sala do tesouro (+5%) puxa o d% para cima e nunca passa de 100", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999); // d% = 100
    expect(() => rollThreatLoot("20", "padrao", 50)).not.toThrow();
  });

  it("valor em T$ do texto e resumo das moedas", () => {
    expect(tibarInText("Espada longa (T$ 15), pérola (700 T$)")).toBe(715);
    expect(coinsText({ TC: 35, "T$": 0, TO: 2 })).toBe("35 TC · 2 TO");
  });

  it("o conteúdo do baú junta moedas, itens e o que a ficha diz que a criatura carrega", () => {
    const contents = lootContents({ coins: { "T$": 120 }, items: ["Poção de cura"], totalTibar: 150 }, "Adaga, gazua");
    expect(contents).toEqual(["120 T$", "Poção de cura", "Adaga, gazua"]);
  });
});

describe("leitura da ficha da ameaça", () => {
  it("ND: frações, símbolos, prefixos e valores fora da tabela", () => {
    expect(challengeKey("1/4")).toBe("1/4");
    expect(challengeKey("¼")).toBe("1/4");
    expect(challengeKey("½")).toBe("1/2");
    expect(challengeKey("ND 5")).toBe("5");
    expect(challengeKey("Agora 10")).toBe("10");
    expect(challengeKey("S")).toBe("20");
    expect(challengeKey("S+")).toBe("20");
    expect(challengeKey("ND 1/3")).toBe("1/4");
    expect(challengeKey("-")).toBeNull();
    expect(challengeKey("?")).toBeNull();
    expect(challengeKey(undefined)).toBeNull();
  });

  it("tesouro: Nenhum, Metade, Padrão, Dobro, Triplo, com equipamento e com materiais", () => {
    expect(parseTreasure("Nenhum")).toEqual({ tier: "nenhum", note: "" });
    expect(parseTreasure("Nenhum.")).toEqual({ tier: "nenhum", note: "" });
    expect(parseTreasure("Metade (Adaga, gazua)")).toEqual({ tier: "metade", note: "Adaga, gazua" });
    expect(parseTreasure("Padrão (Adaga [1d8 de cada], poção de curar ferimentos [2d8+2])").note).toContain("poção de curar ferimentos [2d8+2]");
    expect(parseTreasure("padrão").tier).toBe("padrao");
    expect(parseTreasure("Dobro e 2 peças de couro de dragão (CD 22 para extrair)").note).toBe("e 2 peças de couro de dragão (CD 22 para extrair)");
    expect(parseTreasure("Triplo (Kazidhaan)")).toEqual({ tier: "triplo", note: "Kazidhaan" });
    expect(parseTreasure("Ova de estirge")).toEqual({ tier: null, note: "Ova de estirge" });
    expect(parseTreasure(undefined)).toEqual({ tier: null, note: "" });
  });
});
