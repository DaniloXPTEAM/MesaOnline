import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("iniciar combate recomeça tudo", () => {
  it("todos os tokens visíveis e vivos rolam iniciativa e nada do combate anterior fica", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.addToken(makeToken({ id: "h1", name: "Aro", side: "heroes" }));
    bridge.addToken(makeToken({ id: "m1", name: "Bandido", side: "threats", gx: 3 }));
    bridge.startCombat();
    bridge.appendRoll({ id: "teste-velho", actor: "Aro", target: "—", action: "Reflexos", kind: "save", natural: 10, modifier: 0, total: 10, formula: "1d20", rolls: [10], outcome: "Rolagem", success: true, timestamp: Date.now() });
    expect(bridge.getRuntimeSnapshot().combat.rolls.some((roll) => roll.action === "Reflexos")).toBe(true);
    // chega um token novo depois do primeiro combate; o mestre inicia de novo
    bridge.addToken(makeToken({ id: "h2", name: "Kirana", side: "heroes", gx: 5 }));
    bridge.addToken(makeToken({ id: "m2", name: "Dragonete", side: "threats", gx: 7 }));
    bridge.addToken(makeToken({ id: "oculto", name: "Escondido", side: "threats", gx: 9, hidden: true }));
    const combat = bridge.startCombat();
    expect(combat.order.sort()).toEqual(["h1", "h2", "m1", "m2"]);
    expect(combat.combatants).toHaveLength(4);
    expect(combat.rolls.every((roll) => roll.action === "Iniciativa")).toBe(true);
    expect(combat.rolls).toHaveLength(4);
    expect(combat.log).toHaveLength(1);
    expect(combat.round).toBe(1);
  });

  it("efeitos de curta duração do combate anterior saem; os de longa duração ficam", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.addToken(makeToken({ id: "h1", name: "Aro", side: "heroes", effects: [{ id: "e1", name: "Bênção", kind: "rounds" }, { id: "e2", name: "Maldição", kind: "long" }] as never }));
    bridge.startCombat();
    bridge.startCombat();
    const effects = bridge.getRuntimeSnapshot().board.tokens[0].effects ?? [];
    expect(effects.map((effect) => effect.name)).toEqual(["Maldição"]);
  });
});

describe("Encerrar combate, foco e movimento (tela)", () => {
  let root: Root | undefined;
  let node: HTMLDivElement;
  beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
  afterEach(() => { act(() => root?.unmount()); node.remove(); root = undefined; });
  const button = (label: string) => [...node.querySelectorAll("button")].find((entry) => entry.textContent?.trim() === label);

  async function openTable() {
    const { default: App } = await import("../src/App");
    await act(async () => { root = createRoot(node); root.render(<App/>); await Promise.resolve(); });
    await act(async () => [...node.querySelectorAll("button")].find((entry) => entry.textContent?.includes("Continuar mesa local"))!.click());
    await act(async () => { await Promise.resolve(); });
  }

  it("o botão Encerrar combate encerra de verdade e a exploração volta a ser livre", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.addToken(makeToken({ id: "h1", name: "Aro", side: "heroes" }));
    bridge.addToken(makeToken({ id: "m1", name: "Bandido", side: "threats", gx: 4 }));
    await openTable();
    await act(async () => button("Combate")!.click());
    expect(node.querySelector('[data-mesa-view="combat"]')).toBeTruthy();
    expect(bridge.getRuntimeSnapshot().combat.active).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 450)); // o app ignora o 2º toque de um duplo clique
    await act(async () => button("Encerrar combate")!.click());
    expect(bridge.getRuntimeSnapshot().combat.active).toBe(false);
    expect(node.querySelector('[data-mesa-view="explore"]')).toBeTruthy();
  });

  it("um combate que ficou ativo leva o Mestre à tela de combate ao abrir a mesa; o painel segue o token clicado", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.addToken(makeToken({ id: "h1", name: "Aro", side: "heroes" }));
    bridge.addToken(makeToken({ id: "m1", name: "Bandido", side: "threats", gx: 4 }));
    bridge.startCombat();
    await openTable();
    expect(node.querySelector('[data-mesa-view="combat"]')).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 450)); // o app ignora o 2º toque de um duplo clique
    await act(async () => button("Encerrar combate")!.click());
    expect(node.querySelector('[data-mesa-view="explore"]')).toBeTruthy();
    await act(async () => { bridge.selectToken("m1"); });
    expect(node.textContent).toContain("Bandido");
    await act(async () => { bridge.selectToken("h1"); await new Promise((resolve) => setTimeout(resolve, 700)); }); // deixa a tela de combate sair de cena
    expect(node.querySelector("h2")?.textContent).toMatch(/Aro/);
  });
});
