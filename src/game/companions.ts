import type { BoardState, BoardToken } from "./types";

/** Criatura do bestiário que serve de montaria: a habilidade "Parceiro" dela diz "Montaria Grande/Média/Enorme...". */
export function isMountToken(token: Pick<BoardToken, "abilities">): boolean {
  return (token.abilities || []).some((ability) => /parceiro/i.test(ability.name) && /montaria/i.test((ability.description || "").slice(0, 200)));
}

/**
 * Parceiros do Portal (página "Parceiros": `Companion` em portal/components/views/CampaignsView.tsx), ligados a um personagem
 * pelo `owner` (id da ficha). Na Mesa, um aventureiro só monta em montarias que a ficha dele tem: parceiro do tipo Montaria
 * ligado a ele ou item de montaria na mochila. O Mestre não tem essa restrição.
 */
export const COMPANIONS_KEY = "tormenta20_online_companions_v1";

export interface StoredCompanion { id: string; name: string; kind: string; owner?: string; threatId?: string }

export function loadCompanions(): StoredCompanion[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPANIONS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.name === "string") : [];
  } catch { return []; }
}

const same = (a?: string, b?: string) => Boolean(a && b) && a!.trim().toLocaleLowerCase("pt-BR") === b!.trim().toLocaleLowerCase("pt-BR");

/** Tokens do mapa que correspondem às montarias do personagem (parceiros Montaria ligados a ele e itens da mochila com o nome de uma criatura). */
export function ownedMountTokens(board: Pick<BoardState, "tokens">, rider: BoardToken, ownedNames: string[] = []): BoardToken[] {
  const mine = loadCompanions().filter((entry) => rider.modernRpgCharacterId && entry.owner === rider.modernRpgCharacterId && /montaria/i.test(entry.kind));
  return board.tokens.filter((token) => token.id !== rider.id && !token.hidden
    && (mine.some((entry) => (entry.threatId && token.bestiaryId === entry.threatId) || same(entry.name, token.name))
      // item da mochila ou poder da ficha que dá a criatura (ex.: um trobo comprado, Companheiro Selvagem): vale se ela é montaria no bestiário
      || (isMountToken(token) && ownedNames.some((name) => same(name, token.name)))));
}
