import type { CombatState } from "../../game/types";
import {
  getRuntimeSnapshot,
  hostMultiplayer,
  joinMultiplayer,
  leaveMultiplayer,
  subscribeRuntime,
  syncBoard,
  syncCombat,
} from "../../game/vttBridge";

/**
 * Camada tactics-sync sobre o PeerJS único de game/multiplayer.ts.
 * Não cria Peer, não mantém tokens e não duplica combatState.
 */
export const tacticsSync = {
  host: hostMultiplayer,
  join: joinMultiplayer,
  leave: leaveMultiplayer,
  snapshot: getRuntimeSnapshot,
  subscribe: subscribeRuntime,
  board: () => syncBoard(),
  combat: (state?: CombatState) => syncCombat(state),
};
