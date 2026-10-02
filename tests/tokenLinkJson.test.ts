import { beforeEach, describe, expect, it, vi } from "vitest";
import kaleb from "./fixtures/kaleb-heroi-pdf.json";

beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("vínculo do token a JSON e a objeto da cena", () => {
  it("JSON de ameaça vira ameaça própria do catálogo, com a imagem do token", async () => {
    const { linkFromJson } = await import("../src/game/tokenJson");
    const { getThreat } = await import("../src/tactics/engine/customThreats");
    const link = linkFromJson({ nome: "Lobo das Brumas", tipo: "Animal", nd: "2", pv: 24, defesa: 17, dano: "1d8+3" }, "data:image/png;base64,AAAA");
    expect(link).toMatchObject({ kind: "threat", label: "Lobo das Brumas" });
    const threat = getThreat(link.id)!;
    expect(threat).toMatchObject({ name: "Lobo das Brumas", pv: 24, defense: 17, custom: true, portrait: "data:image/png;base64,AAAA" });
    expect(threat.customActions?.length).toBe(1);
  });

  it("JSON de herói entra na lista de fichas e o vínculo aponta para ela", async () => {
    const { linkFromJson } = await import("../src/game/tokenJson");
    const { loadCharacterSheets } = await import("../ficha-modernrpg/characterRoute");
    const link = linkFromJson(kaleb, "");
    expect(link.kind).toBe("character");
    expect(loadCharacterSheets().some((sheet) => sheet.id === link.id)).toBe(true);
  });

  it("JSON que não é herói nem ameaça é recusado com explicação", async () => {
    const { linkFromJson } = await import("../src/game/tokenJson");
    expect(() => linkFromJson({ qualquer: "coisa" }, "")).toThrow(/Não reconheci/);
    expect(() => linkFromJson([1, 2], "")).toThrow(/objeto/);
  });

  it("posição livre de objeto evita casas ocupadas e fica dentro do mapa", async () => {
    const { freeObjectSpot, newBoardObject } = await import("../src/game/objectPlacement");
    const board = { map: { cols: 3, rows: 3 }, objects: [newBoardObject("chest", 0, { x: 2, y: 1 })] } as never;
    const spot = freeObjectSpot(board, 0, { x: 1, y: 1 });
    expect(spot).not.toEqual({ x: 2, y: 1 });
    expect(spot.x).toBeGreaterThanOrEqual(0);
    expect(spot.x).toBeLessThan(3);
    const object = newBoardObject("treasure", 0, spot, "Tesouro do dragão", "data:image/png;base64,AAAA");
    expect(object).toMatchObject({ kind: "treasure", name: "Tesouro do dragão", image: "data:image/png;base64,AAAA", locked: false });
  });
});
