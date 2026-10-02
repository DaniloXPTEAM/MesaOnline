/**
 * ÁUDIO DO COMPUTADOR PARA TODOS. Um arquivo que o Mestre escolhe no PC só
 * existe no navegador dele; para os jogadores ouvirem, o Mestre o envia em
 * pedaços pela mesma conexão da sala e cada jogador o remonta e toca.
 * Limite de 25 MB por arquivo para não travar a conexão.
 */
export const MAX_SHARED_AUDIO_BYTES = 25 * 1024 * 1024;
/**
 * Tamanho de cada pedaço do áudio (antes de virar base64, +33%). Fica abaixo de 16 KB por mensagem: acima disso a conexão
 * do PeerJS (serialização JSON, que não fragmenta) deixou de entregar os pedaços numa sala real (teste com dois navegadores).
 */
export const CHUNK_BYTES = 8 * 1024;
export const SHARED_PREFIX = "shared:";

export interface AudioChunk {
  id: string;
  name: string;
  mime: string;
  index: number;
  total: number;
  /** pedaço do arquivo em base64 */
  data: string;
}

const ID_PATTERN = /^[\w-]{6,64}$/;

/** `shared:abc123` → `abc123` (ou null se não for um id válido). */
export function sharedIdFromUrl(url: string): string | null {
  if (!url.startsWith(SHARED_PREFIX)) return null;
  const id = url.slice(SHARED_PREFIX.length);
  return ID_PATTERN.test(id) ? id : null;
}

/* ---------------------------- lado do Mestre ---------------------------- */

const byBlobUrl = new Map<string, { id: string; blob: Blob; name: string }>();
const chunkCache = new Map<string, AudioChunk[]>();

/** Registra o arquivo aberto (blob:) para poder enviá-lo. Devolve o id, ou null se passa do limite. */
export function registerSharedAudio(blobUrl: string, blob: Blob, name: string): string | null {
  if (blob.size > MAX_SHARED_AUDIO_BYTES) return null;
  const known = byBlobUrl.get(blobUrl);
  if (known) return known.id;
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  byBlobUrl.set(blobUrl, { id, blob, name });
  return id;
}

export function sharedIdForBlobUrl(blobUrl: string): string | undefined {
  return byBlobUrl.get(blobUrl)?.id;
}

/** O endereço local (blob:) de um arquivo que este navegador registrou; só o Mestre o tem. */
export function blobUrlForSharedId(id: string): string | undefined {
  for (const [url, entry] of byBlobUrl) if (entry.id === id) return url;
  return undefined;
}

function readBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Não consegui ler o áudio."));
    reader.readAsDataURL(blob);
  });
}

/** Divide o arquivo registrado em pedaços prontos para a rede (guarda em cache). */
export async function chunksFor(id: string): Promise<AudioChunk[]> {
  const cached = chunkCache.get(id);
  if (cached) return cached;
  const entry = [...byBlobUrl.values()].find((item) => item.id === id);
  if (!entry) return [];
  const total = Math.max(1, Math.ceil(entry.blob.size / CHUNK_BYTES));
  const chunks: AudioChunk[] = [];
  for (let index = 0; index < total; index += 1) {
    const part = entry.blob.slice(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES);
    chunks.push({ id, name: entry.name, mime: entry.blob.type || "audio/mpeg", index, total, data: await readBase64(part) });
  }
  chunkCache.set(id, chunks);
  return chunks;
}

/* --------------------------- lado do jogador ---------------------------- */

interface Incoming { parts: Array<string | undefined>; received: number; total: number; mime: string }
const partial = new Map<string, Incoming>();
const finished = new Map<string, string>(); // id → endereço temporário (blob:)
const waiters = new Map<string, Array<(url: string) => void>>();

function decode(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Recebe um pedaço; quando o arquivo completa, deixa-o pronto para tocar. */
export function receiveAudioChunk(raw: unknown): void {
  const chunk = raw as Partial<AudioChunk> & Record<string, unknown>;
  if (!chunk || typeof chunk !== "object") return;
  const { id, index, total, data, mime } = chunk as AudioChunk;
  const maxTotal = Math.ceil(MAX_SHARED_AUDIO_BYTES / CHUNK_BYTES) + 1;
  if (typeof id !== "string" || !ID_PATTERN.test(id) || finished.has(id)) return;
  if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1 || total > maxTotal || index < 0 || index >= total) return;
  if (typeof data !== "string" || data.length > CHUNK_BYTES * 2) return;
  const entry = partial.get(id) || { parts: new Array<string | undefined>(total).fill(undefined), received: 0, total, mime: typeof mime === "string" && /^(audio|video|image)\//.test(mime) ? mime : "audio/mpeg" };
  if (entry.total !== total) return;
  if (entry.parts[index] === undefined) { entry.parts[index] = data; entry.received += 1; }
  partial.set(id, entry);
  if (entry.received < entry.total) return;
  try {
    const blob = new Blob(entry.parts.map((part) => decode(part || "")), { type: entry.mime });
    const url = URL.createObjectURL(blob);
    finished.set(id, url);
    partial.delete(id);
    (waiters.get(id) || []).forEach((resolve) => resolve(url));
    waiters.delete(id);
  } catch { partial.delete(id); }
}

/** Endereço do arquivo recebido; espera chegar (até 90 s) se ainda estiver a caminho. */
export function sharedAudioUrl(id: string, timeoutMs = 90_000): Promise<string> {
  const ready = finished.get(id);
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("O áudio não chegou.")), timeoutMs);
    waiters.set(id, [...(waiters.get(id) || []), (url) => { clearTimeout(timer); resolve(url); }]);
  });
}
