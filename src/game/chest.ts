import { coveredCells, type SizeCategory } from "./tokenSize";
import type { BoardObject, BoardWall, ObjectTrap } from "./types";

/**
 * Baú e porta interativos: regras puras. O baú é um objeto da cena (`BoardObject`) configurado pelo
 * Mestre como uma mini-macro: conteúdo, trancado, CD e armadilha; a porta usa a mesma arquitetura.
 * O jogador interage por um diálogo; quem resolve os testes é o Mestre (`tactics/engine/objectCommands.ts`).
 *
 * Regras do Tormenta20 usadas (perícia Ladinagem, "Abrir Fechadura", e magia Tranca Arcana):
 *  - CD 20 fechadura simples (porta de loja), 25 média (prisão, baú), 30 superior (cofre, câmara do tesouro);
 *  - abrir fechadura é um teste de Ladinagem, exige ação completa e uma gazua (sem ela, –5);
 *  - dá para arrombar com um teste de Força contra a mesma CD;
 *  - Tranca Arcana aumenta a CD de Força ou Ladinagem para abrir em +10 (+5 a cada aprimoramento "aumenta a CD").
 */

/** Distância máxima (em casas, em qualquer direção) para interagir com o baú ou a porta. */
export const OBJECT_REACH_CELLS = 1;
export const LOCK_DC_SIMPLE = 20;
export const LOCK_DC_MEDIUM = 25;
export const LOCK_DC_SUPERIOR = 30;
/** CD padrão quando o Mestre não define: baú = fechadura média; porta = fechadura simples. */
export const DEFAULT_CHEST_LOCK_DC = LOCK_DC_MEDIUM;
export const DEFAULT_DOOR_LOCK_DC = LOCK_DC_SIMPLE;
/** CD de Misticismo para detectar magia quando o Mestre não define. */
export const DEFAULT_MAGIC_DC = 20;
/** Aumento de CD da Tranca Arcana. */
export const ARCANE_LOCK_BONUS = 10;
/** Penalidade em Ladinagem para abrir fechadura sem gazua. */
export const NO_LOCKPICK_PENALTY = -5;
export const LOCK_PRESETS = [
  { label: "Simples (porta de loja)", dc: LOCK_DC_SIMPLE },
  { label: "Média (prisão, baú)", dc: LOCK_DC_MEDIUM },
  { label: "Superior (cofre, câmara do tesouro)", dc: LOCK_DC_SUPERIOR },
];
/** Quanto tempo (ms) a animação de tremer e a de revelar ficam ativas. */
export const SHAKE_MS = 700;
export const REVEAL_MS = 9000;

export function withinReach(actor: { gx: number; gy: number; size?: SizeCategory; title?: string; mountId?: string }, object: { x: number; y: number }): boolean {
  const cells = coveredCells(actor);
  const near = (cells.length ? cells : [{ x: actor.gx, y: actor.gy }]).some((cell) => Math.max(Math.abs(cell.x - object.x), Math.abs(cell.y - object.y)) <= OBJECT_REACH_CELLS);
  return near;
}

/** CD base da fechadura (sem a Tranca Arcana). */
export function lockDcOf(object: { lockDc?: number }, fallback = DEFAULT_CHEST_LOCK_DC): number {
  return Math.max(1, Math.round(object.lockDc || fallback));
}

/** CD para arrombar ou forçar: a base mais a Tranca Arcana (+10, mais o extra dos aprimoramentos). */
export function effectiveLockDc(object: { lockDc?: number; magicLocked?: boolean; magicBonus?: number }, fallback = DEFAULT_CHEST_LOCK_DC): number {
  return lockDcOf(object, fallback) + (object.magicLocked ? ARCANE_LOCK_BONUS + Math.max(0, Math.round(object.magicBonus || 0)) : 0);
}

export function isShaking(object: { shakeAt?: number }, now = Date.now()): boolean {
  return Boolean(object.shakeAt) && now - (object.shakeAt as number) < SHAKE_MS;
}

export function isRevealing(object: Pick<BoardObject, "revealAt">, now = Date.now()): boolean {
  return Boolean(object.revealAt) && now - (object.revealAt as number) < REVEAL_MS;
}

/** A armadilha só aparece para o jogador depois de revelada, e sem números. */
export function trapForPlayer(trap: ObjectTrap | undefined): { trap: ObjectTrap } | Record<string, never> {
  return trap && trap.armed && trap.revealed ? { trap: { name: trap.name, armed: true, revealed: true, detectDc: 0, disarmDc: 0 } } : {};
}

/**
 * O que um jogador pode receber do objeto: nada de CD, a Tranca Arcana só depois de detectada, nada de conteúdo enquanto
 * fechado, e a armadilha só como aviso depois de revelada (sem números). O Mestre recebe tudo.
 */
export function objectForPlayer(object: BoardObject): BoardObject {
  const { lockDc: _lockDc, magicLocked, magicBonus: _magicBonus, magicDc: _magicDc, trap, ...rest } = object;
  return {
    ...rest,
    // A magia só aparece para o jogador depois que um teste de Misticismo a detectou.
    ...(object.magicRevealed && magicLocked ? { magicLocked: true } : {}),
    contents: object.opened ? object.contents : [],
    ...trapForPlayer(trap),
  };
}

/** Porta ou janela vista por um jogador: sem CD e sem a Tranca Arcana. */
export function wallForPlayer(wall: BoardWall): BoardWall {
  const { lockDc: _lockDc, magicLocked, magicBonus: _magicBonus, magicDc: _magicDc, trap, ...rest } = wall;
  return { ...rest, ...(wall.magicRevealed && magicLocked ? { magicLocked: true } : {}), ...trapForPlayer(trap) };
}
