import type { BoardToken } from "./types";

/**
 * Modo de movimento do token: andar, voar ou escavar. O motor (`tactics/engine/movement.ts`) já calcula os
 * três (voo ignora terreno difícil, elevação e baús; escavação ignora paredes de superfície); aqui fica a
 * regra pura de qual modo vale para cada token, usada pela gaveta, pelo palco e pelos comandos do Mestre.
 */
export type MoveMode = "walk" | "fly" | "burrow";

export const MOVE_MODE_LABEL: Record<MoveMode, string> = { walk: "Andar", fly: "Voar", burrow: "Escavar" };

/** Deslocamento do token no modo, em metros (0 = não tem esse deslocamento). */
export function speedFor(token: Pick<BoardToken, "movementM" | "flyM" | "burrowM">, mode: MoveMode): number {
  if (mode === "fly") return token.flyM || 0;
  if (mode === "burrow") return token.burrowM || 0;
  return token.movementM || 0;
}

/** Modos que o token tem (andar sempre aparece). */
export function availableMoveModes(token: Pick<BoardToken, "movementM" | "flyM" | "burrowM">): MoveMode[] {
  return (["walk", "fly", "burrow"] as MoveMode[]).filter((mode) => mode === "walk" || speedFor(token, mode) > 0);
}

/** O modo preferido, se o token o tem; senão, andar. */
export function effectiveMoveMode(token: Pick<BoardToken, "movementM" | "flyM" | "burrowM"> | undefined, preferred: MoveMode): MoveMode {
  if (!token) return "walk";
  return availableMoveModes(token).includes(preferred) ? preferred : "walk";
}

/** Validação do lado do Mestre: modo desconhecido vira andar; pedir um modo que o token não tem é erro. */
export function sanitizeMoveMode(token: Pick<BoardToken, "name" | "movementM" | "flyM" | "burrowM">, requested: unknown): MoveMode {
  if (requested !== "fly" && requested !== "burrow") return "walk";
  if (speedFor(token, requested) <= 0) throw new Error(`${token.name} não ${requested === "fly" ? "voa" : "escava"}.`);
  return requested;
}
