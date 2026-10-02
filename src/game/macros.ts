/**
 * MACROS GLOBAIS.
 *
 * A Mesa já tinha macros POR TOKEN (Luta/Fortitude/Reflexos/Vontade, derivadas
 * da ficha). Faltavam as macros globais do VTT antigo e do V3: o Mestre cria
 * "Percepção 1d20+5" uma vez e usa a sessão inteira.
 *
 * Recuperado de `Vtt/app.js` (13 funções `macro*`) e do painel Automação do V3.
 * As duas modalidades coexistem — as de token não foram removidas.
 */
export interface GlobalMacro {
  id: string;
  name: string;
  formula: string;
}

export const MACROS_STORAGE_KEY = "tormenta20_mesa_macros_v1";

export interface RollBreakdown {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  faces: number;
  count: number;
}

/** Aceita "1d20+5", "2d6", "d20-1", "3d8 + 2". Devolve null se não parsear. */
export function parseFormula(formula: string): { count: number; faces: number; modifier: number } | null {
  const limpo = formula.replace(/\s+/g, "").toLowerCase();
  const match = limpo.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;
  const count = Math.min(50, Math.max(1, Number(match[1] || 1)));
  const faces = Math.min(1000, Math.max(2, Number(match[2])));
  const modifier = Number(match[3] || 0);
  return { count, faces, modifier };
}

export function rollFormula(
  formula: string,
  random: () => number = Math.random,
): RollBreakdown | null {
  const parsed = parseFormula(formula);
  if (!parsed) return null;
  const rolls: number[] = [];
  for (let i = 0; i < parsed.count; i += 1) rolls.push(1 + Math.floor(random() * parsed.faces));
  const soma = rolls.reduce((total, value) => total + value, 0);
  return { formula, rolls, modifier: parsed.modifier, total: soma + parsed.modifier, faces: parsed.faces, count: parsed.count };
}

export function loadMacros(): GlobalMacro[] {
  if (typeof window === "undefined") return [];
  try {
    const cru = window.localStorage.getItem(MACROS_STORAGE_KEY);
    const lista = cru ? JSON.parse(cru) : [];
    return Array.isArray(lista) ? lista.filter((item) => item?.id && item?.name) : [];
  } catch { return []; }
}

export function saveMacros(macros: GlobalMacro[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(MACROS_STORAGE_KEY, JSON.stringify(macros)); } catch { /* storage cheio */ }
}

export function upsertMacro(macro: GlobalMacro): GlobalMacro[] {
  const atual = loadMacros();
  const indice = atual.findIndex((item) => item.id === macro.id);
  const proximo = indice >= 0
    ? atual.map((item) => (item.id === macro.id ? macro : item))
    : [...atual, macro];
  saveMacros(proximo);
  return proximo;
}

export function removeMacro(id: string): GlobalMacro[] {
  const proximo = loadMacros().filter((item) => item.id !== id);
  saveMacros(proximo);
  return proximo;
}
