import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAction } from "./helpers";

describe("ameaças personalizadas persistentes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("cria, persiste e remove por hidden sem deslocar o catálogo", async () => {
    const { addCustomThreat, getThreat, removeCustomThreat, CUSTOM_THREATS_STORAGE_KEY } = await import("../src/tactics/engine/customThreats");
    const created = addCustomThreat({
      name: "Criatura de Teste", title: "Monstro · ND 2", symbol: "CT", pv: 22, pm: 4,
      defense: 17, initiative: 3, luta: 7, pontaria: 0, damage: "1d8+3", crit: 20,
      critMultiplier: 2, attackType: "melee", rangeM: 1.5, movementM: 9, level: 2,
      spellDC: 14, actions: [], customActions: [makeAction()], fortitude: 5, reflexes: 2, will: 3,
      portrait: "data:image/png;base64,AA==",
    });

    expect(getThreat(created.id)?.custom).toBe(true);
    expect(JSON.parse(localStorage.getItem(CUSTOM_THREATS_STORAGE_KEY) || "[]")).toHaveLength(1);

    removeCustomThreat(created.id);
    expect(getThreat(created.id)?.hidden).toBe(true);
    expect(JSON.parse(localStorage.getItem(CUSTOM_THREATS_STORAGE_KEY) || "[]")[0].hidden).toBe(true);
  });
});
