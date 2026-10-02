import { describe, expect, it } from "vitest";
import { applyTriggerOutcomes, evaluateTriggers, TRIGGER_CONDITIONS } from "../src/game/triggers";
import type { BoardShape } from "../src/game/types";
import { makeBoard, makeToken } from "./helpers";

const armadilha = (over: Partial<BoardShape> = {}): BoardShape => ({
  id: "trap", kind: "trigger", cells: ["4,4", "4,5"],
  trigger: { mode: "once", condition: "Atordoado" }, ...over,
});

describe("gatilhos executam de verdade", () => {
  it("armadilha dispara ao entrar e aplica a condicao", () => {
    const token = makeToken({ id: "h", gx: 3, gy: 4, name: "Heroína" });
    const board = makeBoard([token], { shapes: [armadilha()] });
    const plano = evaluateTriggers(board, token, { x: 4, y: 4 });
    expect(plano).toHaveLength(1);
    expect(plano[0]).toMatchObject({ action: "apply", condition: "Atordoado", mode: "once" });
    const { token: depois, shapes } = applyTriggerOutcomes(token, board.shapes, plano);
    expect(depois.conditions).toContain("Atordoado");
    expect(shapes[0].trigger?.triggered).toBe(true);
    expect(shapes[0].trigger?.appliedTokens).toContain("h");
  });

  it("armadilha 'uma vez' nao dispara de novo", () => {
    const token = makeToken({ id: "h", gx: 3, gy: 4 });
    const usada = armadilha({ trigger: { mode: "once", condition: "Atordoado", triggered: true } });
    const board = makeBoard([token], { shapes: [usada] });
    expect(evaluateTriggers(board, token, { x: 4, y: 4 })).toHaveLength(0);
  });

  it("nao dispara fora da area", () => {
    const token = makeToken({ id: "h", gx: 0, gy: 0 });
    const board = makeBoard([token], { shapes: [armadilha()] });
    expect(evaluateTriggers(board, token, { x: 9, y: 9 })).toHaveLength(0);
  });

  it("modo continuo aplica ao entrar e remove ao sair", () => {
    const token = makeToken({ id: "h", gx: 3, gy: 4, name: "Heroína" });
    const nevoa = armadilha({ id: "fog-area", trigger: { mode: "continuous", condition: "Ofuscado" } });
    const board = makeBoard([token], { shapes: [nevoa] });

    const entrando = evaluateTriggers(board, token, { x: 4, y: 4 });
    expect(entrando[0]).toMatchObject({ action: "apply", mode: "continuous" });
    const dentro = applyTriggerOutcomes(token, board.shapes, entrando);
    expect(dentro.token.conditions).toContain("Ofuscado");

    const boardDentro = makeBoard([dentro.token], { shapes: dentro.shapes });
    const saindo = evaluateTriggers(boardDentro, dentro.token, { x: 9, y: 9 });
    expect(saindo[0]).toMatchObject({ action: "remove", condition: "Ofuscado" });
    const fora = applyTriggerOutcomes(dentro.token, dentro.shapes, saindo);
    expect(fora.token.conditions).not.toContain("Ofuscado");
  });

  it("aura contínua não remove condição ao sair de apenas uma entre áreas sobrepostas", () => {
    const token = makeToken({ id: "h", gx: 4, gy: 4, conditions: ["Lento"] });
    const first = armadilha({ id: "first", cells: ["4,4"], trigger: { mode: "continuous", condition: "Lento", appliedTokens: ["h"] } });
    const second = armadilha({ id: "second", cells: ["5,4"], trigger: { mode: "continuous", condition: "Lento", appliedTokens: ["h"] } });
    const board = makeBoard([token], { shapes: [first, second] });
    expect(evaluateTriggers(board, token, { x: 5, y: 4 }).filter((entry) => entry.action === "remove")).toEqual([]);
    const leavingBoth = evaluateTriggers(board, token, { x: 9, y: 9 });
    expect(leavingBoth.filter((entry) => entry.action === "remove")).toHaveLength(1);
  });

  it("gatilho de outro andar não afeta o token", () => {
    const token = makeToken({ id: "h", gx: 3, gy: 4, floor: 0 });
    const outroAndar = armadilha({ floor: 1 });
    expect(evaluateTriggers(makeBoard([token], { shapes: [outroAndar] }), token, { x: 4, y: 4 })).toEqual([]);
  });

  it("area comum (kind area) nao dispara nada", () => {
    const token = makeToken({ id: "h", gx: 3, gy: 4 });
    const board = makeBoard([token], { shapes: [{ id: "a", kind: "area", cells: ["4,4"] }] });
    expect(evaluateTriggers(board, token, { x: 4, y: 4 })).toHaveLength(0);
  });

  it("oferece condicoes do T20 para configurar", () => {
    expect(TRIGGER_CONDITIONS).toContain("Atordoado");
    expect(TRIGGER_CONDITIONS.length).toBeGreaterThan(8);
  });
});
