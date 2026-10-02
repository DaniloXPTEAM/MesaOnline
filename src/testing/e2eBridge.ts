import type { BattleMap, BoardToken, RemoteCommandResult, RuntimeSnapshot } from "../game/types";
import {
  addToken,
  appendChat,
  createScene,
  endCombat,
  getRuntimeSnapshot,
  hostMultiplayer,
  joinMultiplayer,
  lastRemoteCommandResult,
  leaveMultiplayer,
  moveToken,
  sendSignal,
  shareAudioWithRoom,
  setFogSettings,
  setObjects,
  upsertWall,
  setLighting,
  startCombat,
  switchScene,
  updateToken,
  upsertLight,
} from "../game/vttBridge";
import { onSignals } from "../game/signals";
import { registerSharedAudio, sharedAudioUrl } from "../game/sharedAudio";
import { resolveSummonEffect } from "../tactics/engine/summonEffects";
import { executeDoorAction, executeObjectAction } from "../tactics/engine/objectCommands";
import { executeDismount, executeMount } from "../tactics/engine/mountCommands";
import { executeAnswerReaction, executeExplorationMove, executeTacticalAction, executeTacticalMove } from "../tactics/engine/runtimeCommands";

export interface ModernRpgE2EBridge {
  snapshot: () => RuntimeSnapshot;
  addToken: (token: BoardToken) => BoardToken;
  moveToken: typeof moveToken;
  updateToken: typeof updateToken;
  startCombat: typeof startCombat;
  endCombat: typeof endCombat;
  switchScene: typeof switchScene;
  createScene: (name: string) => string;
  explorationMove: typeof executeExplorationMove;
  tacticalMove: typeof executeTacticalMove;
  tacticalAction: typeof executeTacticalAction;
  summon: (casterId: string) => string[];
  /** Ambiente e comunicação — cobertura de fog por papel e sussurro. */
  setLighting: typeof setLighting;
  setFogSettings: typeof setFogSettings;
  upsertLight: typeof upsertLight;
  appendChat: typeof appendChat;
  /** Objetos da cena (baús) e interação com eles. */
  setObjects: typeof setObjects;
  upsertWall: typeof upsertWall;
  objectAction: typeof executeObjectAction;
  sendSignal: typeof sendSignal;
  /** Áudio do computador: o Mestre registra e envia; o jogador espera receber e devolve o tamanho. */
  audioShare: (size: number) => Promise<string>;
  audioReceive: (id: string) => Promise<number>;
  signals: () => unknown[];
  doorAction: typeof executeDoorAction;
  mount: typeof executeMount;
  dismount: typeof executeDismount;
  answerReaction: typeof executeAnswerReaction;
  /** Registro durável do último resultado devolvido pelo Mestre. */
  lastCommandResult: (name?: string) => RemoteCommandResult | null;
  hostRoom: (code?: string) => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
}

declare global {
  interface Window {
    __MODERNRPG_E2E__?: ModernRpgE2EBridge;
  }
}

/** Instalada apenas quando o Vite roda em mode=e2e. Não integra o bundle de produção. */
export function installE2EBridge(): void {
  const received: unknown[] = [];
  onSignals((signal) => { received.push(signal); });
  window.__MODERNRPG_E2E__ = {
    snapshot: getRuntimeSnapshot,
    addToken,
    setLighting,
    setFogSettings,
    upsertLight,
    appendChat,
    setObjects,
    upsertWall,
    objectAction: executeObjectAction,
    sendSignal,
    async audioShare(size: number) {
      const bytes = new Uint8Array(size).map((_, index) => index % 251);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const id = registerSharedAudio(URL.createObjectURL(blob), blob, "teste.mp3");
      if (!id) throw new Error("áudio recusado");
      await shareAudioWithRoom(id);
      return id;
    },
    async audioReceive(id: string) {
      const url = await sharedAudioUrl(id, 30000);
      if (!url) return 0;
      return (await (await fetch(url)).blob()).size;
    },
    signals: () => received,
    doorAction: executeDoorAction,
    mount: executeMount,
    dismount: executeDismount,
    answerReaction: executeAnswerReaction,
    moveToken,
    updateToken,
    startCombat,
    endCombat,
    switchScene,
    explorationMove: executeExplorationMove,
    tacticalMove: executeTacticalMove,
    tacticalAction: executeTacticalAction,
    lastCommandResult: lastRemoteCommandResult,
    hostRoom: hostMultiplayer,
    joinRoom: joinMultiplayer,
    leaveRoom: leaveMultiplayer,
    createScene(name: string) {
      const map: BattleMap = {
        id: `e2e-map-${crypto.randomUUID()}`,
        name,
        location: "Teste E2E",
        image: "",
        cols: 12,
        rows: 12,
        terrain: {},
        custom: true,
      };
      return createScene(map, name).id;
    },
    summon(casterId: string) {
      const caster = getRuntimeSnapshot().board.tokens.find((token) => token.id === casterId);
      if (!caster) throw new Error("Conjurador E2E não encontrado.");
      return resolveSummonEffect({ spellName: "Criar Mortos-Vivos", caster }).map((token) => token.id);
    },
  };
}
