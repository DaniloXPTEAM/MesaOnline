import { beforeEach, describe, expect, it } from "vitest";
import {
  addToken, getBoard, redoBoard, removeToken, setFog, setTerrain, undoBoard, upsertLight,
} from "../src/game/vttBridge";
import { canRedo, canUndo, clearHistory, historySizes } from "../src/game/history";
import { makeToken } from "./helpers";

/**
 * Undo/redo das EDIÇÕES DE CENA do Mestre (Vtt/app.js: 7 funções undo e redo).
 * Eventos de combate ficam de fora por decisão consciente — desfazer uma
 * rolagem já resolvida mudaria o resultado do jogo.
 */
describe("undo / redo de cena", () => {
  beforeEach(() => {
    if (getBoard().tokens.some((t) => t.id === "hist")) removeToken("hist");
    setFog([]);
    clearHistory();
  });

  it("comeca vazio", () => {
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
    expect(undoBoard()).toBe(false);
    expect(redoBoard()).toBe(false);
  });

  it("desfaz e refaz pintura de fog", () => {
    setFog(["1,1", "2,2"]);
    expect(getBoard().fog).toHaveLength(2);
    expect(canUndo()).toBe(true);

    expect(undoBoard()).toBe(true);
    expect(getBoard().fog).toHaveLength(0);
    expect(canRedo()).toBe(true);

    expect(redoBoard()).toBe(true);
    expect(getBoard().fog).toHaveLength(2);
  });

  it("desfaz criacao de token", () => {
    addToken(makeToken({ id: "hist", gx: 4, gy: 4 }));
    expect(getBoard().tokens.some((t) => t.id === "hist")).toBe(true);
    undoBoard();
    expect(getBoard().tokens.some((t) => t.id === "hist")).toBe(false);
  });

  it("desfaz luz e terreno", () => {
    upsertLight({ id: "l-hist", x: 2, y: 2, type: "torch", name: "T", radius: 3, color: "#fff", intensity: 1, enabled: true });
    expect(getBoard().lights.some((l) => l.id === "l-hist")).toBe(true);
    undoBoard();
    expect(getBoard().lights.some((l) => l.id === "l-hist")).toBe(false);

    setTerrain(["7,7"], "difficult");
    expect(getBoard().map.terrain["7,7"]).toBeTruthy();
    undoBoard();
    expect(getBoard().map.terrain["7,7"]).toBeFalsy();
  });

  it("uma nova edicao limpa a pilha de refazer", () => {
    setFog(["1,1"]);
    undoBoard();
    expect(canRedo()).toBe(true);
    setFog(["3,3"]);
    expect(canRedo()).toBe(false);
  });

  it("varios passos voltam em ordem inversa", () => {
    setFog(["1,1"]);
    setFog(["1,1", "2,2"]);
    setFog(["1,1", "2,2", "3,3"]);
    expect(getBoard().fog).toHaveLength(3);
    undoBoard(); expect(getBoard().fog).toHaveLength(2);
    undoBoard(); expect(getBoard().fog).toHaveLength(1);
    undoBoard(); expect(getBoard().fog).toHaveLength(0);
  });

  it("mantém a sequência A → B → undo → undo → redo → redo consistente", () => {
    setFog(["1,1"]); // A
    setFog(["1,1", "2,2"]); // B
    expect(getBoard().fog).toEqual(["1,1", "2,2"]);
    expect(undoBoard()).toBe(true);
    expect(getBoard().fog).toEqual(["1,1"]);
    expect(undoBoard()).toBe(true);
    expect(getBoard().fog).toEqual([]);
    expect(redoBoard()).toBe(true);
    expect(getBoard().fog).toEqual(["1,1"]);
    expect(redoBoard()).toBe(true);
    expect(getBoard().fog).toEqual(["1,1", "2,2"]);
  });

  it("a pilha tem teto e nao cresce sem limite", () => {
    for (let i = 0; i < 45; i += 1) setFog([`${i},0`]);
    expect(historySizes().undo).toBeLessThanOrEqual(30);
  });
});
