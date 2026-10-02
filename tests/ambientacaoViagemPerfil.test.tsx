import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSheet, makeToken } from "./helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("gatilhos: marcar na Ambientação, configurar em Macros", () => {
  let root: Root | undefined;
  let node: HTMLDivElement;
  beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
  afterEach(() => { act(() => root?.unmount()); node.remove(); root = undefined; });

  it("a lista de Macros muda o tipo e o efeito do gatilho na hora", async () => {
    const bridge = await import("../src/game/vttBridge");
    const { default: TriggerList } = await import("../src/components/mesa/TriggerList");
    bridge.setShapes([{ id: "g1", kind: "trigger", cells: ["2,2", "3,2"], trigger: { mode: "once", condition: "Caído" } }]);
    const render = async () => act(async () => { root?.unmount(); root = createRoot(node); root.render(<TriggerList shapes={bridge.getRuntimeSnapshot().board.shapes} isPlayer={false}/>); });
    await render();
    expect(node.textContent).toContain("Gatilho 1 · 2 casas");
    await act(async () => node.querySelector<HTMLButtonElement>(".mesa-trigger-head")!.click());
    const select = node.querySelector(".mesa-trigger-body select") as HTMLSelectElement;
    await act(async () => { select.value = "message"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    await render();
    await act(async () => node.querySelector<HTMLButtonElement>(".mesa-trigger-head")!.click());
    const input = node.querySelector('.mesa-trigger-body input[placeholder^="Você ouve"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setter.call(input, "Você ouve um rangido."); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(bridge.getRuntimeSnapshot().board.shapes[0].trigger).toMatchObject({ mode: "once", condition: "", effect: { kind: "message", text: "Você ouve um rangido." } });
  });
});

describe("viagem com duração e encontro no palco", () => {
  it("a viagem tem duração; cada dia conta; o encontro vai para o palco e só o Mestre fecha", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.startTravel(3, "cena-x");
    expect(bridge.getRuntimeSnapshot().board.travel).toMatchObject({ planned: 3, done: 0, days: 0, sceneId: "cena-x" });
    bridge.advanceTravelDay();
    bridge.resetTravelEncounter();
    expect(bridge.getRuntimeSnapshot().board.travel).toMatchObject({ planned: 3, done: 2, days: 0, total: 2 });
    expect(bridge.getBoard().chat.some((entry) => /dia 2 de 3/.test(entry.text))).toBe(true);
    bridge.showTravelEvent({ day: 2, title: "Houve um encontro!", text: "1d3 bandidos", pag: "Ameaças, pag. 1" });
    const wire = bridge.wireStateForPeer("peer-jogador").scenes[0].board;
    expect(wire.travelEvent).toMatchObject({ day: 2, title: "Houve um encontro!" });
    bridge.closeTravelEvent();
    expect(bridge.getRuntimeSnapshot().board.travelEvent).toBeUndefined();
  });

  it("recarregar a página não traz o encontro de volta", async () => {
    let bridge = await import("../src/game/vttBridge");
    bridge.showTravelEvent({ day: 1, title: "Encontro", text: "x" });
    vi.resetModules();
    bridge = await import("../src/game/vttBridge");
    expect(bridge.getRuntimeSnapshot().board.travelEvent).toBeUndefined();
  });
});

describe("Meus personagens (ícone do perfil)", () => {
  let root: Root | undefined;
  let node: HTMLDivElement;
  beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
  afterEach(() => { act(() => root?.unmount()); node.remove(); document.body.querySelectorAll(".dialog-backdrop").forEach((el) => el.remove()); root = undefined; });

  it("lista os personagens, marca o que está em uso, mostra o M do Mestre e escolhe ao clicar", async () => {
    const { default: CharacterPickerDialog } = await import("../src/components/mesa/CharacterPickerDialog");
    const kael = makeSheet({ id: "s1", name: "Kael" });
    const mira = makeSheet({ id: "s2", name: "Mira" });
    const onPick = vi.fn();
    await act(async () => { root = createRoot(node); root.render(<CharacterPickerDialog sheets={[kael, mira]} tokens={[makeToken({ id: "t1", modernRpgCharacterId: "s2" })]} isMaster currentId="s1" onPick={onPick} onOpenPortalSheet={() => undefined} onOpenPortalList={() => undefined} onClose={() => undefined}/>); });
    const dialog = document.body.querySelector('[role="dialog"][aria-label="Meus personagens"]')!;
    expect(dialog.querySelector(".mesa-master-badge")?.textContent).toBe("M");
    const rows = [...dialog.querySelectorAll(".mesa-char-pick")];
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("Em uso");
    expect(rows[1].textContent).toContain("No mapa");
    await act(async () => (rows[1] as HTMLButtonElement).click());
    expect(onPick).toHaveBeenCalledWith(mira);
  });

  it("para o jogador não há o M", async () => {
    const { default: CharacterPickerDialog } = await import("../src/components/mesa/CharacterPickerDialog");
    await act(async () => { root = createRoot(node); root.render(<CharacterPickerDialog sheets={[]} tokens={[]} isMaster={false} onPick={() => undefined} onOpenPortalSheet={() => undefined} onOpenPortalList={() => undefined} onClose={() => undefined}/>); });
    expect(document.body.querySelector(".mesa-master-badge")).toBeNull();
    expect(document.body.textContent).toContain("Nenhum personagem ainda");
  });
});
