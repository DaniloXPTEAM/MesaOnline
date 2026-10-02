import { describe, expect, it } from "vitest";
import { classifyDuration, classifyExecution, classifyRange, classifySpellEffect, damageTypesMatch, damageTypesOf, spellDamageType } from "../src/tactics/interpretation/spellClassification";

describe("tipo de dano", () => {
  it("reconhece físicos, elementais e tipos combinados", () => {
    expect(damageTypesOf("Corte/Perfuração")).toEqual(["Corte", "Perfuração"]);
    expect(damageTypesOf("Impacto e Perfuração")).toEqual(["Perfuração", "Impacto"]);
    expect(damageTypesOf("Fogo")).toEqual(["Fogo"]);
    expect(damageTypesOf("—")).toEqual([]);
  });
  it("lê o tipo de dano do texto da magia", () => {
    expect(spellDamageType("causa 4d6 pontos de dano de fogo")).toBe("Fogo");
    expect(spellDamageType("2d8 de frio")).toBe("Frio");
    expect(spellDamageType("apenas descrição")).toBeUndefined();
  });
  it("RD com tipo só reduz dano desse tipo; RD sem tipo reduz tudo", () => {
    expect(damageTypesMatch("Fogo", "Fogo")).toBe(true);
    expect(damageTypesMatch("Fogo", "Frio")).toBe(false);
    expect(damageTypesMatch("Corte", "Corte/Perfuração")).toBe(true);
    expect(damageTypesMatch(undefined, "Frio")).toBe(true);
    expect(damageTypesMatch("Fogo", "Físico")).toBe(false);
    expect(damageTypesMatch("Fogo", undefined)).toBe(false);
    expect(damageTypesMatch("Corte", "Fogo")).toBe(false);
  });
});

describe("alcance, execução e duração", () => {
  it("alcance curto 9 m, médio 30 m, longo 90 m", () => {
    expect(classifyRange("Curto")).toEqual({ categoria: "curto", metros: 9 });
    expect(classifyRange("Médio")).toEqual({ categoria: "medio", metros: 30 });
    expect(classifyRange("Longo")).toEqual({ categoria: "longo", metros: 90 });
    expect(classifyRange("Pessoal")).toEqual({ categoria: "pessoal", metros: 0 });
    expect(classifyRange("Toque").metros).toBe(1.5);
  });
  it("execução: padrão, completa, movimento, livre, reação e prolongada", () => {
    expect(classifyExecution("Ação padrão").kind).toBe("standard");
    expect(classifyExecution("Completa").kind).toBe("full");
    expect(classifyExecution("Movimento").kind).toBe("movement");
    expect(classifyExecution("Livre").kind).toBe("free");
    expect(classifyExecution("Reação").kind).toBe("reaction");
    expect(classifyExecution("10 minutos").prolongada).toBe("10 minutos");
  });
  it("duração: instantânea, rodadas, cena, sustentada, longa", () => {
    expect(classifyDuration("Instantânea").tipo).toBe("instantanea");
    expect(classifyDuration("1 rodada")).toEqual({ tipo: "rodadas", rodadas: 1 });
    expect(classifyDuration("1 turno")).toEqual({ tipo: "rodadas", rodadas: 1 });
    expect(classifyDuration("1d4 rodadas").tipo).toBe("rodadas");
    expect(classifyDuration("Cena").tipo).toBe("cena");
    expect(classifyDuration("Sustentada").tipo).toBe("sustentada");
    expect(classifyDuration("1 semana ou até ser descarregada").tipo).toBe("longa");
  });
});

describe("natureza da magia", () => {
  it("dano, cura, buff, invocação e utilitário", () => {
    expect(classifySpellEffect({ name: "Bola de Fogo", description: "causa 6d6 de dano de fogo" })).toBe("damage");
    expect(classifySpellEffect({ name: "Curar Ferimentos", description: "cura 2d8 pontos de vida" })).toBe("heal");
    expect(classifySpellEffect({ name: "Bênção", description: "aliados recebem bônus" })).toBe("buff");
    expect(classifySpellEffect({ name: "Luz", description: "ilumina a área" })).toBe("text");
  });
});

describe("RD e resistência por tipo no dano recebido", () => {
  it("RD 5 a corte e resistência a fogo 15 só valem contra o próprio tipo", async () => {
    const { mitigateDamage } = await import("../src/tactics/engine/reactiveTriggers");
    const { makeToken } = await import("./helpers");
    const guard = makeToken({ id: "rd-teste", effects: [
      { id: "rd-corte", name: "RD 5 a corte", kind: "scene", damageType: "Corte", mods: { rd: 5 } },
      { id: "res-fogo", name: "Resistência a fogo 15", kind: "scene", damageType: "Fogo", mods: { rd: 15 } },
      { id: "rd-geral", name: "RD 2", kind: "scene", mods: { rd: 2 } },
    ] });
    expect(mitigateDamage(guard, 20, "Corte").amount).toBe(13);
    expect(mitigateDamage(guard, 20, "Fogo").amount).toBe(3);
    expect(mitigateDamage(guard, 20, "Impacto").amount).toBe(18);
    expect(mitigateDamage(guard, 20, undefined).amount).toBe(18);
  });
});
