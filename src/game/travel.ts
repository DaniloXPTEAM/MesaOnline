/**
 * VIAGEM E PASSAGEM DE DIA.
 *
 * Recuperado de `Vtt/app.js` (`avancarDia`, `updateViagemUI`,
 * `encDiasSemEncontro`): cada dia de viagem aumenta a chance de encontro.
 *
 * NÃO é um sistema de campanha paralelo — é um contador de cena, guardado no
 * BOARD junto do resto do estado, como pedia o contrato.
 */
export interface TravelState {
  /** dias percorridos sem encontro */
  days: number;
  /** total de dias de viagem acumulados na cena */
  total: number;
  /** duração da viagem em andamento (dias); 0 = sem viagem marcada, os dias só se acumulam */
  planned: number;
  /** dias já vividos nesta viagem */
  done: number;
  /** mapa (cena) preparado para o encontro; o Mestre vai até ele quando o encontro acontece */
  sceneId?: string;
}

/** O que aparece no palco, para todos, quando a viagem tem um encontro. */
export interface TravelEvent {
  id: string;
  day: number;
  title: string;
  text: string;
  pag?: string;
}

export const DEFAULT_TRAVEL: TravelState = { days: 0, total: 0, planned: 0, done: 0 };

export function travelState(partial?: Partial<TravelState> | null): TravelState {
  return { ...DEFAULT_TRAVEL, ...(partial || {}) };
}

/** Chance de encontro do VTT antigo: 5% base, +5% por dia sem encontro. */
export function encounterChance(days: number): number {
  return Math.min(95, 5 + Math.max(0, days) * 5);
}

/** Avança um dia. Devolve o novo estado e a chance resultante. */
export function advanceDay(current: TravelState): { next: TravelState; chance: number; message: string } {
  const next: TravelState = { ...current, days: current.days + 1, total: current.total + 1, done: current.done + 1 };
  const chance = encounterChance(next.days);
  return {
    next, chance,
    message: `A viagem avança${next.planned ? `: dia ${next.done} de ${next.planned}` : ""}. ${next.days} ${next.days === 1 ? "dia" : "dias"} sem encontro, chance de ${chance}% no próximo.${next.planned && next.done >= next.planned ? " A viagem terminou." : ""}`,
  };
}

/** Marca que houve um encontro: zera o acumulado, mantém o total. */
export function resetAfterEncounter(current: TravelState): { next: TravelState; message: string } {
  const next: TravelState = { ...current, days: 0, total: current.total + 1, done: current.done + 1 };
  return {
    next,
    message: `Encontro na estrada${next.planned ? ` no dia ${next.done} de ${next.planned}` : ""}. O contador de dias sem encontro volta a zero.${next.planned && next.done >= next.planned ? " A viagem terminou." : ""}`,
  };
}

/** Começa uma viagem de `planned` dias (1 a 365): zera o que já andou. */
export function startTrip(current: TravelState, planned: number, sceneId?: string): TravelState {
  return { ...current, planned: Math.max(1, Math.min(365, Math.trunc(planned) || 1)), done: 0, days: 0, sceneId: sceneId ?? current.sceneId };
}
