import { isTokenOwnedByPeer } from "../../game/permissions";
import { dismountCell, isMounted, mountError, mountPartner } from "../../game/mount";
import { spendCombatAction } from "./actionEconomy";
import { appendCombatLog, getBoard, getCombatState, getRuntimeSnapshot, registerRemoteCommand, requestRemoteCommand, updateToken } from "../../game/vttBridge";
import type { BoardToken } from "../../game/types";

function required(id: string): BoardToken {
  const token = getBoard().tokens.find((entry) => entry.id === id);
  if (!token) throw new Error("Token não encontrado.");
  return token;
}

/** Só o dono do cavaleiro monta; a montaria precisa ser do mesmo lado. */
function applyMount(riderId: string, mountId: string, peerId?: string): void {
  const rider = required(riderId);
  const mount = required(mountId);
  if (peerId !== undefined && !isTokenOwnedByPeer(rider, peerId)) throw new Error("Você não controla este personagem.");
  if (rider.side !== mount.side) throw new Error("A montaria precisa ser do mesmo lado.");
  const error = mountError(getBoard(), rider, mount);
  if (error) throw new Error(error);
  // Em combate, montar custa uma ação de movimento (como pegar e soltar item).
  if (getCombatState().active) spendCombatAction(rider.id, "movement");
  updateToken(mount.id, { riderId: rider.id });
  updateToken(rider.id, { mountId: mount.id, gx: mount.gx, gy: mount.gy });
  appendCombatLog({ type: "move", title: "Montaria", detail: `${rider.name} montou em ${mount.name}.`, tone: "neutral" });
}

function applyDismount(tokenId: string, peerId?: string): void {
  const token = required(tokenId);
  if (peerId !== undefined && !isTokenOwnedByPeer(token, peerId)) throw new Error("Você não controla este personagem.");
  if (!isMounted(token)) throw new Error("Este token não está em uma montaria.");
  const partner = mountPartner(getBoard(), token);
  const rider = token.mountId ? token : partner;
  const mount = token.mountId ? partner : token;
  if (!rider || !mount) {
    updateToken(token.id, { mountId: undefined, riderId: undefined });
    return;
  }
  const cell = dismountCell(getBoard(), rider, mount);
  if (getCombatState().active) spendCombatAction(rider.id, "movement"); // desmontar também gasta a ação de movimento
  updateToken(mount.id, { riderId: undefined });
  updateToken(rider.id, { mountId: undefined, ...(cell ? { gx: cell.x, gy: cell.y } : {}) });
  appendCombatLog({ type: "move", title: "Montaria", detail: cell ? `${rider.name} desmontou.` : `${rider.name} desmontou, mas não havia casa livre ao lado.`, tone: "neutral" });
}

registerRemoteCommand("mountToken", (args, context) => applyMount(String(args[0]), String(args[1]), context.peerId));
registerRemoteCommand("dismountToken", (args, context) => applyDismount(String(args[0]), context.peerId));

export function executeMount(riderId: string, mountId: string): void {
  if (getRuntimeSnapshot().multiplayer.role === "player") { requestRemoteCommand("mountToken", riderId, mountId); return; }
  applyMount(riderId, mountId);
}

export function executeDismount(tokenId: string): void {
  if (getRuntimeSnapshot().multiplayer.role === "player") { requestRemoteCommand("dismountToken", tokenId); return; }
  applyDismount(tokenId);
}
