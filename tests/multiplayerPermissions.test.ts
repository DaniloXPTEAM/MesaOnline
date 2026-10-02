import { describe, expect, it } from "vitest";
import { canControlToken, isTokenOwnedByPeer } from "../src/game/permissions";
import type { MultiplayerState } from "../src/game/types";
import { makeToken } from "./helpers";

const local: MultiplayerState = { role: "local", status: "disconnected", roomCode: "", peerId: "", peers: [] };
const master: MultiplayerState = { role: "master", status: "connected", roomCode: "ABC123", peerId: "master-peer", peers: ["player-a"] };
const player: MultiplayerState = { role: "player", status: "connected", roomCode: "ABC123", peerId: "player-a", peers: ["master-peer"] };

describe("propriedade real de tokens", () => {
  it("mantém autoridade total para Mestre e mesa local", () => {
    const foreign = makeToken({ controlledBy: "player-b" });
    expect(canControlToken(local, foreign)).toBe(true);
    expect(canControlToken(master, foreign)).toBe(true);
  });

  it("habilita Jogador somente quando controlledBy coincide com o Peer atual", () => {
    expect(canControlToken(player, makeToken({ controlledBy: "player-a" }))).toBe(true);
    expect(canControlToken(player, makeToken({ controlledBy: "player-b" }))).toBe(false);
    expect(canControlToken(player, makeToken({ controlledBy: undefined }))).toBe(false);
    expect(isTokenOwnedByPeer(makeToken({ controlledBy: "player-a" }), "player-a")).toBe(true);
  });
});
