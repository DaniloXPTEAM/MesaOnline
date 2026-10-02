/**
 * SOUNDBOARD: sons curtos escolhidos por busca no Freesound (como no VTT
 * antigo) e guardados no navegador. Não há arquivos de som no projeto: cada
 * som vem de uma busca do próprio Mestre. A chave da API é do usuário e fica
 * só no navegador dele (nunca vai para o código nem para a rede da mesa).
 */
import { synthIdFromUrl } from "./sfxSynth";

export interface SoundSlot { id: string; label: string; url: string }
export interface SoundHit { id: string; name: string; duration: number; url: string }

const KEY_STORAGE = "armada-freesound-key";
const BOARD_STORAGE = "armada-soundboard-v1";
const MAX_SLOTS = 24;

export function getFreesoundKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) || ""; } catch { return ""; }
}

export function setFreesoundKey(key: string): void {
  try { localStorage.setItem(KEY_STORAGE, key.trim()); } catch { /* armazenamento indisponível */ }
}

export function loadSoundboard(): SoundSlot[] {
  try {
    const value = JSON.parse(localStorage.getItem(BOARD_STORAGE) || "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter((slot): slot is SoundSlot => Boolean(slot) && typeof slot.id === "string" && typeof slot.url === "string")
      .map((slot) => ({ id: slot.id, label: String(slot.label || "Som").slice(0, 60), url: slot.url }))
      .slice(0, MAX_SLOTS);
  } catch { return []; }
}

function save(slots: SoundSlot[]): SoundSlot[] {
  try { localStorage.setItem(BOARD_STORAGE, JSON.stringify(slots)); } catch { /* armazenamento cheio */ }
  return slots;
}

/** Adiciona (ou atualiza) um som no soundboard. */
export function addSound(slot: SoundSlot): SoundSlot[] {
  const rest = loadSoundboard().filter((entry) => entry.id !== slot.id);
  return save([...rest, { id: slot.id, label: slot.label.slice(0, 60), url: slot.url }].slice(-MAX_SLOTS));
}

export function removeSound(id: string): SoundSlot[] {
  return save(loadSoundboard().filter((entry) => entry.id !== id));
}

/** Só endereços http(s) ou do próprio site tocam para toda a mesa. */
export function isPlayableUrl(url: string): boolean {
  return /^https:\/\//i.test(url) || /^\/(?!\/)/.test(url) || synthIdFromUrl(url) !== null;
}

type Fetcher = (input: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/** Busca no Freesound (até 20 resultados) e devolve a prévia em MP3 de cada som. */
export async function searchFreesound(query: string, key: string, fetcher: Fetcher = (input) => fetch(input)): Promise<SoundHit[]> {
  const text = query.trim();
  if (!text) return [];
  if (!key.trim()) throw new Error("Informe a chave da API do Freesound.");
  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(text)}&fields=id,name,duration,previews&page_size=20&token=${encodeURIComponent(key.trim())}`;
  const response = await fetcher(url);
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Chave do Freesound recusada." : `Freesound respondeu ${response.status}.`);
  const data = await response.json() as { results?: Array<{ id?: number; name?: string; duration?: number; previews?: Record<string, string> }> };
  return (data.results || []).flatMap((entry) => {
    const preview = entry.previews?.["preview-hq-mp3"] || entry.previews?.["preview-lq-mp3"];
    if (!entry.id || !preview) return [];
    return [{ id: String(entry.id), name: String(entry.name || `Som ${entry.id}`), duration: Number(entry.duration) || 0, url: preview }];
  });
}
