/**
 * Mídia no palco: o Mestre guarda imagens e vídeos e os mostra para todos por cima do mapa (a apresentação de um
 * personagem, uma ilustração da cena…). Só o Mestre fecha.
 *
 * Este arquivo cuida da BIBLIOTECA do Mestre (fica no navegador dele, em IndexedDB; sem ele, na memória da sessão) e
 * dos tipos. O que está sendo mostrado agora vive em `board.stageMedia` (ver `showStageMedia` em `vttBridge.ts`), e o arquivo
 * chega aos jogadores em pedaços pela conexão da sala, pelo mesmo caminho do áudio do computador (`sharedAudio.ts`).
 */
export type StageMediaKind = "image" | "video";

/** O que está no palco agora. `src` é `shared:<id>` (arquivo enviado pela sala) ou um endereço direto. */
export interface StageMedia {
  id: string;
  kind: StageMediaKind;
  name: string;
  src: string;
  shownAt: number;
}

export interface MediaItem {
  id: string;
  name: string;
  kind: StageMediaKind;
  mime: string;
  size: number;
  addedAt: number;
  blob: Blob;
}

/** Vídeo e imagem usam o limite do envio pela sala (`MAX_SHARED_AUDIO_BYTES`, 25 MB); imagem é menor porque não precisa de mais. */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);

export function mediaKindOf(mime: string): StageMediaKind | null {
  if (IMAGE_TYPES.has(mime)) return "image";
  if (VIDEO_TYPES.has(mime)) return "video";
  return null;
}

export type MediaCheck = { ok: true; kind: StageMediaKind } | { ok: false; error: string };

/** Confere tipo e tamanho antes de guardar ou mostrar. */
export function checkMediaFile(file: { type: string; size: number }): MediaCheck {
  const kind = mediaKindOf(file.type);
  if (!kind) return { ok: false, error: "Formato não aceito. Use imagem (PNG, JPG, WEBP, GIF) ou vídeo (MP4, WEBM, OGG)." };
  const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) return { ok: false, error: `Arquivo grande demais (${(file.size / 1048576).toFixed(1)} MB; o limite é ${limit / 1048576} MB para ${kind === "video" ? "vídeo" : "imagem"}).` };
  if (file.size === 0) return { ok: false, error: "O arquivo está vazio." };
  return { ok: true, kind };
}

export function mediaNameFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Mídia";
}

/* ------------------------------ biblioteca ------------------------------ */

const DB_NAME = "mesa-media-library";
const STORE = "media";
const memory = new Map<string, MediaItem>();

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { request.result.createObjectStore(STORE, { keyPath: "id" }); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

function run<T>(db: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}

export async function listMedia(): Promise<MediaItem[]> {
  const db = await open();
  const stored = db ? (await run<MediaItem[]>(db, "readonly", (store) => store.getAll() as IDBRequest<MediaItem[]>)) ?? [] : [];
  db?.close();
  const merged = new Map<string, MediaItem>([...stored.map((item) => [item.id, item] as const), ...memory]);
  return [...merged.values()].sort((a, b) => b.addedAt - a.addedAt);
}

/** Guarda uma imagem ou vídeo na biblioteca. Lança erro com o motivo se o arquivo não servir. */
export async function saveMedia(file: Blob, name: string): Promise<MediaItem> {
  const check = checkMediaFile(file);
  if (!check.ok) throw new Error(check.error);
  const item: MediaItem = { id: `media-${crypto.randomUUID()}`, name: name.trim().slice(0, 80) || "Mídia", kind: check.kind, mime: file.type, size: file.size, addedAt: Date.now(), blob: file };
  memory.set(item.id, item);
  const db = await open();
  if (db) { await run(db, "readwrite", (store) => store.put(item)); db.close(); }
  return item;
}

export async function deleteMedia(id: string): Promise<void> {
  memory.delete(id);
  const db = await open();
  if (db) { await run(db, "readwrite", (store) => store.delete(id)); db.close(); }
}
