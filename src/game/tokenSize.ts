/**
 * Categorias de tamanho (T20) e as regras de montaria que o usuário definiu.
 *

 * Espaço ocupado (informado pelo usuário): Minúsculo a Médio 1 casa (1,5 m); Grande 3 m = 2×2 casas; Enorme 4,5 m = 3×3;
 * Colossal 9 m = 6×6. Montaria: o cavaleiro só monta uma criatura 1 ou 2 categorias MAIOR que ele
 * (Pequeno → Médio ou Grande; Médio → Grande ou Enorme...), e o par passa a ocupar o espaço da montaria.
 */
export type SizeCategory = "minusculo" | "pequeno" | "medio" | "grande" | "enorme" | "colossal";

export const SIZE_ORDER: SizeCategory[] = ["minusculo", "pequeno", "medio", "grande", "enorme", "colossal"];
export const SIZE_LABEL: Record<SizeCategory, string> = { minusculo: "Minúsculo", pequeno: "Pequeno", medio: "Médio", grande: "Grande", enorme: "Enorme", colossal: "Colossal" };
const FOOTPRINT: Record<SizeCategory, number> = { minusculo: 1, pequeno: 1, medio: 1, grande: 2, enorme: 3, colossal: 6 };

/** Lê o tamanho em textos como "Humanoide (humano) Médio" ou "Pequeno"; acentos opcionais. */
export function parseSize(text?: string | null): SizeCategory | undefined {
  const plain = String(text ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const match = /(minusculo|pequeno|medio|grande|enorme|colossal)/.exec(plain);
  return match ? (match[1] as SizeCategory) : undefined;
}

/** Tamanho do token: o gravado nele, senão o que vem escrito no tipo da ameaça ("Humanoide (goblin) Pequeno · ND 1"), senão Médio. */
export const sizeOf = (token: { size?: SizeCategory; title?: string }): SizeCategory => token.size ?? parseSize(token.title) ?? "medio";
export const footprintOf = (size: SizeCategory | undefined): number => FOOTPRINT[size ?? "medio"];

/** Motivo pelo qual `rider` não pode montar em `mount` por causa do tamanho, ou null. */
export function mountSizeError(rider: { size?: SizeCategory; title?: string; name: string }, mount: { size?: SizeCategory; title?: string; name: string }): string | null {
  const gap = SIZE_ORDER.indexOf(sizeOf(mount)) - SIZE_ORDER.indexOf(sizeOf(rider));
  if (gap >= 1 && gap <= 2) return null;
  return `${mount.name} (${SIZE_LABEL[sizeOf(mount)]}) não serve de montaria para ${rider.name} (${SIZE_LABEL[sizeOf(rider)]}): a montaria precisa ser 1 ou 2 categorias de tamanho maior que o cavaleiro.`;
}

type Placed = { gx: number; gy: number; size?: SizeCategory; title?: string; mountId?: string };

/** Lado, em casas, do bloco que o token ocupa (1, 2, 3 ou 6). Cavaleiro montado não ocupa espaço próprio: está dentro da montaria. */
export function sideOf(token: { size?: SizeCategory; title?: string; mountId?: string }): number {
  return token.mountId ? 0 : footprintOf(sizeOf(token));
}

/**
 * Casas ocupadas por um token. `gx, gy` é a casa do canto superior esquerdo do bloco (como no Foundry);
 * `at` calcula para outra posição de partida sem mexer no token.
 */
export function coveredCells(token: Placed, at?: { x: number; y: number }): Array<{ x: number; y: number }> {
  const side = sideOf(token);
  const x0 = at?.x ?? token.gx, y0 = at?.y ?? token.gy;
  const cells: Array<{ x: number; y: number }> = [];
  for (let dx = 0; dx < side; dx += 1) for (let dy = 0; dy < side; dy += 1) cells.push({ x: x0 + dx, y: y0 + dy });
  return cells;
}

export function tokenCovers(token: Placed, x: number, y: number): boolean {
  const side = sideOf(token);
  return x >= token.gx && x < token.gx + side && y >= token.gy && y < token.gy + side;
}

/** Centro do bloco em coordenadas de grade (a casa 0,0 vai de 0 a 1): para desenhar e para a linha de efeito. */
export function blockCenter(token: Placed): { x: number; y: number } {
  const side = Math.max(1, sideOf(token));
  return { x: token.gx + side / 2, y: token.gy + side / 2 };
}

/** Menor distância, em casas (Chebyshev), entre os blocos de dois tokens: alcance e adjacência valem da casa mais próxima. */
export function blockGap(a: Placed, b: Placed): number {
  const ca = coveredCells(a).length ? coveredCells(a) : [{ x: a.gx, y: a.gy }];
  const cb = coveredCells(b).length ? coveredCells(b) : [{ x: b.gx, y: b.gy }];
  let best = Infinity;
  for (const p of ca) for (const q of cb) best = Math.min(best, Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)));
  return best;
}
