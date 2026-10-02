import campaignThreatsJson from "../../../ficha-modernrpg/t20/vtt/ameacas_campanhas.json";
import threatsJson from "../../../ficha-modernrpg/t20/vtt/ameacas.json";
import type { BoardObject, BoardToken } from "../types";
import { getBoard, getRuntimeSnapshot, onTokenDefeated, setObjects, updateToken } from "../vttBridge";
import { challengeKey, lootContents, parseTreasure, rollThreatLoot } from "./espolio";

/**
 * Espólio de ameaça: ao derrotar uma criatura do bestiário, ela solta um baú de espólio na casa
 * onde caiu, com o tesouro sorteado nas tabelas reais (ND e `tesouro` da ficha). O Mestre também
 * pode criar (ou refazer) o baú de qualquer token à mão. O baú de espólio nasce destrancado e sem
 * armadilha; o Mestre pode configurá-lo como qualquer baú.
 */
interface CanonicalThreat { id: string; nd?: string; tesouro?: string }

const BY_ID = new Map<string, CanonicalThreat>();
for (const threat of [...(threatsJson as CanonicalThreat[]), ...(campaignThreatsJson as CanonicalThreat[])]) BY_ID.set(threat.id, threat);

/** O token veio de uma ameaça do bestiário (tem ficha de tesouro)? Não sorteia nada. */
export function hasThreatLoot(token: Pick<BoardToken, "bestiaryId" | "customThreatId">): boolean {
  return BY_ID.has(token.bestiaryId || token.customThreatId || "");
}

/** Conteúdo do espólio da ameaça do token, ou `null` se o token não veio do bestiário. */
export function lootForToken(token: Pick<BoardToken, "bestiaryId" | "customThreatId">): string[] | null {
  const threat = BY_ID.get(token.bestiaryId || token.customThreatId || "");
  if (!threat) return null;
  const { tier, note } = parseTreasure(threat.tesouro);
  const key = challengeKey(threat.nd);
  const loot = key && tier ? rollThreatLoot(key, tier) : { coins: {}, items: [], totalTibar: 0 };
  return lootContents(loot, note);
}

/**
 * Cria o baú de espólio do token na casa dele. Sem `force`, não repete se o espólio dele já caiu e
 * não cria baú vazio. Devolve o baú criado, ou `null`.
 */
export function dropLootChest(tokenId: string, options: { force?: boolean } = {}): BoardObject | null {
  const token = getBoard().tokens.find((entry) => entry.id === tokenId);
  if (!token) return null;
  if (token.lootDropped && !options.force) return null;
  const contents = lootForToken(token);
  if (!contents || (!contents.length && !options.force)) return null;
  const chest: BoardObject = {
    id: `espolio-${token.id}-${Date.now().toString(36)}`,
    kind: "chest",
    name: `Espólio de ${token.name}`,
    x: token.gx,
    y: token.gy,
    floor: token.floor,
    opened: false,
    locked: false,
    contents,
  };
  setObjects([...getBoard().objects, chest]);
  updateToken(token.id, { lootDropped: true });
  return chest;
}

// Derrotou uma ameaça: o Mestre (autoridade) solta o espólio.
onTokenDefeated((token) => {
  if (getRuntimeSnapshot().multiplayer.role === "player") return;
  if (token.side !== "threats") return;
  dropLootChest(token.id);
});
