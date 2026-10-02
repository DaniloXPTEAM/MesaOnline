import { describe, expect, it } from "vitest";
import { spellAllowsTarget } from "../src/tactics/interpretation/spellTargeting";

const spell = (name: string) => ({ name, sourceId: name, category: "spell" as const });
const caster = { id: "a", side: "heroes" as const };
const ally = { id: "b", side: "heroes" as const };
const foe = { id: "c", side: "threats" as const };

/** Regras de alvo do registro `ArmadaSpellEffects` (ModernRPG-2026-09-23). */
describe("diferenciação de alvo por magia (ModernRPG)", () => {
  it("Bênção: só aliados, sem o conjurador", () => {
    expect(spellAllowsTarget(spell("Bênção"), caster, ally)).toBe(true);
    expect(spellAllowsTarget(spell("Bênção"), caster, caster)).toBe(false);
    expect(spellAllowsTarget(spell("Bênção"), caster, foe)).toBe(false);
  });
  it("Perdição e Hipnotismo: só inimigos", () => {
    expect(spellAllowsTarget(spell("Perdição"), caster, foe)).toBe(true);
    expect(spellAllowsTarget(spell("Hipnotismo"), caster, ally)).toBe(false);
  });
  it("Escudo da Fé: aliados, incluindo o conjurador", () => {
    expect(spellAllowsTarget(spell("Escudo da Fé"), caster, caster)).toBe(true);
    expect(spellAllowsTarget(spell("Escudo da Fé"), caster, foe)).toBe(false);
  });
  it("Santuário: qualquer criatura; Armadura Arcana: só o conjurador", () => {
    expect(spellAllowsTarget(spell("Santuário"), caster, foe)).toBe(true);
    expect(spellAllowsTarget(spell("Armadura Arcana"), caster, caster)).toBe(true);
    expect(spellAllowsTarget(spell("Armadura Arcana"), caster, ally)).toBe(false);
  });
  it("magia sem regra curada devolve null (vale a regra genérica)", () => {
    expect(spellAllowsTarget(spell("Bola de Fogo"), caster, foe)).toBeNull();
  });
});
