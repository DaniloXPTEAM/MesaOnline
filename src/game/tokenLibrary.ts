/**
 * Biblioteca de tokens: imagens de miniatura que a pessoa importa e reutiliza nas mesas.
 *
 * Guarda no navegador (IndexedDB; sem ele, na memória da sessão). Com a pessoa logada no servidor
 * de contas (`server/`, rotas `/api/tokens`), os tokens também vivem na conta e aparecem em qualquer
 * navegador; sem servidor ou sem login, tudo continua funcionando só no navegador.
 */
/**
 * A que o token está ligado: uma ficha (herói), uma ameaça do bestiário ou um tipo de objeto da cena (`item`, `chest`,
 * `treasure`). Ao entrar no mapa, ele já nasce com os dados dela (ou vira o objeto, com a imagem do token).
 */
export interface TokenLink {
  kind: "character" | "threat" | "object";
  id: string;
  label: string;
}

/** Dados de um token criado na janela "Novo token": o que ele traz quando entra no mapa (sem vínculo com ficha ou ameaça). */
export interface TokenTemplate {
  side: "heroes" | "threats";
  hp: number;
  pm: number;
  defense: number;
  aura?: { radiusM: number; color: string };
  loot?: string[];
}

export interface LibraryToken {
  id: string;
  name: string;
  /** imagem (data URL) */
  image: string;
  addedAt: number;
  /** já está gravado na conta (servidor de contas) */
  cloud?: boolean;
  link?: TokenLink;
  template?: TokenTemplate;
}

/** Mesma chave e mesmo endereço que o Portal usa para o login (fica na mesma origem). */
const AUTH_KEY = "tormenta20_online_auth_token_v1";
const API_BASE = (import.meta.env?.VITE_API_BASE as string | undefined) || "http://localhost:4000";

function authToken(): string | null {
  try { return localStorage.getItem(AUTH_KEY); } catch { return null; }
}

/** Há login no servidor de contas? (não garante que o servidor esteja no ar) */
export const hasAccount = (): boolean => Boolean(authToken());

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authToken();
  if (!token) throw new Error("Sem login.");
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string })?.error || `Erro ${response.status}`);
  return body as T;
}

const DB_NAME = "mesa-token-library";
const STORE = "tokens";
const memory = new Map<string, LibraryToken>();

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

async function listLocal(): Promise<LibraryToken[]> {
  const db = await open();
  const stored = db ? (await run<LibraryToken[]>(db, "readonly", (store) => store.getAll() as IDBRequest<LibraryToken[]>)) ?? [] : [];
  db?.close();
  const merged = new Map<string, LibraryToken>([...stored.map((token) => [token.id, token] as const), ...memory]);
  return [...merged.values()];
}

export async function listLibraryTokens(): Promise<LibraryToken[]> {
  const local = await listLocal();
  let remote: LibraryToken[] = [];
  if (hasAccount()) {
    try { remote = (await api<{ tokens: LibraryToken[] }>("/api/tokens")).tokens.map((token) => ({ ...token, cloud: true })); } catch { /* servidor fora do ar: só o navegador */ }
  }
  const cloudIds = new Set(remote.map((token) => token.id));
  // um token que já subiu para a conta não aparece duas vezes (o da conta vale)
  const merged = new Map<string, LibraryToken>([...local.filter((token) => !cloudIds.has(token.id)).map((token) => [token.id, token] as const), ...remote.map((token) => [token.id, token] as const)]);
  return [...merged.values()].sort((a, b) => b.addedAt - a.addedAt);
}

/** Sobe para a conta um token que só existe no navegador; devolve o token já com o id da conta. */
async function uploadToken(token: LibraryToken): Promise<LibraryToken> {
  const { token: saved } = await api<{ token: LibraryToken }>("/api/tokens", { method: "POST", body: JSON.stringify({ name: token.name, image: token.image, link: token.link, template: token.template }) });
  await removeLocal(token.id);
  return { ...saved, cloud: true };
}

/** Envia para a conta todos os tokens que só estão no navegador. Devolve quantos subiram e a primeira falha. */
export async function syncLibraryToAccount(): Promise<{ sent: number; error?: string }> {
  let sent = 0;
  for (const token of (await listLocal()).filter((entry) => !entry.cloud)) {
    try { await uploadToken(token); sent += 1; } catch (cause) { return { sent, error: (cause as Error).message }; }
  }
  return { sent };
}

async function putLocal(token: LibraryToken): Promise<void> {
  memory.set(token.id, token);
  const db = await open();
  if (db) { await run(db, "readwrite", (store) => store.put(token)); db.close(); }
}

async function removeLocal(id: string): Promise<void> {
  memory.delete(id);
  const db = await open();
  if (db) { await run(db, "readwrite", (store) => store.delete(id)); db.close(); }
}

/** Grava o token. Com login, vai para a conta; se o servidor falhar, fica no navegador e o motivo volta em `error`. */
export async function saveLibraryToken(token: LibraryToken): Promise<{ cloud: boolean; error?: string }> {
  await putLocal(token);
  if (!hasAccount()) return { cloud: false };
  try { await uploadToken(token); return { cloud: true }; } catch (cause) { return { cloud: false, error: (cause as Error).message }; }
}

/** Liga o token a uma ficha ou ameaça (ou desliga, com `null`). Token da conta vai ao servidor; o do navegador fica no navegador. */
export async function setLibraryTokenLink(token: LibraryToken, link: TokenLink | null): Promise<{ error?: string }> {
  if (token.cloud) {
    try { await api(`/api/tokens/${encodeURIComponent(token.id)}`, { method: "PATCH", body: JSON.stringify({ link }) }); return {}; } catch (cause) { return { error: (cause as Error).message }; }
  }
  const next: LibraryToken = { ...token };
  if (link) next.link = link; else delete next.link;
  await putLocal(next);
  return {};
}

export async function deleteLibraryToken(id: string): Promise<void> {
  await removeLocal(id);
  if (!hasAccount()) return;
  try { await api(`/api/tokens/${encodeURIComponent(id)}`, { method: "DELETE" }); } catch { /* não era da conta, ou servidor fora do ar */ }
}

/** Nome exibido a partir do nome do arquivo ("goblin-guerreiro.png" → "goblin guerreiro"). */
export function tokenNameFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Token";
}
