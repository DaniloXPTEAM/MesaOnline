import enhancementsJson from "../data/spellEnhancements.json";
import type { BoardToken, GameAction } from "../../game/types";
import { spellKeyOf } from "./spellCasting";

/**
 * Quem cada magia pode escolher como alvo. Fonte: campo `alvo` do registro
 * `ArmadaSpellEffects` (`public/vtt/spell-effects.js`) e `castCandidates` de
 * `armada-tactics.js`, ModernRPG-2026-09-23:
 * - "aliados": mesmo lado, NÃO inclui o conjurador, a menos que `incluiSi`;
 * - "inimigos": lado oposto;
 * - "qualquer": qualquer criatura, inclusive o conjurador;
 * - "si": só o conjurador.
 */
export interface SpellTargetRule {
  lado: "aliados" | "inimigos" | "qualquer" | "si";
  incluiSi?: boolean;
}

const RULES = enhancementsJson as unknown as Record<string, { alvo?: SpellTargetRule }>;

export function spellTargetRule(action: Pick<GameAction, "sourceId" | "name" | "category">): SpellTargetRule | null {
  if (action.category !== "spell") return null;
  return RULES[spellKeyOf(action.sourceId || action.name)]?.alvo || RULES[spellKeyOf(action.name)]?.alvo || null;
}

/** `null` = a magia não tem regra curada (vale a regra genérica do V5). */
export function spellAllowsTarget(action: Pick<GameAction, "sourceId" | "name" | "category">, actor: Pick<BoardToken, "id" | "side">, target: Pick<BoardToken, "id" | "side">): boolean | null {
  const rule = spellTargetRule(action);
  if (!rule) return null;
  if (rule.lado === "si") return actor.id === target.id;
  if (actor.id === target.id) return rule.lado === "qualquer" || rule.incluiSi === true;
  if (rule.lado === "qualquer") return true;
  return rule.lado === "inimigos" ? actor.side !== target.side : actor.side === target.side;
}
