/**
 * GATILHOS EXECUTÁVEIS.
 *
 * Antes a ferramenta criava e persistia a área, mas a própria UI avisava que
 * "a execução automática ainda não existe no runtime". Aqui ela passa a existir.
 *
 * Adaptado de `Vtt/app.js` (`_processarCondTrigger`, `_checkContinuousCondTriggers`,
 * `setShapeTrigger`, `salvarCondTriggerForma`), preservando os dois modos:
 *   once       — dispara uma vez e marca a forma como usada (armadilha);
 *   continuous — aplica enquanto o token estiver dentro, remove ao sair.
 *
 * Não cria runtime paralelo: devolve um plano que o `runtimeCommands` aplica.
 */
import type { BoardShape, BoardState, BoardToken } from "./types";
import { floorOf } from "./floors";

export type TriggerMode = "once" | "continuous";

/**
 * O que um gatilho de cena faz ao ser pisado, além de aplicar condição (mini-macro do local):
 * tocar uma faixa do Jukebox, tocar um efeito sonoro, escrever uma mensagem no chat ou rolar uma macro.
 * Todos executam no Mestre e chegam a todos os jogadores pelos mesmos canais do resto da mesa.
 */
export type TriggerEffect =
  | { kind: "track"; url: string; title: string }
  | { kind: "sfx"; url: string; label?: string }
  | { kind: "message"; text: string }
  | { kind: "macro"; name: string; formula: string };

/** Configuração escolhida na gaveta ao criar um gatilho. */
export interface TriggerConfig { condition: string; mode: TriggerMode; effect?: TriggerEffect }

export interface ShapeTrigger {
  mode: TriggerMode;
  /** condição a aplicar; vazia quando o gatilho só faz um efeito de cena */
  condition: string;
  effect?: TriggerEffect;
  /** marcada como já disparada (modo once) */
  triggered?: boolean;
  /** tokens que já receberam a condição por esta forma */
  appliedTokens?: string[];
}

export interface TriggerOutcome {
  shapeId: string;
  tokenId: string;
  condition: string;
  mode: TriggerMode;
  action: "apply" | "remove";
  message: string;
}

function cellsOf(shape: BoardShape): Set<string> {
  return new Set(shape.cells);
}

function triggerOf(shape: BoardShape): ShapeTrigger | null {
  return shape.kind === "trigger" && shape.trigger ? shape.trigger : null;
}

/**
 * Avalia o que acontece quando `token` passa a ocupar (`x`,`y`).
 * Devolve apenas o plano; quem escreve no BOARD é o runtime.
 */
export function evaluateTriggers(
  board: BoardState,
  token: BoardToken,
  to: { x: number; y: number },
): TriggerOutcome[] {
  const destino = `${to.x},${to.y}`;
  const atuais = new Set(token.conditions || []);
  const saidas: TriggerOutcome[] = [];

  for (const shape of board.shapes) {
    const trigger = triggerOf(shape);
    if (!trigger || !trigger.condition || floorOf(shape) !== floorOf(token)) continue;
    const dentro = cellsOf(shape).has(destino);
    const jaAplicado = (trigger.appliedTokens || []).includes(token.id);

    if (trigger.mode === "once") {
      if (dentro && !trigger.triggered && !atuais.has(trigger.condition)) {
        saidas.push({
          shapeId: shape.id, tokenId: token.id, condition: trigger.condition,
          mode: "once", action: "apply",
          message: `${token.name} sofreu "${trigger.condition}" pela armadilha.`,
        });
      }
      continue;
    }

    // Contínuo é idempotente: cada forma lembra seus próprios tokens. Assim,
    // duas auras com a mesma condição não removem uma à outra quando o token
    // sai apenas de uma delas.
    if (dentro && (!jaAplicado || !atuais.has(trigger.condition))) {
      saidas.push({
        shapeId: shape.id, tokenId: token.id, condition: trigger.condition,
        mode: "continuous", action: "apply",
        message: `${token.name} entrou na área de "${trigger.condition}".`,
      });
    } else if (!dentro && jaAplicado) {
      const remainsInSameCondition = board.shapes.some((other) => {
        const otherTrigger = triggerOf(other);
        return other.id !== shape.id
          && floorOf(other) === floorOf(token)
          && otherTrigger?.mode === "continuous"
          && otherTrigger.condition === trigger.condition
          && cellsOf(other).has(destino);
      });
      if (!remainsInSameCondition && !saidas.some((outcome) => outcome.action === "remove" && outcome.condition === trigger.condition)) {
        saidas.push({
          shapeId: shape.id, tokenId: token.id, condition: trigger.condition,
          mode: "continuous", action: "remove",
          message: `${token.name} saiu da área de "${trigger.condition}".`,
        });
      }
    }
  }
  return saidas;
}

