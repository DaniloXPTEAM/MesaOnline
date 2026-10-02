import { describe, expect, it } from "vitest";
import { resolveSave } from "../src/tactics/engine/saves";
import { makeToken } from "./helpers";

describe("resistências T20", () => {
  const token = makeToken({ fortitude: 8, reflexes: 5, will: 3 });

  it.each([
    ["fortitude", "Fortitude", 8],
    ["reflexes", "Reflexos", 5],
    ["will", "Vontade", 3],
  ] as const)("resolve %s usando o modificador correto", (type, label, modifier) => {
    const result = resolveSave({ target: token, type, dc: 15, roll: () => 10 });
    expect(result.label).toBe(label);
    expect(result.modifier).toBe(modifier);
    expect(result.total).toBe(10 + modifier);
    expect(result.passed).toBe(10 + modifier >= 15);
  });

  it("trata natural 1 como falha e natural 20 como sucesso", () => {
    expect(resolveSave({ target: token, type: "fortitude", dc: 1, roll: () => 1 }).passed).toBe(false);
    expect(resolveSave({ target: token, type: "will", dc: 99, roll: () => 20 }).passed).toBe(true);
  });
});
