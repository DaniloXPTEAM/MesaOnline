import { describe, expect, it } from "vitest";
import { inferActionFields, parseAreaM, parseCondition, parseRangeM, parseSave } from "../src/tactics/interpretation/modernRpgRules";

describe("interpretador genérico V3", () => {
  it("preserva área, condição, resistência, metade e dano extra", () => {
    const parsed = inferActionFields("Explosão em cone de 6m. Reflexos CD 18 reduz à metade. Causa 4d6 mais 1d6 e deixa o alvo atordoado.");
    expect(parsed).toMatchObject({
      areaM: 6,
      condition: "atordoado",
      save: "reflexes",
      saveDC: 18,
      halfOnSave: true,
      extraDamage: "1d6",
    });
  });

  it("interpreta alcances, saves e condições sem parser simplificado paralelo", () => {
    expect(parseRangeM("alcance médio")).toBe(30);
    expect(parseAreaM("esfera de 9m")).toBe(9);
    expect(parseSave("Fortitude reduz")).toBe("fortitude");
    expect(parseSave("Vontade anula")).toBe("will");
    expect(parseCondition("fica vulnerável por uma rodada")).toBe("vulnerável");
  });
});
