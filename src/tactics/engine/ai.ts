import type { BoardState, BoardToken, GameAction } from "../../game/types";
import { getBoard, getRuntimeSnapshot, moveToken } from "../../game/vttBridge";
import { actionsForThreat } from "../data/bestiaryAdapter";
import { getThreat } from "./customThreats";
import { reachableCells } from "./movement";
import { executeTacticalAction, executeTacticalEndTurn, executeTacticalMove } from "./runtimeCommands";
import { markAiEndTurn } from "./reactionWindow";
import { cellDistance, hasLineOfEffect, withinRange, withinRangeCells } from "./targeting";

export interface AiPlan {
  actorId: string;
  targetId?: string;
  move?: { x: number; y: number; cost: number };
  action?: GameAction;
  reason: string;
}

/** Planejador determinístico sobre BOARD/combatState/AMEACAS_DB. */
export function aiPlan(actor: BoardToken, board: BoardState = getBoard()): AiPlan {
  if (actor.side !== "threats") return { actorId: actor.id, reason: "IA só controla ameaças." };
  const enemies = board.tokens.filter((token) => token.side !== actor.side && !token.hidden && !token.defeated && token.hp > 0);
  if (!enemies.length) return { actorId: actor.id, reason: "Nenhum alvo vivo." };
  const target = [...enemies].sort((a, b) => cellDistance(actor, a) - cellDistance(actor, b) || a.hp - b.hp)[0];
  const template = actor.bestiaryId || actor.customThreatId ? getThreat(actor.bestiaryId || actor.customThreatId || "") : null;
  const actions = template ? actionsForThreat(template) : actor.tacticalActions || [];
  const usable = actions
    // A IA só usa ações contra um inimigo (auto-alvo, área e aliado exigem outra entrada).
    .filter((action) => action.pmCost <= actor.pm && action.target === "enemy")
    .sort((a, b) => Number(b.effect === "damage") - Number(a.effect === "damage") || a.pmCost - b.pmCost);
  const inRange = usable.find((action) => withinRange(actor, target, action.rangeM) && hasLineOfEffect(board, actor, target));
  if (inRange) return { actorId: actor.id, targetId: target.id, action: inRange, reason: `${actor.name} usa ${inRange.name}.` };

  const preferred = usable[0];
  const reachable = [...reachableCells(board, actor).entries()]
    .map(([key, cost]) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y, cost, distance: Math.max(Math.abs(x - target.gx), Math.abs(y - target.gy)) };
    })
    .sort((a, b) => a.distance - b.distance || a.cost - b.cost);
  const move = reachable.find((cell) => cell.x !== actor.gx || cell.y !== actor.gy);
  return {
    actorId: actor.id,
    targetId: target.id,
    move,
    action: preferred && move && withinRangeCells({ x: move.x, y: move.y }, { x: target.gx, y: target.gy }, preferred.rangeM) ? preferred : undefined,
    reason: move ? `${actor.name} se aproxima de ${target.name}.` : "Não há rota disponível.",
  };
}

export function applyAiMovement(plan: AiPlan): BoardToken | null {
  if (getRuntimeSnapshot().multiplayer.role === "player") throw new Error("Somente o Mestre executa a IA.");
  if (!plan.move) return null;
  return moveToken(plan.actorId, plan.move.x, plan.move.y);
}

export interface AiTurnReport {
  actorId: string;
  steps: string[];
}

/**
 * Executa o turno de uma ameaça pelo mesmo runtime dos jogadores (economia de
 * ações, alcance e log valem igual): escolhe o alvo, ataca se puder; senão
 * move, reavalia o alcance, ataca se chegou e encerra o turno.
 */
export function runAiTurn(actorId: string): AiTurnReport {
  if (getRuntimeSnapshot().multiplayer.role === "player") throw new Error("Somente o Mestre executa a IA.");
  const combat = getRuntimeSnapshot().combat;
  if (!combat.active || combat.activeTokenId !== actorId) throw new Error("A IA só age no turno da própria ameaça.");
  const report: AiTurnReport = { actorId, steps: [] };
  const actor = () => getBoard().tokens.find((token) => token.id === actorId);
  const first = actor();
  if (!first) throw new Error("Ameaça não encontrada.");

  let plan = aiPlan(first);
  report.steps.push(plan.reason);
  const attack = () => {
    const current = actor();
    if (!current || !plan.action || !plan.targetId) return false;
    try {
      executeTacticalAction(current.id, plan.action.id, [plan.targetId]);
      report.steps.push(`${current.name} usa ${plan.action.name}.`);
      return true;
    } catch (error) {
      report.steps.push((error as Error).message);
      return false;
    }
  };

  // Plano sem movimento = já está ao alcance; plano com movimento leva a ação para DEPOIS de chegar.
  const waitingReaction = () => Boolean(getRuntimeSnapshot().combat.pendingReaction);
  if (plan.action && plan.targetId && !plan.move) {
    attack();
  } else if (plan.move) {
    try {
      executeTacticalMove(actorId, plan.move.x, plan.move.y);
      report.steps.push(`Move-se para ${plan.move.x + 1}, ${plan.move.y + 1}.`);
      const moved = actor();
      if (moved) {
        plan = aiPlan(moved);
        if (plan.action && plan.targetId) attack();
      }
    } catch (error) {
      report.steps.push((error as Error).message);
    }
  }
  // Alvo com reação para escolher: o ataque está pausado; o turno da IA se encerra quando a janela fechar.
  if (waitingReaction()) {
    markAiEndTurn(actorId);
    report.steps.push("Aguardando a decisão de reação do alvo.");
    return report;
  }
  try { executeTacticalEndTurn(actorId); } catch (error) { report.steps.push((error as Error).message); }
  return report;
}
