import { describe, expect, it } from "vitest";
import { makeAction, makeToken } from "./helpers";
import {
  buildCastInfo, computeCastPlan, findSpellEntry, normalizeAugments, sanitizeAugmentChoice,
} from "../src/tactics/interpretation/spellCasting";

function infoFor(spellName: string, sourceId: string, level: number, pm: number) {
  const action = makeAction({
    id: `character:spell:${sourceId}`, sourceId, name: spellName, category: "spell",
    effect: "damage", target: "enemy", pmCost: 1, rangeM: 9, attackSkill: undefined, damage: undefined, color: "arcane",
  });
  const entry = findSpellEntry(action)!;
  return buildCastInfo({ action, entry, level, currentPm: pm, candidates: [] });
}

describe("conjuração com aprimoramentos", () => {
  it("encontra a magia oficial pelo sourceId e pelo nome", () => {
    const byId = findSpellEntry(makeAction({ category: "spell", sourceId: "bola-de-fogo", name: "qualquer" }));
    const byName = findSpellEntry(makeAction({ category: "spell", sourceId: "", name: "Bola de Fogo" }));
    expect(byId?.nome).toBe("Bola de Fogo");
    expect(byName?.id).toBe("bola-de-fogo");
  });

  it("não inventa magia para ação que não é do catálogo", () => {
    expect(findSpellEntry(makeAction({ category: "spell", sourceId: "homebrew-x", name: "Raio Caseiro" }))).toBeNull();
    expect(findSpellEntry(makeAction({ category: "weapon", sourceId: "bola-de-fogo", name: "Bola de Fogo" }))).toBeNull();
  });

  it("marca como manual todo aprimoramento que o motor não sabe aplicar", () => {
    const entry = findSpellEntry(makeAction({ category: "spell", sourceId: "abencoar-alimentos", name: "Abençoar Alimentos" }))!;
    const augments = normalizeAugments(entry);
    const alvos = augments.find((option) => /n[úu]mero de alvos/i.test(option.rotulo))!;
    const muda = augments.find((option) => option.tipo === "muda")!;
    expect(alvos.manual).toBe(false);
    expect(alvos.extraTargets).toBe(1);
    expect(muda.manual).toBe(true);
  });

  it("soma o custo dos aprimoramentos escolhidos", () => {
    const info = infoFor("Abençoar Alimentos", "abencoar-alimentos", 10, 20);
    const base = computeCastPlan(info, { counts: {}, racial: false });
    const comDois = computeCastPlan(info, { counts: { 0: 2 }, racial: false });
    expect(base.cost).toBe(info.baseCost);
    expect(comDois.cost).toBe(info.baseCost + 2);
    expect(comDois.maxTargets).toBe(base.maxTargets + 2);
    expect(comDois.error).toBe("");
  });

  it("aprimoramento que não é 'aumenta' conta uma vez só", () => {
    const info = infoFor("Abençoar Alimentos", "abencoar-alimentos", 10, 20);
    const umaVez = computeCastPlan(info, { counts: { 1: 1 }, racial: false });
    const dezVezes = computeCastPlan(info, { counts: { 1: 10 }, racial: false });
    expect(dezVezes.cost).toBe(umaVez.cost);
    expect(dezVezes.manualNotes.length).toBe(1);
  });

  it("respeita o limite de PM por magia igual ao nível do conjurador", () => {
    const info = infoFor("Abençoar Alimentos", "abencoar-alimentos", 2, 50);
    const plan = computeCastPlan(info, { counts: { 0: 5 }, racial: false });
    expect(plan.cost).toBeGreaterThan(2);
    expect(plan.error).toMatch(/Limite de PM/);
  });

  it("recusa quando faltam PM", () => {
    const info = infoFor("Abençoar Alimentos", "abencoar-alimentos", 10, 1);
    const plan = computeCastPlan(info, { counts: { 0: 3 }, racial: false });
    expect(plan.error).toMatch(/PM insuficientes/);
  });

  it("sanitiza escolha vinda da rede", () => {
    const dirty = sanitizeAugmentChoice({ counts: { "0": 2, "1": -5, "999": 3, abc: 4, "2": 1e9 }, racial: "sim" });
    expect(dirty.counts).toEqual({ 0: 2, 2: 99 });
    expect(dirty.racial).toBe(false);
    expect(sanitizeAugmentChoice(null)).toEqual({ counts: {}, racial: false });
  });
});

describe("autoridade do Mestre sobre o custo aprimorado", () => {
  it("recalcula o custo em vez de confiar no cliente", async () => {
    const bridge = await import("../src/game/vttBridge");
    const { executeTacticalAction } = await import("../src/tactics/engine/runtimeCommands");
    localStorage.clear();

    const info = infoFor("Abençoar Alimentos", "abencoar-alimentos", 10, 20);
    const caster = makeToken({
      id: "caster-aprimora", name: "Clériga", pm: 20, pmMax: 20, level: 10,
      tacticalActions: [makeAction({
        id: info.actionId, sourceId: "abencoar-alimentos", name: "Abençoar Alimentos", category: "spell",
        effect: "heal", target: "ally", pmCost: info.baseCost, rangeM: 9, attackSkill: undefined, damage: undefined, color: "gold",
      })],
    });
    const ally = makeToken({ id: "ally-aprimora", name: "Aliado", gx: 2, gy: 1 });
    bridge.addToken(caster);
    bridge.addToken(ally);
    bridge.startCombat();
    bridge.selectToken(caster.id);
    // O combate precisa estar no turno da conjuradora.
    while (bridge.getCombatState().activeTokenId !== caster.id) bridge.endTurn();

    const pmAntes = bridge.getBoard().tokens.find((token) => token.id === caster.id)!.pm;
    executeTacticalAction(caster.id, info.actionId, [ally.id], null, { counts: { 0: 2 }, racial: false });
    const pmDepois = bridge.getBoard().tokens.find((token) => token.id === caster.id)!.pm;

    // Base + 2 usos de "+1 PM: aumenta o número de alvos em +1".
    expect(pmAntes - pmDepois).toBe(info.baseCost + 2);
  });
});
