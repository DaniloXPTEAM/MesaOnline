import type { BoardToken, MultiplayerState } from "./types";

/**
 * Mestre e mesa local mantêm autoridade total. Um Jogador só controla tokens
 * explicitamente vinculados ao ID PeerJS da própria instância.
 */
export function canControlToken(
  multiplayer: MultiplayerState,
  token?: Pick<BoardToken, "controlledBy"> | null,
): boolean {
  if (multiplayer.role !== "player") return true;
  return Boolean(token?.controlledBy && multiplayer.peerId && token.controlledBy === multiplayer.peerId);
}

export function isTokenOwnedByPeer(token: Pick<BoardToken, "controlledBy">, peerId: string): boolean {
  return Boolean(peerId && token.controlledBy === peerId);
}

export function shortPeerId(peerId?: string): string {
  if (!peerId) return "—";
  return peerId.length <= 14 ? peerId : `${peerId.slice(0, 7)}…${peerId.slice(-5)}`;
}
