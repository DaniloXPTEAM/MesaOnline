import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import RecentRollsBar from "../src/components/mesa/RecentRollsBar";
import { getRuntimeSnapshot } from "../src/game/vttBridge";

/**
 * Referência de layout: V3 (decisão do usuário — o alvo de ~49% foi descartado).
 * Estes testes travam a escolha estrutural que devolveu altura ao mapa:
 * o rodapé nasce COMPACTO e só cresce por ação do usuário.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(node));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null; host = null;
});

describe("rodape de rolagens: compacto por padrao, expansivel sob demanda", () => {
  it("nasce compacto", () => {
    const el = mount(<RecentRollsBar snapshot={getRuntimeSnapshot()} onOpenHistory={() => {}}/>);
    const bar = el.querySelector(".mesa-recent-bar");
    expect(bar?.classList.contains("is-compact")).toBe(true);
    expect(bar?.classList.contains("is-expanded")).toBe(false);
  });

  it("expande quando pedido", () => {
    const el = mount(<RecentRollsBar snapshot={getRuntimeSnapshot()} expanded onOpenHistory={() => {}}/>);
    const bar = el.querySelector(".mesa-recent-bar");
    expect(bar?.classList.contains("is-expanded")).toBe(true);
    expect(bar?.classList.contains("is-compact")).toBe(false);
  });

  it("oferece o controle de expandir e o atalho do historico", () => {
    const el = mount(<RecentRollsBar snapshot={getRuntimeSnapshot()} onOpenHistory={() => {}} onToggleExpanded={() => {}}/>);
    expect(el.querySelector(".mesa-recent-toggle")).toBeTruthy();
    expect(el.querySelector(".mesa-history-button")).toBeTruthy();
  });

  it("o controle anuncia o estado para leitores de tela", () => {
    const fechado = mount(<RecentRollsBar snapshot={getRuntimeSnapshot()} onOpenHistory={() => {}} onToggleExpanded={() => {}}/>);
    expect(fechado.querySelector(".mesa-recent-toggle")?.getAttribute("aria-expanded")).toBe("false");
    act(() => root!.render(<RecentRollsBar snapshot={getRuntimeSnapshot()} expanded onOpenHistory={() => {}} onToggleExpanded={() => {}}/>));
    expect(fechado.querySelector(".mesa-recent-toggle")?.getAttribute("aria-expanded")).toBe("true");
  });
});
