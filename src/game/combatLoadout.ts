/**
 * O que o jogador escolhe levar para o combate, por ficha oficial: itens do Inventário (aparecem em
 * Ações → Itens), ataques e poderes da Ficha (aparecem em Agir). Sem nenhuma marca num grupo, o
 * comportamento é o de antes (aparece tudo o que a ficha tem).
 */
export type LoadoutKind = "items" | "attacks" | "powers";
export type CombatLoadout = Record<LoadoutKind, string[]>;

const storageKey = (sheetId: string) => `armada-mesa-loadout-v1:${sheetId}`;
const empty = (): CombatLoadout => ({ items: [], attacks: [], powers: [] });

export function readLoadout(sheetId: string | null | undefined): CombatLoadout {
  const loadout = empty();
  if (!sheetId) return loadout;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(sheetId)) || "{}");
    for (const kind of Object.keys(loadout) as LoadoutKind[]) {
      if (Array.isArray(value?.[kind])) loadout[kind] = value[kind].map(String);
    }
  } catch { /* marcações ilegíveis: tudo aparece */ }
  return loadout;
}

/** Marca ou desmarca um item, ataque ou poder. Devolve o novo estado da ficha. */
export function toggleLoadout(sheetId: string, kind: LoadoutKind, id: string): CombatLoadout {
  const loadout = readLoadout(sheetId);
  loadout[kind] = loadout[kind].includes(id) ? loadout[kind].filter((entry) => entry !== id) : [...loadout[kind], id];
  try { localStorage.setItem(storageKey(sheetId), JSON.stringify(loadout)); } catch { /* armazenamento cheio */ }
  // Mesmo aviso da ficha e das hotkeys: a Mesa recalcula o painel.
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("modernrpg-characters-changed"));
  return loadout;
}
