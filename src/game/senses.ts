/**
 * EFEITOS SENSORIAIS — Cego e Surdo.
 *
 * Recuperado de `Vtt/app.js` (`aplicarCegoVisual`, `_aplicarSurdo`, `_isBlind`,
 * `_revealBlindBlocker`). No original, Cego escondia o tabuleiro e travava o
 * chat; Surdo zerava os ganhos de áudio e mostrava um indicador.
 *
 * Aqui os efeitos valem para o JOGADOR cujo token está afetado — o Mestre
 * mantém visão administrativa, como no resto da cadeia de visão.
 */
import type { BoardState, MultiplayerState } from "./types";

export interface SensoryState {
  blind: boolean;
  deaf: boolean;
  /** nome do token que causa o efeito, para a mensagem na tela */
  source: string;
}

const CEGO = /\bcego\b|blind/i;
const SURDO = /\bsurd[oa]\b|deaf/i;

/**
 * Estado sensorial de quem está olhando a mesa.
 * O Mestre nunca fica cego/surdo pela condição de um token — ele precisa
 * enxergar a cena para conduzir.
 */
export function sensoryStateFor(board: BoardState, multiplayer: MultiplayerState): SensoryState {
  const vazio: SensoryState = { blind: false, deaf: false, source: "" };
  if (multiplayer.role !== "player") return vazio;

  const meus = board.tokens.filter((token) => token.controlledBy && token.controlledBy === multiplayer.peerId);
  if (!meus.length) return vazio;

  // Basta um token controlado estar afetado — é ele que o jogador "é" na cena.
  const cego = meus.find((token) => (token.conditions || []).some((c) => CEGO.test(c)));
  const surdo = meus.find((token) => (token.conditions || []).some((c) => SURDO.test(c)));

  return {
    blind: Boolean(cego),
    deaf: Boolean(surdo),
    source: (cego || surdo)?.name || "",
  };
}

/** Rótulo curto para o aviso na tela. */
export function sensoryLabel(state: SensoryState): string {
  if (state.blind && state.deaf) return "Cego e surdo";
  if (state.blind) return "Cego";
  if (state.deaf) return "Surdo";
  return "";
}
