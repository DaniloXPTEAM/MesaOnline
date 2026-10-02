import { describe, expect, it } from "vitest";
import { maxCircleFor } from "../src/tactics/interpretation/castCircle";
import { buildCastInfo, computeCastPlan, findSpellEntry } from "../src/tactics/interpretation/spellCasting";
import type { GameAction } from "../src/game/types";

/** Casos portados de `tests-mesa/spell-effects-tests.json` do ModernRPG-2026-09-23. */
function info(name: string, level: number, cls: string, pm = 50, racial = false) {
  const action = { id: name, sourceId: name, name, category: "spell", kind: "standard" } as unknown as GameAction;
  const entry = findSpellEntry(action)!;
  expect(entry, name).toBeTruthy();
  return buildCastInfo({ action, entry, level, currentPm: pm, candidates: [], maxCircle: maxCircleFor(cls, level, [], entry.circulo), racial });
}

describe("círculo máximo por classe e nível (ModernRPG)", () => {
  it("clérigo: 1º no nv1, 2º no nv5, 3º no nv9", () => {
    expect([1, 4, 5, 8, 9].map((level) => maxCircleFor("Clérigo", level))).toEqual([1, 1, 2, 2, 3]);
  });
  it("bardo ganha o 2º círculo só no nv6; frade tem 3 círculos", () => {
    expect([5, 6].map((level) => maxCircleFor("Bardo", level))).toEqual([1, 2]);
    expect(maxCircleFor("Frade", 20)).toBe(3);
  });
  it("classe fora da tabela usa o maior círculo conhecido, ou o fallback", () => {
    expect(maxCircleFor("Guerreiro", 10, [1, 3, 2])).toBe(3);
    expect(maxCircleFor("Guerreiro", 10, [], 2)).toBe(2);
  });
});

describe("aprimoramentos curados de Bênção", () => {
  const aumenta = (item: ReturnType<typeof info>) => (item.entry.aprimoramentos || []).findIndex((option) => option.tipo === "aumenta" && option.soma);

  it("base +1/+1 e o efeito começa dos bônus do livro", () => {
    const item = info("Bênção", 5, "Clérigo");
    expect(computeCastPlan(item, { counts: {}, racial: false }).mods).toEqual({ attack: 1, damage: 1 });
  });
  it("nv5 (2º círculo): um uso custa 3 PM e dá +2/+2", () => {
    const item = info("Bênção", 5, "Clérigo");
    const plan = computeCastPlan(item, { counts: { [aumenta(item)]: 1 }, racial: false });
    expect(plan.error).toBe("");
    expect(plan.cost).toBe(3);
    expect(plan.mods).toEqual({ attack: 2, damage: 2 });
  });
  it("nv1 recusa (limite de PM e de círculo); nv5 recusa dois usos (+3 passa do 2º círculo)", () => {
    const low = info("Bênção", 1, "Clérigo");
    expect(computeCastPlan(low, { counts: { [aumenta(low)]: 1 }, racial: false }).error).not.toBe("");
    const mid = info("Bênção", 5, "Clérigo");
    expect(computeCastPlan(mid, { counts: { [aumenta(mid)]: 2 }, racial: false }).error).toMatch(/círculo/);
  });
  it("nv9: dois usos custam 5 PM e dão +3/+3", () => {
    const item = info("Bênção", 9, "Clérigo");
    const plan = computeCastPlan(item, { counts: { [aumenta(item)]: 2 }, racial: false });
    expect(plan.error).toBe("");
    expect(plan.cost).toBe(5);
    expect(plan.mods).toEqual({ attack: 3, damage: 3 });
  });
  it("limite de PM por magia é o nível do conjurador", () => {
    const item = info("Bênção", 5, "Clérigo");
    expect(computeCastPlan(item, { counts: { [aumenta(item)]: 2 }, racial: false }).cost).toBe(5);
    const over = computeCastPlan(item, { counts: { [aumenta(item)]: 3 }, racial: false });
    expect(over.cost).toBe(7);
    expect(over.error).not.toBe("");
  });
  it("magia racial usa o círculo da própria magia como máximo", () => {
    const item = info("Bênção", 9, "Clérigo", 50, true);
    expect(item.maxCircle).toBe(item.circle);
    const plan = computeCastPlan(item, { counts: { [aumenta(item)]: 1 }, racial: true });
    expect(plan.error).toMatch(/círculo/);
  });
});
