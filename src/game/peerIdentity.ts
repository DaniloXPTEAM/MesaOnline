/**
 * Identidade PeerJS persistente do jogador, escopada por mesa.
 *
 * Por que isto existe: `BOARD.tokens[].controlledBy` guarda o peerId do dono.
 * Enquanto o PeerJS gerava um id novo a cada conexão, todo F5 quebrava esse
 * vínculo e o Mestre precisava reatribuir cada token na mão. Persistir a
 * identidade por sala mantém `controlledBy` válido entre recargas, fechamento
 * da aba, queda de rede e nova entrada na mesma mesa.
 *
 * Isto NÃO é um mecanismo de autoridade. O Mestre continua confiando apenas em
 * `connection.peer` (o id que o servidor de sinalização atribuiu ao socket).
 * Persistir o id só garante que o jogador volte a se apresentar com o mesmo
 * id — nunca que ele controle algo por afirmar quem é no payload.
 */

/** Chave única desta feature. Guarda identidades por sala + a última sessão. */
export const PEER_IDENTITY_KEY = "modernrpg_armada_peer_identity_v1";

export type SessionRole = "master" | "player";

export interface MultiplayerSession {
  role: SessionRole;
  roomCode: string;
}

interface IdentityStore {
  /** roomCode → peerId estável deste navegador naquela mesa. */
  rooms: Record<string, string>;
  /** Última sessão ativa; usada para reconectar sozinho depois de um reload. */
  session?: MultiplayerSession;
}

const EMPTY: IdentityStore = { rooms: {} };
/** Guarda poucas mesas: identidade antiga de sala que não se usa mais é ruído. */
const MAX_ROOMS = 12;

export function normalizeRoomCode(code: string): string {
  return String(code || "").trim().toUpperCase();
}

/** Id determinístico do Mestre: derivado só do código da sala. */
export function masterPeerId(roomCode: string): string {
  return `modernrpg-armada-${normalizeRoomCode(roomCode)}`;
}

function readStore(): IdentityStore {
  if (typeof localStorage === "undefined") return { rooms: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(PEER_IDENTITY_KEY) || "null") as Partial<IdentityStore> | null;
    if (!parsed || typeof parsed !== "object") return { rooms: {} };
    const rooms: Record<string, string> = {};
    for (const [room, peerId] of Object.entries(parsed.rooms || {})) {
      if (typeof peerId === "string" && peerId) rooms[normalizeRoomCode(room)] = peerId;
    }
    const raw = parsed.session;
    const session = raw && typeof raw.roomCode === "string" && (raw.role === "master" || raw.role === "player")
      ? { role: raw.role, roomCode: normalizeRoomCode(raw.roomCode) }
      : undefined;
    return session ? { rooms, session } : { rooms };
  } catch {
    return { rooms: {} };
  }
}

function writeStore(store: IdentityStore): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PEER_IDENTITY_KEY, JSON.stringify(store));
  } catch {
    // Navegador sem storage (aba anônima restrita): a identidade vira efêmera
    // nesta sessão em vez de derrubar a mesa.
  }
}

/** Sufixo aleatório curto; só letras e números, aceitos pelo PeerServer. */
function randomSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

/**
 * Identidade estável deste navegador na sala informada.
 * Gera e persiste na primeira entrada; nas seguintes devolve sempre a mesma.
 */
export function playerPeerIdFor(roomCode: string): string {
  const room = normalizeRoomCode(roomCode);
  const store = readStore();
  const existing = store.rooms[room];
  if (existing) return existing;
  const peerId = `modernrpg-armada-player-${room}-${randomSuffix()}`;
  const entries = Object.entries(store.rooms).slice(-(MAX_ROOMS - 1));
  writeStore({ ...store, rooms: { ...Object.fromEntries(entries), [room]: peerId } });
  return peerId;
}

/** Identidade já conhecida para a sala, sem criar uma nova. */
export function knownPlayerPeerId(roomCode: string): string | null {
  return readStore().rooms[normalizeRoomCode(roomCode)] || null;
}

export function readSession(): MultiplayerSession | null {
  return readStore().session ?? null;
}

export function rememberSession(session: MultiplayerSession): void {
  const store = readStore();
  writeStore({ ...store, session: { role: session.role, roomCode: normalizeRoomCode(session.roomCode) } });
}

/**
 * Esquece apenas a sessão ativa (saída explícita da mesa).
 * As identidades por sala permanecem: quem volta depois continua sendo o mesmo
 * jogador e não perde os tokens que o Mestre já lhe atribuiu.
 */
export function forgetSession(): void {
  const store = readStore();
  writeStore({ rooms: store.rooms });
}
