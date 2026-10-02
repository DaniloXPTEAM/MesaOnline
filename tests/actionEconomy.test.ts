import { describe, expect, it } from "vitest";
import { freshTurnResources, spend, turnPlan } from "../src/tactics/engine/actionEconomy";

describe("economia de ações", () => {
  it("gasta movimento antes de converter ação padrão", () => {
    const initial = freshTurnResources();
    const first = spend(initial, turnPlan(initial, "movement"));
    expect(first).toMatchObject({ movement: 0, standard: 1 });
    const second = spend(first, turnPlan(first, "movement"));
    expect(second).toMatchObject({ movement: 0, standard: 0 });
    expect(turnPlan(second, "movement").allowed).toBe(false);
  });

  it("ação completa consome padrão, movimento e completa", () => {
    const result = spend(freshTurnResources(), turnPlan(freshTurnResources(), "full"));
    expect(result).toMatchObject({ standard: 0, movement: 0, full: 0 });
  });
});
