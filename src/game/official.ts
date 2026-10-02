/** Compatibilidade: implementação oficial vive em integration/. */
import type { CharacterSheet } from "../../ficha-modernrpg/sheet";
import type { BoardToken, TacticalUnitView } from "./types";
import { getCharacterSheetById, loadCharacterSheets } from "../../ficha-modernrpg/characterRoute";
import {
  boardTokenFromCharacter,
  sheetDefense,
  tacticalViewForToken,
} from "../integration/modernRpgCharacterBridge";
import { actionsForCharacter } from "../tactics/interpretation/characterActionAdapter";
import { persistTokenVitalsToSheet } from "../integration/tokenVitalsSync";

export const sheetToActions = actionsForCharacter;
export { getCharacterSheetById, loadCharacterSheets, sheetDefense };

export function sheetToToken(sheet: CharacterSheet, at?: { x: number; y: number }, existing?: BoardToken) {
  return boardTokenFromCharacter(sheet, at, existing);
}

/** @deprecated Projeção visual, não personagem persistente. */
export function sheetToUnit(sheet: CharacterSheet, at?: { x: number; y: number }): TacticalUnitView {
  return tacticalViewForToken(boardTokenFromCharacter(sheet, at));
}

export function persistUnitVitals(characterId: string, pv: number, pm: number) {
  const sheet = getCharacterSheetById(characterId);
  if (!sheet) return;
  persistTokenVitalsToSheet(boardTokenFromCharacter({ ...sheet, hp: { ...sheet.hp, current: pv }, mp: { ...sheet.mp, current: pm } }));
}

export function onOfficialChange(callback: () => void): () => void {
  window.addEventListener("modernrpg-characters-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("modernrpg-characters-changed", callback);
    window.removeEventListener("storage", callback);
  };
}
