import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GRID } from "../src/game/distance";
import { HOTKEY_SLOTS, assignHotkey, clearHotkey, readHotkeys } from "../src/game/hotkeys";
import { deliverSignal, onSignals, sanitizeSignal, signalAllowedFrom, type Signal } from "../src/game/signals";
import { pathDistance, pathLegs } from "../src/game/ruler";

beforeEach(() => { localStorage.clear(); });

describe("hotkeys da mochila", () => {
  it("começa vazia e grava o item no slot", () => {
    expect(readHotkeys("ficha-1")).toEqual(Array(HOTKEY_SLOTS).fill(""));
    assignHotkey("ficha-1", 2, "pocao");
    expect(readHotkeys("ficha-1")[1]).toBe("pocao");
  });

  it("um item ocupa um slot só: ao mudar de slot, sai do anterior", () => {
    assignHotkey("ficha-1", 1, "pocao");
    assignHotkey("ficha-1", 4, "pocao");
    expect(readHotkeys("ficha-1")).toEqual(["", "", "", "pocao", ""]);
  });

  it("limpar esvazia só aquele slot; slot fora de 1 a 5 é ignorado", () => {
    assignHotkey("ficha-1", 1, "a");
    assignHotkey("ficha-1", 2, "b");
    clearHotkey("ficha-1", 1);
    expect(readHotkeys("ficha-1")).toEqual(["", "b", "", "", ""]);
    assignHotkey("ficha-1", 9, "c");
    expect(readHotkeys("ficha-1")).toEqual(["", "b", "", "", ""]);
  });

  it("cada ficha tem as suas hotkeys e a Mesa é avisada da mudança", () => {
    const heard = vi.fn();
    window.addEventListener("modernrpg-characters-changed", heard);
    assignHotkey("ficha-1", 1, "a");
    assignHotkey("ficha-2", 1, "b");
    window.removeEventListener("modernrpg-characters-changed", heard);
    expect(heard).toHaveBeenCalledTimes(2);
    expect(readHotkeys("ficha-1")[0]).toBe("a");
    expect(readHotkeys("ficha-2")[0]).toBe("b");
    expect(readHotkeys(null)).toEqual(Array(HOTKEY_SLOTS).fill(""));
  });

  it("dados corrompidos viram slots vazios", () => {
    localStorage.setItem("armada-mesa-hotkeys-v1:ficha-1", "{isso não é json");
    expect(readHotkeys("ficha-1")).toEqual(Array(HOTKEY_SLOTS).fill(""));
  });
});

describe("régua com waypoints", () => {
  it("soma os trechos pela regra de distância da cena", () => {
    const grid = { ...DEFAULT_GRID, distanceMode: "square" as const };
    const points = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }];
    expect(pathDistance(points, grid)).toBeCloseTo((4 + 3) * 1.5, 5);
    expect(pathLegs(points, grid)).toEqual([6, 10.5]);
  });

  it("um ponto só, ou nenhum, mede zero", () => {
    expect(pathDistance([])).toBe(0);
    expect(pathDistance([{ x: 3, y: 3 }])).toBe(0);
  });
});

describe("sinais entre a mesa (ping e faixa)", () => {
  it("aceita só os formatos conhecidos e limita coordenadas", () => {
    expect(sanitizeSignal({ kind: "ping", x: 3.9, y: 5 })).toEqual({ kind: "ping", x: 3, y: 5 });
    expect(sanitizeSignal({ kind: "ping", x: -4, y: 99999 })).toEqual({ kind: "ping", x: 0, y: 999 });
    expect(sanitizeSignal({ kind: "ping", x: "1", y: 2 })).toBeNull();
    expect(sanitizeSignal({ kind: "apagar-tudo" })).toBeNull();
    expect(sanitizeSignal(null)).toBeNull();
    expect(sanitizeSignal({ kind: "jukebox", url: "x".repeat(3000) })).toBeNull();
  });

  it("o ping vale de qualquer participante; a faixa só vem do Mestre", () => {
    const ping: Signal = { kind: "ping", x: 1, y: 1 };
    const faixa: Signal = { kind: "jukebox", url: "/musica.mp3", title: "t", playing: true, loop: true };
    expect(signalAllowedFrom(ping, false)).toBe(true);
    expect(signalAllowedFrom(faixa, false)).toBe(false);
    expect(signalAllowedFrom(faixa, true)).toBe(true);
  });

  it("entrega o sinal a quem está ouvindo", () => {
    const heard: Signal[] = [];
    const stop = onSignals((signal) => heard.push(signal));
    deliverSignal({ kind: "ping", x: 2, y: 2 });
    stop();
    deliverSignal({ kind: "ping", x: 9, y: 9 });
    expect(heard).toEqual([{ kind: "ping", x: 2, y: 2 }]);
  });
});

describe("Jukebox sincronizado", () => {
  it("o Mestre publica ao tocar e o jogador aplica a faixa", async () => {
    vi.resetModules();
    const calls: string[] = [];
    let listeners: Array<() => void> = [];
    let state = { url: "", title: "", playing: false, volume: 0.4, loop: true };
    vi.doMock("../src/game/jukebox", () => ({
      jukeboxState: () => state,
      subscribeJukebox: (listener: () => void) => { listeners.push(listener); return () => { listeners = listeners.filter((entry) => entry !== listener); }; },
      loadTrack: (url: string, title?: string) => { calls.push(`load:${url}`); state = { ...state, url, title: title || "", playing: false }; },
      playTrack: async () => { calls.push("play"); state = { ...state, playing: true }; },
      pauseTrack: () => { calls.push("pause"); state = { ...state, playing: false }; },
      setLoop: (loop: boolean) => { calls.push(`loop:${loop}`); state = { ...state, loop }; },
    }));
    const { installJukeboxSync } = await import("../src/game/jukeboxSync");
    const { deliverSignal: deliver } = await import("../src/game/signals");

    // Mestre: publica quando a faixa muda.
    const sent: Signal[] = [];
    let role: "local" | "master" | "player" = "master";
    const stop = installJukeboxSync(() => role, (signal) => sent.push(signal));
    state = { ...state, url: "/musica.mp3", title: "Taverna", playing: true };
    listeners.forEach((listener) => listener());
    listeners.forEach((listener) => listener()); // repetido: não reenvia
    expect(sent).toEqual([{ kind: "jukebox", url: "/musica.mp3", title: "Taverna", playing: true, loop: true }]);

    // Jogador: aplica o que o Mestre mandou.
    role = "player";
    state = { url: "", title: "", playing: false, volume: 0.4, loop: true };
    deliver({ kind: "jukebox", url: "/batalha.mp3", title: "Batalha", playing: true, loop: false });
    await Promise.resolve();
    expect(calls).toEqual(expect.arrayContaining(["load:/batalha.mp3", "loop:false", "play"]));

    // Mestre ignora sinais de faixa (só o jogador aplica).
    role = "master";
    calls.length = 0;
    deliver({ kind: "jukebox", url: "/outra.mp3", title: "x", playing: true, loop: true });
    expect(calls).toEqual([]);
    stop();
    vi.doUnmock("../src/game/jukebox");
  });
});