export interface EffectFiring { shapeId: string; effect: TriggerEffect }

/**
 * Efeitos de cena que disparam quando `token` ENTRA na área (estava fora e agora está dentro).
 * Modo "uma vez" só dispara na primeira entrada de qualquer um; "contínuo" dispara a cada nova entrada.
 */
export function evaluateEffectTriggers(
  board: BoardState,
  token: BoardToken,
  from: { x: number; y: number },
  to: { x: number; y: number },
): EffectFiring[] {
  const firings: EffectFiring[] = [];
  for (const shape of board.shapes) {
    const trigger = triggerOf(shape);
    if (!trigger?.effect || floorOf(shape) !== floorOf(token)) continue;
    const cells = cellsOf(shape);
    if (!cells.has(`${to.x},${to.y}`) || cells.has(`${from.x},${from.y}`)) continue;
    if (trigger.mode === "once" && trigger.triggered) continue;
    firings.push({ shapeId: shape.id, effect: trigger.effect });
  }
  return firings;
}

/** Marca como disparados os gatilhos "uma vez" que já rodaram. Função pura. */
export function markEffectsFired(shapes: BoardShape[], firings: EffectFiring[]): BoardShape[] {
  const fired = new Set(firings.map((entry) => entry.shapeId));
  return shapes.map((shape) => shape.trigger && fired.has(shape.id) && shape.trigger.mode === "once" ? { ...shape, trigger: { ...shape.trigger, triggered: true } } : shape);
}

/** Aplica o plano sobre cópias de token e formas. Função pura. */
export function applyTriggerOutcomes(
  token: BoardToken,
  shapes: BoardShape[],
  outcomes: TriggerOutcome[],
): { token: BoardToken; shapes: BoardShape[] } {
  if (!outcomes.length) return { token, shapes };
  let conditions = [...(token.conditions || [])];
  const next = shapes.map((shape) => ({ ...shape }));

  for (const outcome of outcomes) {
    if (outcome.action === "apply" && !conditions.includes(outcome.condition)) {
      conditions.push(outcome.condition);
    }
    if (outcome.action === "remove") {
      conditions = conditions.filter((entry) => entry !== outcome.condition);
    }
    const alvos = outcome.action === "remove" && outcome.mode === "continuous"
      // A remoção só é emitida quando não há outra área equivalente ocupada;
      // então limpa os marcadores órfãos de todas elas em uma operação.
      ? next.filter((shape) => shape.trigger?.mode === "continuous" && shape.trigger.condition === outcome.condition)
      : next.filter((shape) => shape.id === outcome.shapeId);
    for (const alvo of alvos) {
      if (!alvo.trigger) continue;
      const aplicados = new Set(alvo.trigger.appliedTokens || []);
      if (outcome.action === "apply") aplicados.add(outcome.tokenId);
      else aplicados.delete(outcome.tokenId);
      alvo.trigger = {
        ...alvo.trigger,
        appliedTokens: [...aplicados],
        triggered: alvo.trigger.mode === "once" ? alvo.trigger.triggered || outcome.action === "apply" : alvo.trigger.triggered,
      };
    }
  }
  return { token: { ...token, conditions }, shapes: next };
}

/** Condições oferecidas ao Mestre ao configurar um gatilho. */
export const TRIGGER_CONDITIONS = [
  "Abalado", "Atordoado", "Caído", "Cego", "Enredado", "Envenenado",
  "Exausto", "Fraco", "Lento", "Ofuscado", "Paralisado", "Surdo",
];
