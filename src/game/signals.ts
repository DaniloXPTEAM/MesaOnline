/**
 * Sinais efêmeros entre a mesa (ping no mapa e faixa do Jukebox). Não fazem
 * parte do BOARD: não são salvos nem entram no snapshot. Viajam pela mesma
 * conexão do multiplayer e o Mestre valida antes de reenviar.
 */
import { synthIdFromUrl } from "./sfxSynth";
import { SHARED_PREFIX, sharedIdFromUrl } from "./sharedAudio";

export type Signal =
  | { kind: "ping"; x: number; y: number }
  | { kind: "jukebox"; url: string; title: string; playing: boolean; loop: boolean }
  | { kind: "sfx"; url: string };

const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);

/** Aceita só o formato conhecido; qualquer outra coisa vira null. */
export function sanitizeSignal(raw: unknown): Signal | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.kind === "ping" && finite(value.x) && finite(value.y)) {
    return { kind: "ping", x: Math.max(0, Math.min(999, Math.floor(Number(value.x)))), y: Math.max(0, Math.min(999, Math.floor(Number(value.y)))) };
  }
  if (value.kind === "jukebox" && typeof value.url === "string" && value.url.length <= 2048 && (!value.url.startsWith(SHARED_PREFIX) || sharedIdFromUrl(value.url) !== null)) {
    return {
      kind: "jukebox",
      url: value.url,
      title: typeof value.title === "string" ? value.title.slice(0, 120) : "",
      playing: value.playing === true,
      loop: value.loop !== false,
    };
  }
  if (value.kind === "sfx" && typeof value.url === "string" && value.url.length <= 2048 && (/^https:\/\//i.test(value.url) || /^\/(?!\/)/.test(value.url) || synthIdFromUrl(value.url) !== null)) {
    return { kind: "sfx", url: value.url };
  }
  return null;
}

/** Só o Mestre pode mandar a faixa; o ping vale de qualquer participante. */
export function signalAllowedFrom(signal: Signal, senderIsMaster: boolean): boolean {
  return signal.kind === "ping" || senderIsMaster;
}

const EVENT = "mesa-signal";

export function deliverSignal(signal: Signal): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<Signal>(EVENT, { detail: signal }));
}

export function onSignals(listener: (signal: Signal) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<Signal>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
