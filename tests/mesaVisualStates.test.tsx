import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import App from "../src/App";
import { addToken, endCombat, getBoard, removeToken, selectToken } from "../src/game/vttBridge";
import { makeToken } from "./helpers";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
const ids = ["visual-hero", "visual-threat"];

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  endCombat();
  selectToken(null);
  ids.forEach((id) => { if (getBoard().tokens.some((token) => token.id === id)) removeToken(id); });
  document.body.innerHTML = "";
});

function buttonByText(node: HTMLElement, text: string) {
  return [...node.querySelectorAll("button")].find((button) => button.textContent?.trim() === text);
}

describe("estados visuais da Mesa Online", () => {
  it("renderiza literalmente a fonte visual e troca seus dois estados no runtime existente", async () => {
    addToken(makeToken({ id: "visual-hero", name: "Heroína", gx: 2, gy: 2, hp: 31, pm: 12 }));
    addToken(makeToken({ id: "visual-threat", name: "Ameaça", side: "threats", gx: 5, gy: 4 }));
    const before = getBoard().tokens.find((token) => token.id === "visual-hero")!;
    const node = document.createElement("div");
    document.body.appendChild(node);
    await act(async () => { root = createRoot(node); root.render(<App/>); await Promise.resolve(); });
    await act(async () => [...node.querySelectorAll("button")].find((button) => button.textContent?.includes("Continuar mesa local"))!.click());

    // Exploração: os elementos são a própria fonte fornecida, não o shell antigo.
    expect(node.querySelector('.appearance-table[data-mesa-view="explore"]')).toBeTruthy();
    expect(node.querySelector('img[alt="Ponte da Tormenta Rubra"]')).toBeTruthy();
    expect(node.textContent).toContain("ARMADA NEXUS RPG");
    expect(node.textContent).toContain("Elenco");
    expect(node.textContent).toContain("Equipamentos / Mochila");

    // O mesmo botão visual muda apenas a apresentação e delega a criação de
    // combate ao runtime já existente.
    await act(async () => {
      buttonByText(node, "Combate")!.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(node.querySelector('.appearance-table[data-mesa-view="combat"]')).toBeTruthy();
    // The animation container keeps the outgoing exploration pane mounted
    // until its exit ends; data-mesa-view confirma o novo estado.

    await new Promise((resolve) => setTimeout(resolve, 450)); // o app ignora o 2º toque de um duplo clique
    await act(async () => buttonByText(node, "Encerrar combate")!.click());
    expect(node.querySelector('.appearance-table[data-mesa-view="explore"]')).toBeTruthy();
    const after = getBoard().tokens.find((token) => token.id === "visual-hero")!;
    expect({ hp: after.hp, pm: after.pm, gx: after.gx, gy: after.gy }).toEqual({ hp: before.hp, pm: before.pm, gx: before.gx, gy: before.gy });
  });
});
