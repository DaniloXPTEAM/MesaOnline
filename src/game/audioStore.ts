/**
 * Guarda os áudios que o Mestre escolhe no computador (faixas do Jukebox) no
 * próprio navegador (IndexedDB), para continuarem lá depois de recarregar a
 * página. Sem IndexedDB (testes, navegador restrito), usa a memória da sessão.
 */
const DB_NAME = "armada-audio";
const STORE = "files";
const memory = new Map<string, Blob>();

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { request.result.createObjectStore(STORE); };
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

export async function saveAudio(key: string, blob: Blob): Promise<void> {
  memory.set(key, blob);
  const db = await open();
  if (db) { await run(db, "readwrite", (store) => store.put(blob, key)); db.close(); }
}

export async function loadAudio(key: string): Promise<Blob | null> {
  const cached = memory.get(key);
  if (cached) return cached;
  const db = await open();
  if (!db) return null;
  const found = await run<Blob>(db, "readonly", (store) => store.get(key) as IDBRequest<Blob>);
  db.close();
  if (found) memory.set(key, found);
  return found || null;
}

export async function deleteAudio(key: string): Promise<void> {
  memory.delete(key);
  const db = await open();
  if (db) { await run(db, "readwrite", (store) => store.delete(key)); db.close(); }
}
