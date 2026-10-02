import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addToken,
  appendChat,
  getBoard,
  moveTokenToFloor,
  setFogSettings,
  setLighting,
  setObjects,
  setShapes,
  syncBoard,
  updateBoardObject,
  wireStateForPeer,
} from "../src/game/vttBridge";
import { computeVisibility } from "../src/game/vision";
import { floorOf, visibleOnFloor } from "../src/game/floors";
import { polygonCells, tokensInCells, translateGeometry } from "../src/game/shapes";
import { makeBoard, makeToken } from "./helpers";
import type { BoardState } from "../src/game/types";

let previous: BoardState;

beforeEach(() => {
  previous = structuredClone(getBoard());
});

afterEach(() => {
  syncBoard(previous);
});

describe("fog por papel é um recorte autoritativo", () => {
  it("não transmite inimigo, objeto, gatilho, terreno ou sussurro oculto ao peer", () => {
    const mine = makeToken({ id: "fog-mine", gx: 1, gy: 1, controlledBy: "peer-allowed" });
    const hiddenEnemy = makeToken({ id: "fog-hidden", side: "threats", gx: 9, gy: 9, name: "Segredo" });
    addToken(mine);
    addToken(hiddenEnemy);
    setLighting("darknight");
    setFogSettings({ playerFogEnabled: true, darknessRevealedOnlyByLights: true, ownVisionCells: 4 });
    setObjects([{ id: "secret-chest", kind: "chest", name: "Baú secreto", x: 9, y: 9, opened: false, locked: true, contents: ["segredo"] }]);
    setShapes([{ id: "secret-trigger", kind: "trigger", cells: ["9,9"], trigger: { mode: "once", condition: "Cego" } }]);
    appendChat({ author: "Mestre", text: "segredo do mestre", kind: "chat", whisperTo: "outro-peer", whisperFrom: "master" });

    const payload = wireStateForPeer("peer-allowed");
    const board = payload.scenes[0].board;
    expect(payload.scenes).toHaveLength(1);
    expect(board.tokens.map((token) => token.id)).toEqual(["fog-mine"]);
    expect(board.objects).toEqual([]);
    expect(board.shapes).toEqual([]);
    expect(board.chat.some((entry) => entry.text === "segredo do mestre")).toBe(false);
    expect(board.fog).toContain("9,9");
    expect(board.map.terrain["9,9"]).toBeUndefined();
  });
});

describe("andar é estado espacial real", () => {
  it("separa colisão, visão e entidades por andar e persiste a transição", () => {
    const ground = makeToken({ id: "floor-ground", gx: 2, gy: 2, floor: 0 });
    const upper = makeToken({ id: "floor-upper", gx: 2, gy: 2, floor: 1 });
    addToken(ground);
    addToken(upper);
    const moved = moveTokenToFloor("floor-ground", 2);
    expect(floorOf(moved)).toBe(2);
    expect(getBoard().tokens.find((token) => token.id === "floor-ground")?.floor).toBe(2);

    const board = makeBoard([ground, upper], {
      activeFloor: 1,
      objects: [{ id: "upper-object", kind: "item", name: "Chave", x: 3, y: 3, floor: 1, opened: false, locked: false, contents: [] }],
      shapes: [{ id: "upper-shape", kind: "area", cells: ["3,3"], floor: 1 }],
      walls: [{ id: "upper-wall", type: "wall", x1: 4, y1: 0, x2: 4, y2: 10, floor: 1 }],
    });
    const visible = visibleOnFloor(board);
    expect(visible.tokens.map((token) => token.id)).toEqual(["floor-upper"]);
    expect(visible.objects.map((object) => object.id)).toEqual(["upper-object"]);
    expect(visible.shapes.map((shape) => shape.id)).toEqual(["upper-shape"]);

    // Parede em outro andar não intercepta a visão no térreo.
    expect(computeVisibility(board, { gx: 1, gy: 4, floor: 0 }, 6).has("6,4")).toBe(true);
    expect(computeVisibility({ ...board, walls: [{ ...board.walls[0], floor: 0 }] }, { gx: 1, gy: 4, floor: 0 }, 6).has("6,4")).toBe(false);
  });
});

describe("geometria e entidade de objeto", () => {
  it("calcula polígono, desloca a geometria e identifica tokens atingidos", () => {
    const triangle = [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 6 }];
    const cells = polygonCells(triangle);
    expect(cells).toContain("4,3");
    expect(cells).not.toContain("0,0");
    expect(tokensInCells([makeToken({ id: "inside", gx: 4, gy: 3 }), makeToken({ id: "outside", gx: 9, gy: 9 })], cells).map((token) => token.id)).toEqual(["inside"]);
    expect(translateGeometry({ kind: "rect", origin: { x: 1, y: 1 }, to: { x: 2, y: 2 } }, 3, -1)).toMatchObject({ origin: { x: 4, y: 0 }, to: { x: 5, y: 1 } });
  });

  it("objeto tem estado persistente e não troca sua identidade ao editar", () => {
    setObjects([{ id: "object-state", kind: "chest", name: "Baú", x: 2, y: 2, opened: false, locked: false, contents: ["poção"] }]);
    const next = updateBoardObject("object-state", { opened: true, locked: true });
    expect(next).toMatchObject({ id: "object-state", opened: true, locked: true, contents: ["poção"] });
    expect(getBoard().objects[0]).toMatchObject({ id: "object-state", opened: true, locked: true });
  });
});
