import { describe, expect, it } from "vitest";
import type { BoardState, BoardToken } from "../src/game/types";
import { reachableCells } from "../src/tactics/engine/movement";

const token: BoardToken = {
  id: "hero", name: "Herói", title: "Guerreiro", side: "heroes", gx: 1, gy: 1, symbol: "H", accent: "#fff",
  hp: 20, hpMax: 20, pm: 5, pmMax: 5, defense: 15, initiative: 2, initiativeRoll: 0, luta: 5, pontaria: 2,
  damage: "1d6", crit: 20, critMultiplier: 2, attackType: "melee", rangeM: 1.5, movementM: 3,
  level: 1, spellDC: 12, actionIds: [], fortitude: 3, reflexes: 2, will: 1,
};

function board(): BoardState {
  return { id: "board", map: { id: "map", name: "Teste", location: "", image: "", cols: 5, rows: 5, terrain: { "2,1": { type: "difficult", elevation: 0 } } }, tokens: [token], walls: [], lights: [], shapes: [], objects: [], fog: [], explored: [], weather: "clear", chat: [], selectedTokenIds: [], targetedTokenIds: [], revision: 1 };
}

describe("movement T20", () => {
  it("cobra custo dobrado por terreno difícil", () => {
    const reachable = reachableCells(board(), token);
    expect(reachable.get("2,1")).toBe(2);
  });

  it("porta fechada bloqueia e aberta permite passagem", () => {
    const closed = board();
    closed.walls.push({ id: "door", type: "door", x1: 2, y1: 1, x2: 2, y2: 2, open: false });
    expect(reachableCells(closed, token).has("2,1")).toBe(false);
    closed.walls[0].open = true;
    expect(reachableCells(closed, token).has("2,1")).toBe(true);
  });

  it("aliado pode ser atravessado, mas ninguem termina sobre ele; inimigo bloqueia", () => {
    const ally: BoardToken = { ...token, id: "ally", gx: 1, gy: 2 };
    const withAlly = board();
    withAlly.tokens.push(ally);
    const throughAlly = reachableCells(withAlly, token);
    expect(throughAlly.has("1,2")).toBe(false); // nao pode parar na casa do aliado
    expect(throughAlly.has("1,3")).toBe(true); // mas passa por ele (2 casas)

    const withEnemy = board();
    withEnemy.tokens.push({ ...token, id: "foe", side: "threats", gx: 1, gy: 2 });
    const blocked = reachableCells(withEnemy, token);
    expect(blocked.has("1,2")).toBe(false);
    expect(blocked.has("1,3")).toBe(false); // inimigo nao pode ser atravessado
  });
});
