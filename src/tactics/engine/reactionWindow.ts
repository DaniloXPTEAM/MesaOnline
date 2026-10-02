import { unitActions } from "../../game/actions";
import { conditionMods } from "../../game/conditionEffects";
import type { BoardToken, GameAction, PendingReaction } from "../../game/types";
import { appendCombatLog, getBoard, getCombatState, syncCombat } from "../../game/vttBridge";
import { tacticalViewForToken } from "../../integration/modernRpgCharacterBridge";
import { spellAllowsTarget } from "../interpretation/spellTargeting";

/**
 * Janela de reação (prompt de escolha). Antes de resolver um ataque ou magia hostil contra um
 * herói/token de jogador que tenha uma reação utilizável (e PM para pagá-la), a resolução é
 * PAUSADA e o dono do alvo decide: usar a reação ou não reagir. A reação vale antes do golpe,
 * então efeitos como Escudo da Fé já contam na Defesa. Reações que não dependem de escolha
 * (Santuário, Arma Espiritual, RD de poder) continuam automáticas em `reactiveTriggers.ts`.
 * A continuação (função) mora só no Mestre, que é a autoridade; o estado público vai em
 * `combat.pendingReaction`, que sincroniza com os jogadores.
 */
let continuation: (() => void) | null = null;
let aiEndTurnFor: string | null = null;

function selfTargetable(action: GameAction, reactor: BoardToken): boolean {
  if (action.target === "self" || action.target === "ally") return true;
  return spellAllowsTarget(action, reactor, reactor) === true;
}

/** Reações que o token pode escolher agora, sobre si mesmo. */
export function reactionOptions(reactor: BoardToken): GameAction[] {
  const combat = getCombatState();
  if (!combat.active || reactor.defeated || reactor.hp <= 0) return [];
  if (!conditionMods(reactor.conditions).canAct) return [];
  if ((combat.resources[reactor.id]?.reaction ?? 1) <= 0) return [];
  return unitActions(tacticalViewForToken(reactor))
    .filter((action) => action.kind === "reaction" && (action.pmCost || 0) <= reactor.pm && selfTargetable(action, reactor));
}

/** Só ações que fazem mal (dano ou condição) abrem a janela. */
function isHostile(action: GameAction): boolean {
  return action.effect === "damage" || Boolean(action.condition);
}

/**
 * Pausa a resolução se algum alvo (herói ou token de jogador, do outro lado) tem reação para escolher.
 * Devolve `true` quando pausou; nesse caso `proceed` será chamado quando o dono responder.
 */
export function openReactionWindow(actor: BoardToken, action: GameAction, targets: BoardToken[], proceed: () => void): boolean {
  const combat = getCombatState();
  if (!combat.active || combat.pendingReaction || !isHostile(action)) return false;
  for (const target of targets) {
    if (target.id === actor.id || target.side === actor.side) continue;
    if (!(target.side === "heroes" || target.controlledBy)) continue;
    const options = reactionOptions(target);
    if (!options.length) continue;
    const pending: PendingReaction = {
      id: `reacao-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      actorId: actor.id,
      actorName: actor.name,
      actionName: action.name,
      reactorId: target.id,
      reactorName: target.name,
      options: options.map((option) => ({ actionId: option.id, name: option.name, pmCost: option.pmCost || 0 })),
    };
    continuation = proceed;
    syncCombat({ ...combat, pendingReaction: pending, revision: combat.revision + 1 });
    appendCombatLog({ type: "reaction", title: "Reação?", detail: `${target.name} pode reagir a ${action.name} de ${actor.name}.`, tone: "neutral" });
    return true;
  }
  return false;
}

/** Fecha a janela e devolve a continuação guardada (ausente se o Mestre recarregou a página). */
export function closeReactionWindow(): (() => void) | null {
  const next = continuation;
  continuation = null;
  const combat = getCombatState();
  if (combat.pendingReaction) syncCombat({ ...combat, pendingReaction: undefined, revision: combat.revision + 1 });
  return next;
}

/** A IA parou no meio do turno esperando a reação: encerra o turno dela quando a janela fechar. */
export function markAiEndTurn(tokenId: string): void { aiEndTurnFor = tokenId; }
export function consumeAiEndTurn(): string | null { const id = aiEndTurnFor; aiEndTurnFor = null; return id; }
