import type { CharacterSheet, EquipmentItem } from "../../../ficha-modernrpg/sheet";
import { findItemByName } from "../../../ficha-modernrpg/t20/compendium";
import { itemToAttack, itemToEquipment, uid } from "../../../ficha-modernrpg/t20/sheetRules";
import { tibarInText } from "./espolio";

/**
 * Pegar o conteúdo do baú para a mochila da ficha oficial. Moedas viram T$ (1 TC = 0,1 T$; 1 TO = 10 T$;
 * mesma cotação da página do Espólio) e somam em `money`; o resto vira item do equipamento: quando o
 * nome existe no catálogo de itens usa a ficha do catálogo (espaços, preço, categoria, bônus de Defesa),
 * senão entra como "Item Geral" com o texto do baú e o preço que ele trouxer. Arma também entra na lista de ataques.
 */
const COIN_IN_TIBAR: Record<string, number> = { TC: 0.1, "T$": 1, TO: 10, PP: 100, PC: 0.01 };
const COIN_LINE = /^\s*\d+(?:[.,]\d+)?\s*(?:TC|T\$|TO|PP|PC)(?:\s*[·+,]\s*\d+(?:[.,]\d+)?\s*(?:TC|T\$|TO|PP|PC))*\s*$/;

/** Divide por vírgula fora de parênteses e colchetes ("Adaga x2, poção [2d8+2], gazua"). */
export function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
    if ((char === "," || char === ";") && depth === 0) { parts.push(current); current = ""; continue; }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

export interface LootPiece { kind: "coins" | "item"; tibar?: number; name?: string; quantity?: number }

/** Valor em T$ de uma linha de moedas ("35 TC · 120 T$"). */
export function coinsToTibar(line: string): number {
  let total = 0;
  for (const match of line.matchAll(/(\d+(?:[.,]\d+)?)\s*(TC|T\$|TO|PP|PC)/g)) total += Number(match[1].replace(",", ".")) * (COIN_IN_TIBAR[match[2]] ?? 1);
  return Math.round(total * 100) / 100;
}

function itemPiece(raw: string): LootPiece {
  let text = raw.trim();
  let quantity = 1;
  const multiplied = text.match(/^(\d+)\s*×\s*(.+)$/) || text.match(/^(\d+)\s+(?!d\d)(.+)$/i);
  if (multiplied) { quantity = Number(multiplied[1]); text = multiplied[2].trim(); }
  const suffix = text.match(/^(.+?)\s+x\s*(\d+)$/i);
  if (suffix) { text = suffix[1].trim(); quantity = Number(suffix[2]); }
  return { kind: "item", name: text, quantity: Math.max(1, Math.min(99, quantity)) };
}

/** Quebra o conteúdo do baú em moedas e itens. Uma linha só de moedas vira `coins`; o resto, itens. */
export function parseLoot(entries: string[]): LootPiece[] {
  const pieces: LootPiece[] = [];
  for (const entry of entries) {
    if (COIN_LINE.test(entry)) { pieces.push({ kind: "coins", tibar: coinsToTibar(entry) }); continue; }
    // Item sorteado (uma linha inteira) ou nota de equipamento da ficha ("Adaga, gazua"): a nota é separada por vírgula.
    const parts = /^\S.*\)\s*$/.test(entry) || /\bou\b/.test(entry) ? [entry] : splitTopLevel(entry);
    for (const part of parts) pieces.push(itemPiece(part));
  }
  return pieces;
}

/** Devolve a ficha com o conteúdo pego somado ao dinheiro e ao equipamento (mesmo item empilha a quantidade). */
export function addLootToSheet(sheet: CharacterSheet, entries: string[], source: string): CharacterSheet {
  let money = sheet.money || 0;
  const equipment: EquipmentItem[] = sheet.equipment.map((item) => ({ ...item }));
  const attacks = [...(sheet.attacks || [])];
  for (const piece of parseLoot(entries)) {
    if (piece.kind === "coins") { money = Math.round((money + (piece.tibar || 0)) * 100) / 100; continue; }
    const name = piece.name || "";
    const catalog = findItemByName(name);
    const existing = equipment.find((item) => item.name.toLowerCase() === (catalog?.nome || name).toLowerCase());
    if (existing) { existing.quantity += piece.quantity || 1; continue; }
    if (catalog) {
      equipment.push({ ...itemToEquipment(catalog, piece.quantity || 1), source });
      // Arma pega também entra na lista de ataques da ficha (uma vez por nome).
      const attack = itemToAttack(catalog);
      if (attack && !attacks.some((entry) => entry.name.toLowerCase() === attack.name.toLowerCase())) attacks.push(attack);
      continue;
    }
    const price = tibarInText(name) || null;
    equipment.push({ id: uid("eq"), equipped: false, name: name.slice(0, 120), quantity: piece.quantity || 1, slots: 1, price, description: "Item do baú.", category: "Item Geral", source });
  }
  return { ...sheet, money, equipment, attacks, updatedAt: new Date().toISOString() };
}
