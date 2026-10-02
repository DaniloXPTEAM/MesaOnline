/**
 * Círculo máximo que um conjurador lança, por classe e nível.
 * Fonte: `public/vtt/armada-tactics.js` do ModernRPG-2026-09-23 (tabela
 * `CIRCLE_LEVELS`, "Fonte: classes.json do ModernRPG"), coberta pelos testes
 * `spell-effects-tests` de lá: "Clérigo: 1º círculo no nv1, 2º no nv5, 3º no nv9"
 * e "Bardo ganha o 2º círculo só no nv6".
 */
const CIRCLE_LEVELS: Record<string, number[]> = {
  arcanista: [1, 5, 9, 13, 17],
  clerigo: [1, 5, 9, 13, 17],
  bardo: [1, 6, 10, 14],
  druida: [1, 6, 10, 14],
  ladino: [1, 6, 10, 14],
  frade: [1, 5, 9],
};

const classKey = (value: string | undefined) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Classe fora da tabela (ou sem ficha): usa o maior círculo entre as magias
 * conhecidas e, se não houver nenhuma, o círculo `fallback`.
 */
export function maxCircleFor(className: string | undefined, level: number, knownCircles: readonly number[] = [], fallback = 1): number {
  const table = CIRCLE_LEVELS[classKey(className)];
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (table) return Math.max(1, table.filter((minimum) => safeLevel >= minimum).length);
  const known = knownCircles.map(Number).filter(Number.isFinite);
  return Math.max(1, ...known, known.length ? 0 : fallback);
}
