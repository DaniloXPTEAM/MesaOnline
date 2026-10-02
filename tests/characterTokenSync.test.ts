import { beforeEach, describe, expect, it } from "vitest";
import { getCharacterSheetById, saveCharacterSheets } from "../ficha-modernrpg/characterRoute";
import { boardTokenFromCharacter, characterForToken } from "../src/integration/modernRpgCharacterBridge";
import { persistTokenVitalsToSheet, refreshTokenFromSheet } from "../src/integration/tokenVitalsSync";
import { makeSheet } from "./helpers";

describe("CharacterSheet.id ↔ modernRpgCharacterId e vitais", () => {
  beforeEach(() => localStorage.clear());

  it("vincula exclusivamente pelo CharacterSheet.id", () => {
    const sheet = makeSheet({ id: "char-official-42" });
    saveCharacterSheets([sheet]);
    const token = boardTokenFromCharacter(sheet, { x: 3, y: 4 });

    expect(token.modernRpgCharacterId).toBe(sheet.id);
    expect(characterForToken(token)?.id).toBe(sheet.id);
    expect(token.gx).toBe(3);
    expect(token.gy).toBe(4);
  });

  it("sincroniza PV e PM token → ficha e ficha → token", () => {
    const sheet = makeSheet({ id: "char-vitals", hp: { current: 30, max: 40 }, mp: { current: 15, max: 20 } });
    saveCharacterSheets([sheet]);
    const token = boardTokenFromCharacter(sheet);

    persistTokenVitalsToSheet({ ...token, hp: 11, pm: 6, conditions: ["Caído"] });
    const persisted = getCharacterSheetById(sheet.id)!;
    expect(persisted.hp).toMatchObject({ current: 11, max: 40 });
    expect(persisted.mp).toMatchObject({ current: 6, max: 20 });
    expect(persisted.conditions).toEqual(["Caído"]);

    saveCharacterSheets([{ ...persisted, hp: { current: 24, max: 45 }, mp: { current: 9, max: 22 } }]);
    const refreshed = refreshTokenFromSheet({ ...token, gx: 7, gy: 8 });
    expect(refreshed.hp).toBe(24);
    expect(refreshed.hpMax).toBe(45);
    expect(refreshed.pm).toBe(9);
    expect(refreshed.pmMax).toBe(22);
    expect([refreshed.gx, refreshed.gy]).toEqual([7, 8]);
  });
});
