import { afterEach, describe, expect, it } from "vitest";
import { reachableCells } from "../src/tactics/engine/movement";
import { applyMapTool } from "../src/game/mapTools";
import { addToken, getBoard, removeToken, setTerrain } from "../src/game/vttBridge";
import { makeBoard, makeToken } from "./helpers";

/**
 * Cadeia TERRENO → CUSTO → ALCANCE.
 * O motor já somava terreno difícil e elevação; faltava a porta de entrada.
 * Estes testes provam que pintar pela ferramenta muda o alcance de verdade.
 */
describe("terreno afeta o custo de movimento", () => {
  it("terreno dificil dobra o custo do passo", () => {
    const token = makeToken({ id: "t", gx: 5, gy: 5, movementM: 9 });
    const limpo = makeBoard([token]);
    const dificil = makeBoard([token], {
      map: { ...limpo.map, terrain: { "6,5": { type: "difficult", elevation: 0 } } },
    });
    expect(reachableCells(limpo, token).get("6,5")).toBe(1);
    expect(reachableCells(dificil, token).get("6,5")).toBe(2);
  });

  it("terreno bloqueado impede a passagem", () => {
    const token = makeToken({ id: "t", gx: 5, gy: 5, movementM: 9 });
    const board = makeBoard([token], {
      map: { ...makeBoard([]).map, terrain: { "6,5": { type: "blocked", elevation: 0 } } },
    });
    expect(reachableCells(board, token).has("6,5")).toBe(false);
  });

  it("elevacao cobra o desnivel", () => {
    const token = makeToken({ id: "t", gx: 5, gy: 5, movementM: 9 });
    const plano = makeBoard([token]);
    const alto = makeBoard([token], {
      map: { ...plano.map, terrain: { "6,5": { type: "elevated", elevation: 2 } } },
    });
    expect(reachableCells(plano, token).get("6,5")).toBe(1);
    expect(reachableCells(alto, token).get("6,5")).toBe(3); // 1 de passo + 2 de subida
  });

  it("voar ignora terreno dificil e desnivel", () => {
    const token = makeToken({ id: "t", gx: 5, gy: 5, movementM: 9, flyM: 9 });
    const board = makeBoard([token], {
      map: { ...makeBoard([]).map, terrain: { "6,5": { type: "difficult", elevation: 3 } } },
    });
    expect(reachableCells(board, token, { mode: "fly" }).get("6,5")).toBe(1);
  });
});

describe("a ferramenta de terreno escreve no BOARD", () => {
  afterEach(() => {
    setTerrain(["3,3", "4,4", "3,2"], "normal", 0);
    if (getBoard().tokens.some((t) => t.id === "andarilho")) removeToken("andarilho");
  });

  it("pinta, alterna e apaga a mesma celula", () => {
    applyMapTool({ board: getBoard(), tool: "terrain", brushMode: "add", x: 3, y: 3,
      terrainBrush: { type: "difficult", elevation: 0 } });
    expect(getBoard().map.terrain["3,3"]?.type).toBe("difficult");

    // clicar de novo com o mesmo pincel apaga (alterna)
    applyMapTool({ board: getBoard(), tool: "terrain", brushMode: "add", x: 3, y: 3,
      terrainBrush: { type: "difficult", elevation: 0 } });
    expect(getBoard().map.terrain["3,3"]).toBeUndefined();

    // elevacao entra junto
    applyMapTool({ board: getBoard(), tool: "terrain", brushMode: "add", x: 4, y: 4,
      terrainBrush: { type: "elevated", elevation: 3 } });
    expect(getBoard().map.terrain["4,4"]).toEqual({ type: "elevated", elevation: 3 });
  });

  it("pintar terreno muda o alcance calculado na sequencia", () => {
    const token = addToken(makeToken({ id: "andarilho", gx: 2, gy: 2, movementM: 9 }));
    const antes = reachableCells(getBoard(), token).get("3,2");

    applyMapTool({ board: getBoard(), tool: "terrain", brushMode: "add", x: 3, y: 2,
      terrainBrush: { type: "difficult", elevation: 0 } });
    const depois = reachableCells(getBoard(), token).get("3,2");

    expect(antes).toBe(1);
    expect(depois).toBe(2);
  });
});
