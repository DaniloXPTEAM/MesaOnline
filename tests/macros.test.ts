import { beforeEach, describe, expect, it } from "vitest";
import {
  loadMacros, parseFormula, removeMacro, rollFormula, saveMacros, upsertMacro,
} from "../src/game/macros";

/**
 * A Mesa já tinha macros POR TOKEN. Estas são as GLOBAIS do VTT antigo e do V3:
 * o Mestre cria "Percepção 1d20+5" uma vez e usa a sessão inteira.
 */
describe("formulas de macro", () => {
  it("entende as formas comuns", () => {
    expect(parseFormula("1d20+5")).toEqual({ count: 1, faces: 20, modifier: 5 });
    expect(parseFormula("2d6")).toEqual({ count: 2, faces: 6, modifier: 0 });
    expect(parseFormula("d20-1")).toEqual({ count: 1, faces: 20, modifier: -1 });
    expect(parseFormula(" 3d8 + 2 ")).toEqual({ count: 3, faces: 8, modifier: 2 });
  });

  it("recusa lixo em vez de fingir que entendeu", () => {
    expect(parseFormula("")).toBeNull();
    expect(parseFormula("abc")).toBeNull();
    expect(parseFormula("1d")).toBeNull();
    expect(rollFormula("nada")).toBeNull();
  });

  it("limita valores absurdos", () => {
    expect(parseFormula("999d20")?.count).toBe(50);
    expect(parseFormula("1d99999")?.faces).toBe(1000);
  });

  it("rola dentro da faixa e soma o modificador", () => {
    const r = rollFormula("2d6+3", () => 0.5)!;
    expect(r.rolls).toHaveLength(2);
    expect(r.rolls.every((v) => v >= 1 && v <= 6)).toBe(true);
    expect(r.total).toBe(r.rolls[0] + r.rolls[1] + 3);
    expect(r.modifier).toBe(3);
  });

  it("random controlado da resultado previsivel", () => {
    expect(rollFormula("1d20+0", () => 0)!.total).toBe(1);
    expect(rollFormula("1d20+0", () => 0.999)!.total).toBe(20);
  });
});

describe("persistencia das macros globais", () => {
  beforeEach(() => window.localStorage.clear());

  it("cria, edita, remove e sobrevive ao reload", () => {
    upsertMacro({ id: "m1", name: "Percepção", formula: "1d20+5" });
    upsertMacro({ id: "m2", name: "Iniciativa", formula: "1d20+7" });
    expect(loadMacros().map((m) => m.name)).toEqual(["Percepção", "Iniciativa"]);

    upsertMacro({ id: "m1", name: "Percepção", formula: "1d20+8" });
    expect(loadMacros()).toHaveLength(2);
    expect(loadMacros().find((m) => m.id === "m1")?.formula).toBe("1d20+8");

    removeMacro("m2");
    expect(loadMacros().map((m) => m.id)).toEqual(["m1"]);
  });

  it("storage corrompido nao derruba a mesa", () => {
    window.localStorage.setItem("tormenta20_mesa_macros_v1", "{isso não é json");
    expect(loadMacros()).toEqual([]);
    saveMacros([{ id: "x", name: "Ok", formula: "1d4" }]);
    expect(loadMacros()).toHaveLength(1);
  });
});
