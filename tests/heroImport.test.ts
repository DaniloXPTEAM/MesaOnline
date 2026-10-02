import { describe, expect, it } from "vitest";
import kaleb from "./fixtures/kaleb-heroi-pdf.json";
import { importVttJson } from "../src/portal/lib/vtt/importVtt";
import { heroJsonToSheet, isHeroJson } from "../src/portal/lib/pdf/heroJson";
import { defense, skillTotal } from "../src/portal/lib/t20/sheetRules";

/**
 * JSON do herói no formato "personagem" + "campos_originais_pdf" (extrator do PDF "Modelo de Heróis").
 * Usa os importadores do PORTAL: o JSON do Kaleb era recusado por "Importar VTT" e por "Importar JSON".
 */
describe("JSON do herói (personagem + campos do PDF)", () => {
  it("é reconhecido como herói", () => {
    expect(isHeroJson(kaleb)).toBe(true);
    expect(isHeroJson({ foo: 1 })).toBe(false);
  });

  it("Importar VTT aceita o JSON e entrega a ficha completa", () => {
    const result = importVttJson(JSON.stringify(kaleb), "kaleb.json");
    expect(result.kind).toBe("heroi-json");
    expect(result.characters).toHaveLength(1);
    const sheet = result.characters[0];
    expect(sheet.name).toBe("Kaleb");
    expect(sheet.level).toBe(3);
    expect(sheet.attributes.for.value).toBe(6);
    expect(sheet.hp.max).toBe(39);
    expect(defense(sheet).total).toBe(19);
    expect(skillTotal(sheet, "lut")!.total).toBe(9);
    expect(sheet.equipment.some((item) => item.name === "Gibão de peles" && item.equipped)).toBe(true);
    expect(sheet.powers.length).toBeGreaterThanOrEqual(7);
  });

  it("sem os campos do PDF, o resumo 'personagem' ainda vira ficha", () => {
    const sheet = heroJsonToSheet({ personagem: kaleb.personagem });
    expect(sheet.name).toBe("Kaleb");
    expect(sheet.attributes.for.value).toBe(6);
    expect(sheet.attributes.car.value).toBe(-1);
    expect(sheet.hp).toEqual({ current: 39, max: 39 });
    expect(sheet.mp.max).toBe(9);
    expect(sheet.xp).toBe(3000);
    expect(sheet.money).toBe(124);
  });
});
