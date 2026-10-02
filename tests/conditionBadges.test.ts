import { describe, expect, it } from "vitest";
import { conditionBadges, hiddenConditionCount } from "../src/game/conditionBadges";

/**
 * O motor de condições da Mesa já era superior ao do VTT antigo; faltava a
 * camada visual (`_renderCondEffects` e as 33 funções `cond*` do legado).
 */
describe("selos de condicao no token", () => {
  it("sem condicoes nao gera selo", () => {
    expect(conditionBadges(undefined)).toEqual([]);
    expect(conditionBadges([])).toEqual([]);
  });

  it("reconhece as condicoes do T20 e classifica o tom", () => {
    const selos = conditionBadges(["Cego", "Envenenado", "Acelerado", "Caído"]);
    expect(selos.map((s) => s.key)).toEqual(["Cego", "Envenenado", "Acelerado", "Caído"]);
    expect(selos.map((s) => s.tone)).toEqual(["control", "danger", "buff", "warn"]);
    expect(selos.every((s) => s.glyph.length > 0)).toBe(true);
  });

  it("casa por texto, nao por igualdade exata", () => {
    const selos = conditionBadges(["está sangrando muito", "em chamas"]);
    expect(selos.map((s) => s.key)).toEqual(["Sangrando", "Queimando"]);
  });

  it("condicao desconhecida ainda vira selo neutro", () => {
    const selos = conditionBadges(["Amaldiçoado por Wynna"]);
    expect(selos).toHaveLength(1);
    expect(selos[0].glyph).toBe("•");
  });

  it("nao repete a mesma condicao", () => {
    expect(conditionBadges(["Cego", "cego", "CEGO"])).toHaveLength(1);
  });

  it("limita os selos e conta o excedente", () => {
    const muitas = ["Cego", "Surdo", "Caído", "Lento", "Confuso", "Exausto"];
    expect(conditionBadges(muitas)).toHaveLength(4);
    expect(hiddenConditionCount(muitas)).toBe(2);
    expect(hiddenConditionCount(["Cego"])).toBe(0);
  });
});
