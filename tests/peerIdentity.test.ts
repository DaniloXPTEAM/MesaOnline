import { beforeEach, describe, expect, it, vi } from "vitest";

/** Dublês mínimos do PeerJS: só o suficiente para exercitar identidade/reconexão. */
const fake = vi.hoisted(() => {
  type Listener = (...args: never[]) => void;

  class Emitter {
    private listeners = new Map<string, Set<Listener>>();
    on(event: string, handler: Listener) {
      const set = this.listeners.get(event) || new Set<Listener>();
      set.add(handler);
      this.listeners.set(event, set);
      return this;
    }
    off(event: string, handler: Listener) {
      this.listeners.get(event)?.delete(handler);
      return this;
    }
    emit(event: string, ...args: unknown[]) {
      [...(this.listeners.get(event) || [])].forEach((handler) => (handler as (...rest: unknown[]) => void)(...args));
    }
  }

  class FakeConnection extends Emitter {
    peer: string;
    open = false;
    closed = false;
    sent: Array<{ type: string; payload: Record<string, unknown> }> = [];
    constructor(peer: string) {
      super();
      this.peer = peer;
    }
    accept() {
      this.open = true;
      this.emit("open");
    }
    send(message: unknown) {
      this.sent.push(message as { type: string; payload: Record<string, unknown> });
    }
    close() {
      if (this.closed) return;
      this.closed = true;
      this.open = false;
      this.emit("close");
    }
  }

  class FakePeer extends Emitter {
    static instances: FakePeer[] = [];
    id: string;
    destroyed = false;
    reconnected = 0;
    connections: FakeConnection[] = [];
    constructor(id: string) {
      super();
      this.id = id;
      FakePeer.instances.push(this);
    }
    connect(peerId: string) {
      const connection = new FakeConnection(peerId);
      this.connections.push(connection);
      return connection;
    }
    destroy() {
      this.destroyed = true;
    }
    reconnect() {
      this.reconnected += 1;
    }
  }

  return { FakePeer, FakeConnection };
});

vi.mock("peerjs", () => ({ default: fake.FakePeer }));

const { ArmadaMultiplayer } = await import("../src/game/multiplayer");
const { PEER_IDENTITY_KEY, forgetSession, playerPeerIdFor, readSession } = await import("../src/game/peerIdentity");
type Multiplayer = InstanceType<typeof ArmadaMultiplayer>;

function makeMultiplayer() {
  return new ArmadaMultiplayer({
    getSnapshot: () => ({}),
    applySnapshot: () => {},
    runCommand: () => {},
    onState: () => {},
  });
}

/** Leva um `join()` até a conexão aberta, devolvendo o peer e a conexão falsos. */
async function completeJoin(multiplayer: Multiplayer, code: string) {
  const pending = multiplayer.join(code);
  const peer = fake.FakePeer.instances[fake.FakePeer.instances.length - 1];
  peer.emit("open", peer.id);
  await Promise.resolve();
  await Promise.resolve();
  const connection = peer.connections[0];
  connection.accept();
  await pending;
  return { peer, connection };
}

beforeEach(() => {
  localStorage.clear();
  fake.FakePeer.instances = [];
});

describe("identidade PeerJS persistente por mesa", () => {
  it("reutiliza o mesmo peerId na mesma sala e isola salas diferentes", () => {
    const first = playerPeerIdFor("W75RT5");
    expect(playerPeerIdFor("W75RT5")).toBe(first);
    expect(playerPeerIdFor("w75rt5")).toBe(first); // código é normalizado
    expect(playerPeerIdFor("OUTRA1")).not.toBe(first);
    expect(first).toContain("W75RT5");
    expect(first).not.toBe("modernrpg-armada-W75RT5"); // nunca colide com o Mestre
    expect(JSON.parse(localStorage.getItem(PEER_IDENTITY_KEY)!).rooms).toMatchObject({ W75RT5: first });
  });

  it("sair da mesa esquece a sessão mas preserva a identidade da sala", async () => {
    const multiplayer = makeMultiplayer();
    const { peer } = await completeJoin(multiplayer, "SALA01");
    expect(readSession()).toEqual({ role: "player", roomCode: "SALA01" });

    multiplayer.disconnect();
    expect(peer.destroyed).toBe(true);
    expect(readSession()).toBeNull();
    expect(playerPeerIdFor("SALA01")).toBe(peer.id); // volta como o mesmo jogador
  });

  it("mantém a identidade entre reconexões, que é o que preserva controlledBy", async () => {
    const first = makeMultiplayer();
    const initial = await completeJoin(first, "SALA02");
    first.disconnect();

    forgetSession();
    const second = makeMultiplayer();
    const again = await completeJoin(second, "SALA02");
    expect(again.peer.id).toBe(initial.peer.id);
  });
});

