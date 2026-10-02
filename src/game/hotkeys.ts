/**
 * Hotkeys de itens da mochila (slots 1 a 5), guardadas por ficha oficial.
 * O painel da ficha lê estes ids; arrastar um item para um slot grava aqui.
 */
export const HOTKEY_SLOTS = 5;

const storageKey = (sheetId: string) => `armada-mesa-hotkeys-v1:${sheetId}`;

/** Ids dos itens por slot (índice 0 = tecla 1). Vazio = slot livre. */
export function readHotkeys(sheetId: string | null | undefined): string[] {
  const slots = Array.from({ length: HOTKEY_SLOTS }, () => "");
  if (!sheetId) return slots;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(sheetId)) || "[]");
    if (Array.isArray(value)) value.slice(0, HOTKEY_SLOTS).forEach((entry, index) => { slots[index] = entry ? String(entry) : ""; });
  } catch { /* atalhos ilegíveis: slots vazios */ }
  return slots;
}

function write(sheetId: string, slots: string[]): string[] {
  try { localStorage.setItem(storageKey(sheetId), JSON.stringify(slots)); } catch { /* armazenamento cheio */ }
  // Mesmo aviso que a ficha usa quando muda: a Mesa recalcula o painel.
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("modernrpg-characters-changed"));
  return slots;
}

/** Põe o item no slot (1 a 5). Um item ocupa um slot só: sai do anterior. */
export function assignHotkey(sheetId: string, slot: number, itemId: string): string[] {
  const slots = readHotkeys(sheetId);
  if (!Number.isInteger(slot) || slot < 1 || slot > HOTKEY_SLOTS || !itemId) return slots;
  const next = slots.map((entry) => (entry === itemId ? "" : entry));
  next[slot - 1] = itemId;
  return write(sheetId, next);
}

export function clearHotkey(sheetId: string, slot: number): string[] {
  const slots = readHotkeys(sheetId);
  if (!Number.isInteger(slot) || slot < 1 || slot > HOTKEY_SLOTS) return slots;
  slots[slot - 1] = "";
  return write(sheetId, slots);
}
