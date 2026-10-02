import type { ActionKind, CombatState, TurnResources } from "../../game/types";
import { conditionMods } from "../../game/conditionEffects";
import { getBoard, getCombatState, syncCombat } from "../../game/vttBridge";

export function freshTurnResources(): TurnResources {
  return { standard: 1, movement: 1, full: 1, free: 99, reaction: 1 };
}

export interface TurnPlan {
  allowed: boolean;
  reason?: string;
  spend: Partial<TurnResources>;
}

/** Algoritmo turnPlan extraído do motor 23/09, sem dependência de DOM. */
export function turnPlan(resources: TurnResources, kind: ActionKind): TurnPlan {
  if (kind === "free") return resources.free > 0 ? { allowed: true, spend: { free: 1 } } : { allowed: false, reason: "Sem ações livres disponíveis.", spend: {} };
  if (kind === "reaction") return resources.reaction > 0 ? { allowed: true, spend: { reaction: 1 } } : { allowed: false, reason: "A reação desta rodada já foi usada.", spend: {} };
  if (kind === "full") {
    return resources.full > 0 && resources.standard > 0 && resources.movement > 0
      ? { allowed: true, spend: { full: 1, standard: 1, movement: 1 } }
      : { allowed: false, reason: "Ação completa exige as ações padrão e de movimento.", spend: {} };
  }
  if (kind === "movement") {
    if (resources.movement > 0) return { allowed: true, spend: { movement: 1 } };
    if (resources.standard > 0) return { allowed: true, spend: { standard: 1 } };
    return { allowed: false, reason: "Sem ação de movimento ou padrão disponível.", spend: {} };
  }
  return resources.standard > 0
    ? { allowed: true, spend: { standard: 1 } }
    : { allowed: false, reason: "A ação padrão já foi usada.", spend: {} };
}

export function spend(resources: TurnResources, plan: TurnPlan): TurnResources {
  if (!plan.allowed) throw new Error(plan.reason || "A ação não pode ser usada.");
  return {
    standard: Math.max(0, resources.standard - (plan.spend.standard || 0)),
    movement: Math.max(0, resources.movement - (plan.spend.movement || 0)),
    full: Math.max(0, resources.full - (plan.spend.full || 0)),
    free: Math.max(0, resources.free - (plan.spend.free || 0)),
    reaction: Math.max(0, resources.reaction - (plan.spend.reaction || 0)),
  };
}

export function spendCombatAction(tokenId: string, kind: ActionKind, state: CombatState = getCombatState()): CombatState {
  if (!state.active) return state;
  if (kind !== "reaction" && state.activeTokenId !== tokenId) throw new Error("Aguarde o turno deste token.");
  const mods = conditionMods(getBoard().tokens.find((token) => token.id === tokenId)?.conditions);
  if (!mods.canAct && kind !== "free") throw new Error(`Este personagem não pode fazer ações (${mods.blockedBy}).`);
  const current = state.resources[tokenId] || freshTurnResources();
  const plan = turnPlan(current, kind);
  let resources = spend(current, plan);
  // Enjoado: uma ação padrão OU de movimento por rodada, não ambas.
  if (mods.oneActionPerRound && (kind === "standard" || kind === "movement" || kind === "full")) resources = { ...resources, standard: 0, movement: 0, full: 0 };
  const next = { ...state, resources: { ...state.resources, [tokenId]: resources }, revision: state.revision + 1 };
  syncCombat(next);
  return next;
}