describe("colisão de peerId", () => {
  it("retenta o MESMO id quando ele ainda está registrado e nunca inventa outro", async () => {
    vi.useFakeTimers();
    try {
      const multiplayer = makeMultiplayer();
      const expected = playerPeerIdFor("SALA03");
      const pending = multiplayer.join("SALA03");

      const first = fake.FakePeer.instances[0];
      expect(first.id).toBe(expected);
      first.emit("error", Object.assign(new Error("ID is taken"), { type: "unavailable-id" }));
      expect(first.destroyed).toBe(true);
      expect(multiplayer.snapshot().status).toBe("reconnecting");

      await vi.advanceTimersByTimeAsync(500);
      const second = fake.FakePeer.instances[1];
      expect(second.id).toBe(expected);

      second.emit("open", second.id);
      await vi.advanceTimersByTimeAsync(0);
      second.connections[0].accept();
      await pending;
      expect(multiplayer.snapshot().peerId).toBe(expected);
    } finally {
      vi.useRealTimers();
    }
  });

  it("recusa com mensagem acionável quando a outra aba continua viva", async () => {
    vi.useFakeTimers();
    try {
      const multiplayer = makeMultiplayer();
      const expected = playerPeerIdFor("SALA04");
      const pending = multiplayer.join("SALA04").then(() => "conectou").catch((error: Error) => error.message);

      for (let attempt = 0; attempt <= 3; attempt += 1) {
        const peer = fake.FakePeer.instances[attempt];
        expect(peer.id).toBe(expected); // nunca troca de identidade
        peer.emit("error", Object.assign(new Error("ID is taken"), { type: "unavailable-id" }));
        await vi.advanceTimersByTimeAsync(2000);
      }

      expect(await pending).toContain("outra aba");
      expect(fake.FakePeer.instances).toHaveLength(4); // 1 tentativa + 3 retries
      expect(playerPeerIdFor("SALA04")).toBe(expected); // identidade intacta no storage
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("registro durável de resultados de comando", () => {
  it("guarda a recusa do Mestre mesmo depois de um novo comando limpar o aviso da UI", async () => {
    const multiplayer = makeMultiplayer();
    const { connection } = await completeJoin(multiplayer, "SALA05");

    multiplayer.request("endCombat");
    const refused = connection.sent.at(-1)!.payload as { requestId: string };
    connection.emit("data", {
      type: "armada-runtime-command-result",
      payload: { requestId: refused.requestId, ok: false, error: "Este comando exige autoridade do Mestre." },
    });

    expect(multiplayer.snapshot().error).toContain("autoridade do Mestre");
    expect(multiplayer.lastCommandResult("endCombat")).toMatchObject({ name: "endCombat", ok: false });

    // O próximo comando zera o campo transitório — e é exatamente por isso que
    // o E2E não pode observar `error`. O histórico continua intacto.
    multiplayer.request("explorationMove", "token-1", 2, 2);
    expect(multiplayer.snapshot().error).toBeUndefined();
    expect(multiplayer.lastCommandResult("endCombat")?.error).toContain("autoridade do Mestre");
    expect(multiplayer.lastCommandResult("explorationMove")).toBeNull(); // ainda sem resposta

    const accepted = connection.sent.at(-1)!.payload as { requestId: string };
    connection.emit("data", {
      type: "armada-runtime-command-result",
      payload: { requestId: accepted.requestId, ok: true },
    });
    expect(multiplayer.lastCommandResult("explorationMove")).toMatchObject({ ok: true });
    expect(multiplayer.lastCommandResult("endCombat")?.ok).toBe(false);
    expect(multiplayer.snapshot().commandLog).toHaveLength(2);
  });
});

describe("queda de conexão", () => {
  it("não derruba a sessão: marca reconectando e religa com o mesmo peer", async () => {
    vi.useFakeTimers();
    try {
      const multiplayer = makeMultiplayer();
      const pending = multiplayer.join("SALA06");
      const peer = fake.FakePeer.instances[0];
      peer.emit("open", peer.id);
      await vi.advanceTimersByTimeAsync(0);
      peer.connections[0].accept();
      await pending;
      expect(multiplayer.snapshot().status).toBe("connected");

      peer.connections[0].close();
      expect(multiplayer.snapshot().status).toBe("reconnecting");
      expect(multiplayer.snapshot().peerId).toBe(peer.id);

      await vi.advanceTimersByTimeAsync(500);
      expect(peer.connections).toHaveLength(2);
      expect(peer.connections[1].peer).toBe("modernrpg-armada-SALA06");
      peer.connections[1].accept();
      expect(multiplayer.snapshot().status).toBe("connected");
    } finally {
      vi.useRealTimers();
    }
  });
});
