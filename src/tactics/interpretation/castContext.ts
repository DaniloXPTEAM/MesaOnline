import type { BoardToken } from "../../game/types";
import { getModernRpgCharacter } from "../../integration/modernRpgCharacterBridge";
import { maxCircleFor } from "./castCircle";

/**
 * Contexto de conjuração do token (lógica do `castContext` de `armada-tactics.js`,
 * ModernRPG-2026-09-23): círculo máximo pela classe da ficha oficial e magia racial
 * marcada no token. Token sem ficha (ameaça do bestiário) usa o círculo da própria magia.
 */
export function castCircleContext(token: BoardToken, spellCircle: number): { maxCircle: number } {
  const sheet = token.modernRpgCharacterId ? getModernRpgCharacter(token.modernRpgCharacterId) : null;
  if (!sheet) return { maxCircle: Math.max(1, spellCircle) };
  const known = (sheet.spells || []).map((spell) => spell.circle);
  return { maxCircle: maxCircleFor(sheet.class, token.level || sheet.level || 1, known, spellCircle) };
}

/** A magia foi marcada como racial neste token? (persistido em `tacticsRacial`, chave = nome normalizado). */
export function isRacialSpell(token: BoardToken, spellKey: string): boolean {
  return Boolean(token.tacticsRacial?.includes(spellKey));
}
