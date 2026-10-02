import { useEffect, useRef } from "react";
import { getCharacterSheetById, upsertCharacterSheet } from "../../../ficha-modernrpg/characterRoute";
import { addLootToSheet } from "../../game/espolio/lootToSheet";
import { canControlToken } from "../../game/permissions";
import type { RuntimeSnapshot } from "../../game/types";
import { executeClaimLoot } from "../../tactics/engine/objectCommands";

/**
 * Coloca na mochila da ficha oficial o que o personagem pegou de um baú. A ficha mora no navegador de
 * quem joga, então quem a tem aplica o `pendingLoot` do token nela e avisa o Mestre para limpar. O
 * Mestre aplica só nos tokens que nenhum jogador conectado controla. Sem ficha vinculada neste
 * navegador, a pendência é só limpa (o que foi pego continua no chat).
 */
export default function LootClaimer({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const done = useRef(new Set<string>());
  useEffect(() => {
    const isPlayer = snapshot.multiplayer.role === "player";
    for (const token of snapshot.board.tokens) {
      const entries = token.pendingLoot;
      if (!entries?.length) continue;
      const mine = isPlayer
        ? canControlToken(snapshot.multiplayer, token)
        : !token.controlledBy || !snapshot.multiplayer.peers.includes(token.controlledBy);
      if (!mine) continue;
      const key = `${token.id}:${entries.join("|")}`;
      if (done.current.has(key)) continue;
      done.current.add(key);
      const sheet = token.modernRpgCharacterId ? getCharacterSheetById(token.modernRpgCharacterId) : null;
      if (sheet) upsertCharacterSheet(addLootToSheet(sheet, entries, "Baú"));
      try { executeClaimLoot(token.id); } catch { done.current.delete(key); }
    }
  }, [snapshot.board.tokens, snapshot.multiplayer]);
  return null;
}
