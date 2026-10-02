import { conditionMods } from "../../game/conditionEffects";
import type { BoardToken, SaveOutcome, SaveType } from "../../game/types";

export interface SaveRequest {
  target: BoardToken;
  type: SaveType;
  dc: number;
  halfOnSave?: boolean;
  partialOnSave?: boolean;
  roll?: () => number;
}

export interface SaveResolution {
  type: SaveType;
  label: "Fortitude" | "Reflexos" | "Vontade";
  natural: number;
  modifier: number;
  total: number;
  dc: number;
  passed: boolean;
  outcome: SaveOutcome;
}

export function saveModifier(token: BoardToken, type: SaveType): number {
  if (type === "fortitude") return token.fortitude;
  if (type === "reflexes") return token.reflexes + conditionMods(token.conditions).reflexes;
  return token.will;
}

export function saveLabel(type: SaveType): SaveResolution["label"] {
  return type === "fortitude" ? "Fortitude" : type === "reflexes" ? "Reflexos" : "Vontade";
}

export function resolveSave(request: SaveRequest): SaveResolution {
  const natural = (request.roll || (() => Math.floor(Math.random() * 20) + 1))();
  const modifier = saveModifier(request.target, request.type);
  const total = natural + modifier;
  // Indefeso (e Paralisado) falham automaticamente em Reflexos.
  const autoFail = request.type === "reflexes" && conditionMods(request.target.conditions).failReflexes;
  const passed = !autoFail && (natural === 20 || (natural !== 1 && total >= request.dc));
  const outcome: SaveOutcome = !passed ? "failure" : request.halfOnSave ? "half" : request.partialOnSave ? "partial" : "negates";
  return { type: request.type, label: saveLabel(request.type), natural, modifier, total, dc: request.dc, passed, outcome };
}

/** API equivalente ao antigo ArmadaSaves. */
export const ArmadaSaves = {
  modifier: saveModifier,
  resolve: resolveSave,
};
