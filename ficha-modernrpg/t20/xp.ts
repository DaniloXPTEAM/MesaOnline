/** Tabela oficial de experiência de Tormenta 20 (Jogo Básico). */
export const XP_TABLE: { level: number; xp: number }[] = [
  { level: 1, xp: 0 },
  { level: 2, xp: 1000 },
  { level: 3, xp: 3000 },
  { level: 4, xp: 6000 },
  { level: 5, xp: 10000 },
  { level: 6, xp: 15000 },
  { level: 7, xp: 21000 },
  { level: 8, xp: 28000 },
  { level: 9, xp: 36000 },
  { level: 10, xp: 45000 },
  { level: 11, xp: 55000 },
  { level: 12, xp: 66000 },
  { level: 13, xp: 78000 },
  { level: 14, xp: 91000 },
  { level: 15, xp: 105000 },
  { level: 16, xp: 120000 },
  { level: 17, xp: 136000 },
  { level: 18, xp: 153000 },
  { level: 19, xp: 171000 },
  { level: 20, xp: 190000 },
];

/** PE necessários para atingir determinado nível. */
export function xpForLevel(level: number): number {
  const row = XP_TABLE.find((r) => r.level === Math.max(1, Math.min(20, level)));
  return row ? row.xp : 0;
}

/** PE necessários para o próximo nível (ou o máximo no 20º). */
export function xpForNextLevel(level: number): number {
  return level >= 20 ? xpForLevel(20) : xpForLevel(level + 1);
}

/** Nível correspondente a uma quantidade de PE. */
export function levelForXp(xp: number): number {
  let lvl = 1;
  for (const row of XP_TABLE) if (xp >= row.xp) lvl = row.level;
  return lvl;
}

/** Progresso percentual dentro do nível atual. */
export function xpProgress(xp: number, level: number): number {
  const cur = xpForLevel(level);
  const next = xpForNextLevel(level);
  if (next <= cur) return 100;
  return Math.max(0, Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)));
}

export const formatXp = (n: number) => n.toLocaleString("pt-BR");
