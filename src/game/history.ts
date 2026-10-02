/**
 * UNDO / REDO das operações do Mestre.
 *
 * Recuperado de `Vtt/app.js` (7 funções `undo*`/`redo*`, `_capturarEstadoAtual`,
 * `snapshotBoard`, `_restoreBoardState`).
 *
 * Estratégia: pilha de snapshots do BOARD, capturada no único funil de
 * escrita (`replaceActiveBoard`). Não cria BOARD paralelo nem grava no disco —
 * é histórico de sessão, como no original.
 *
 * Fora do escopo por decisão consciente: eventos de combate (rolagem de dado,
 * dano, iniciativa) NÃO entram. Desfazer uma rolagem já resolvida mudaria o
 * resultado do jogo; o contrato pede undo para as operações de edição de cena.
 */
import type { BoardState } from "./types";

const LIMITE = 30;

let desfazer: Array<{ board: BoardState; label: string }> = [];
let refazer: Array<{ board: BoardState; label: string }> = [];
let aplicando = false;
const ouvintes = new Set<() => void>();

function avisar() { for (const ouvinte of ouvintes) ouvinte(); }

export function subscribeHistory(listener: () => void): () => void {
  ouvintes.add(listener);
  return () => { ouvintes.delete(listener); };
}

/** `true` enquanto um undo/redo está sendo aplicado (evita recaptura). */
export function isApplyingHistory(): boolean { return aplicando; }

/** Guarda o estado ANTERIOR à mutação. Chamado pelo funil de escrita. */
export function captureHistory(previous: BoardState, label = "Edição da cena"): void {
  if (aplicando) return;
  desfazer = [...desfazer, { board: previous, label }].slice(-LIMITE);
  refazer = [];
  avisar();
}

export function canUndo(): boolean { return desfazer.length > 0; }
export function canRedo(): boolean { return refazer.length > 0; }
export function undoLabel(): string { return desfazer[desfazer.length - 1]?.label || ""; }
export function redoLabel(): string { return refazer[refazer.length - 1]?.label || ""; }

/** Devolve o board a restaurar, ou null. Quem aplica é o bridge. */
export function popUndo(current: BoardState): { board: BoardState; label: string } | null {
  const entrada = desfazer[desfazer.length - 1];
  if (!entrada) return null;
  desfazer = desfazer.slice(0, -1);
  refazer = [...refazer, { board: current, label: entrada.label }].slice(-LIMITE);
  avisar();
  return entrada;
}

export function popRedo(current: BoardState): { board: BoardState; label: string } | null {
  const entrada = refazer[refazer.length - 1];
  if (!entrada) return null;
  refazer = refazer.slice(0, -1);
  desfazer = [...desfazer, { board: current, label: entrada.label }].slice(-LIMITE);
  avisar();
  return entrada;
}

export function runWithoutHistory(action: () => void): void {
  aplicando = true;
  try { action(); } finally { aplicando = false; }
}

export function clearHistory(): void {
  desfazer = []; refazer = []; avisar();
}

/** Só para teste/diagnóstico. */
export function historySizes(): { undo: number; redo: number } {
  return { undo: desfazer.length, redo: refazer.length };
}
