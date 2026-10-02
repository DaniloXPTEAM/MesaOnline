import type { BoardState, BoardToken } from "./types";
import { floorOf } from "./floors";
import { footprintOf, mountSizeError, sizeOf, tokenCovers } from "./tokenSize";

/**
 * Montaria. Regras portadas do legado (`Vtt/app.js`: `montar`, `desmontar`, `getParMontaria`,
 * `moverRiderParaCentro`, `moverMountParaRider`, `_acharPosAdjacente`): o cavaleiro fica sobre a
 * montaria (mesma casa), os dois andam juntos e só podem montar a 1 quadrado de distância (regra do usuário; o legado aceitava 3).
 * `mountId` fica no cavaleiro (aponta para a montaria) e `riderId` na montaria.
 * O legado exigia tamanhos diferentes; os tokens do V5 não têm tamanho, então essa regra não existe aqui.
 */
export const MOUNT_MAX_DISTANCE = 1;

export function mountPartner(board: Pick<BoardState, "tokens">, token: BoardToken): BoardToken | undefined {
  const id = token.mountId || token.riderId;
  return id ? board.tokens.find((entry) => entry.id === id) : undefined;
}

export function isMounted(token: BoardToken): boolean { return Boolean(token.mountId || token.riderId); }

/** Mensagem do motivo pelo qual não dá para montar, ou `null` se pode. */
export function mountError(board: Pick<BoardState, "tokens">, rider: BoardToken, mount: BoardToken): string | null {
  if (rider.id === mount.id) return "Escolha uma montaria diferente do cavaleiro.";
  if (rider.defeated || mount.defeated) return "Não dá para montar com um token derrotado.";
  if (isMounted(rider)) return `${rider.name} já está numa montaria.`;
  if (isMounted(mount)) return `${mount.name} já está sendo montado.`;
  if (floorOf(rider) !== floorOf(mount)) return "Os tokens estão em andares diferentes.";
  const bySize = mountSizeError(rider, mount);
  if (bySize) return bySize;
  // Só dá para montar na casa ao lado (diagonal conta como ao lado).
  const distance = Math.max(Math.abs(rider.gx - mount.gx), Math.abs(rider.gy - mount.gy));
  if (distance > MOUNT_MAX_DISTANCE) return `${rider.name} precisa estar a 1 quadrado de distância de ${mount.name} para montar.`;
  return null;
}

/** Casa livre mais próxima da montaria para o cavaleiro descer (legado: `_acharPosAdjacente`). */
export function dismountCell(board: BoardState, rider: BoardToken, mount: BoardToken): { x: number; y: number } | null {
  let best: { x: number; y: number; score: number } | null = null;
  const block = Math.max(1, footprintOf(sizeOf(mount)));
  for (let dx = -1; dx <= block; dx += 1) for (let dy = -1; dy <= block; dy += 1) {
    if (dx >= 0 && dx < block && dy >= 0 && dy < block) continue; // dentro do bloco da montaria
    const x = mount.gx + dx;
    const y = mount.gy + dy;
    if (x < 0 || y < 0 || x >= board.map.cols || y >= board.map.rows) continue;
    if (board.map.terrain[`${x},${y}`]?.type === "blocked") continue;
    if (board.tokens.some((entry) => entry.id !== rider.id && entry.id !== mount.id && !entry.hidden && !entry.defeated && floorOf(entry) === floorOf(mount) && tokenCovers(entry, x, y))) continue;
    const score = Math.abs(dx) + Math.abs(dy); // ortogonal antes de diagonal
    if (!best || score < best.score) best = { x, y, score };
  }
  return best ? { x: best.x, y: best.y } : null;
}
