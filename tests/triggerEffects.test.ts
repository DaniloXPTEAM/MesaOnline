import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateEffectTriggers, markEffectsFired, type TriggerEffect } from "../src/game/triggers";
import type { BoardShape } from "../src/game/types";
import { makeToken } from "./helpers";

/** Gatilhos de cena: música, efeito sonoro, mensagem e macro ao pisar na área (mini-macro do local). */
beforeEach(() => { localStorage.clear(); vi.resetModules(); });

const shape = (effect: TriggerEffect, mode: "once" | "continuous" = "once", cells = ["6,5"]): BoardShape => ({ id: "gatilho-1", floor: 0, kind: "trigger", cells, color: "#9a4c77", trigger: { mode, condition: "", effect } } as BoardShape);

describe("regras do gatilho de cena", () => {
  const board = (shapes: BoardShape[]) => ({ shapes, tokens: [] }) as never;

  it("dispara só na ENTRADA da área, não ao andar dentro dela", () => {
    const effect: TriggerEffect = { kind: "message", text: "Um rangido." };
    const token = makeToken({ id: "a", gx: 6, gy: 5 });
    expect(evaluateEffectTriggers(board([shape(effect)]), token, { x: 5, y: 5 }, { x: 6, y: 5 })).toHaveLength(1);
    expect(evaluateEffectTriggers(board([shape(effect, "once", ["6,5", "7,5"])]), token, { x: 6, y: 5 }, { x: 7, y: 5 })).toHaveLength(0);
    expect(evaluateEffectTriggers(board([shape(effect)]), token, { x: 4, y: 4 }, { x: 5, y: 5 })).toHaveLength(0);
  });

  it("uma vez marca como usado; contínuo dispara a cada nova entrada", () => {
    const effect: TriggerEffect = { kind: "sfx", url: "synth:plim" };
    const once = shape(effect, "once");
    const marked = markEffectsFired([once], [{ shapeId: once.id, effect }]);
    expect(marked[0].trigger?.triggered).toBe(true);
    const token = makeToken({ id: "a", gx: 6, gy: 5 });
    expect(evaluateEffectTriggers(board(marked), token, { x: 5, y: 5 }, { x: 6, y: 5 })).toHaveLength(0);
    const continuous = shape(effect, "continuous");
    expect(markEffectsFired([continuous], [{ shapeId: continuous.id, effect }])[0].trigger?.triggered).toBeUndefined();
    expect(evaluateEffectTriggers(board([continuous]), token, { x: 5, y: 5 }, { x: 6, y: 5 })).toHaveLength(1);
  });

  it("gatilho de condição continua igual e não dispara efeito", () => {
    const only = { ...shape({ kind: "message", text: "x" }), trigger: { mode: "once", condition: "Abalado" } } as BoardShape;
    expect(evaluateEffectTriggers(board([only]), makeToken({ id: "a", gx: 6, gy: 5 }), { x: 5, y: 5 }, { x: 6, y: 5 })).toHaveLength(0);
  });
});

describe("efeitos no movimento", () => {
  async function setup(effect: TriggerEffect, mode: "once" | "continuous" = "once") {
    const bridge = await import("../src/game/vttBridge");
    const runtime = await import("../src/tactics/engine/runtimeCommands");
    bridge.addToken(makeToken({ id: "heroi", name: "Sirih", gx: 5, gy: 5, movementM: 9 }));
    bridge.setShapes([shape(effect, mode)]);
    return { bridge, runtime };
  }

  it("mensagem vai ao chat de todos quando alguém entra", async () => {
    const { bridge, runtime } = await setup({ kind: "message", text: "Você ouve um rangido." });
    runtime.executeExplorationMove("heroi", 6, 5);
    expect(bridge.getBoard().chat.some((entry) => entry.text === "Você ouve um rangido.")).toBe(true);
    // uma vez: sair e entrar de novo não repete
    runtime.executeExplorationMove("heroi", 5, 5);
    runtime.executeExplorationMove("heroi", 6, 5);
    expect(bridge.getBoard().chat.filter((entry) => entry.text === "Você ouve um rangido.")).toHaveLength(1);
  });

  it("contínuo repete a cada entrada", async () => {
    const { bridge, runtime } = await setup({ kind: "message", text: "Goteira." }, "continuous");
    runtime.executeExplorationMove("heroi", 6, 5);
    runtime.executeExplorationMove("heroi", 5, 5);
    runtime.executeExplorationMove("heroi", 6, 5);
    expect(bridge.getBoard().chat.filter((entry) => entry.text === "Goteira.")).toHaveLength(2);
  });

  it("macro rola no histórico de rolagens", async () => {
    const { bridge, runtime } = await setup({ kind: "macro", name: "Teste de armadilha", formula: "1d20+3" });
    runtime.executeExplorationMove("heroi", 6, 5);
    const roll = bridge.getCombatState().rolls[0];
    expect(roll.action).toBe("Teste de armadilha");
    expect(roll.formula).toBe("1d20+3");
    expect(roll.total).toBeGreaterThanOrEqual(4);
  });

  it("efeito sonoro vai pelo sinal de som e a faixa entra no Jukebox", async () => {
    const signals = await import("../src/game/signals");
    const seen: unknown[] = [];
    signals.onSignals((signal) => { seen.push(signal); });
    const sfx = await setup({ kind: "sfx", url: "synth:plim" });
    sfx.runtime.executeExplorationMove("heroi", 6, 5);
    expect(seen).toContainEqual({ kind: "sfx", url: "synth:plim" });

    vi.resetModules();
    localStorage.clear();
    const track = await setup({ kind: "track", url: "https://exemplo.com/taverna.mp3", title: "Taverna" });
    track.runtime.executeExplorationMove("heroi", 6, 5);
    const jukebox = await import("../src/game/jukebox");
    expect(jukebox.jukeboxState().url).toBe("https://exemplo.com/taverna.mp3");
    expect(jukebox.jukeboxState().title).toBe("Taverna");
  });
});
