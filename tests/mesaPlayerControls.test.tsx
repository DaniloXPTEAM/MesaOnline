import { act, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import App from "../src/App";
import ArmadaNextTable from "../src/components/ArmadaNextTable";
import MesaLobby from "../src/components/mesa/MesaLobby";
import { MAP_TOOLS } from "../src/game/mapTools";
import { tacticalViewForToken } from "../src/integration/modernRpgCharacterBridge";
import type { RuntimeSnapshot } from "../src/game/types";
import {
  addToken, endCombat, getBoard, getRuntimeSnapshot, removeToken, selectToken, subscribeRuntime,
} from "../src/game/vttBridge";
import { makeToken } from "./helpers";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
const ids = ["own-hero", "other-hero", "sync-hero"];
const PEER = "modernrpg-armada-player-SALA01-abcdefghij";

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  endCombat();
  selectToken(null);
  ids.forEach((id) => { if (getBoard().tokens.some((token) => token.id === id)) removeToken(id); });
  document.body.innerHTML = "";
});

function mount(element: React.ReactElement) {
  const node = document.createElement("div");
  document.body.appendChild(node);
  act(() => { root = createRoot(node); root.render(element); });
  return node;
}
function buttonByText(node: HTMLElement, text: string) {
  return [...node.querySelectorAll("button")].find((button) => button.textContent?.includes(text));
}
function token(id: string) {
  return getBoard().tokens.find((entry) => entry.id === id)!;
}

/** Mesma composição do App, com o papel que só a rede produziria. */
function PlayerTable() {
  const runtime = useSyncExternalStore(subscribeRuntime, getRuntimeSnapshot);
  const snapshot: RuntimeSnapshot = {
    ...runtime,
    multiplayer: { ...runtime.multiplayer, role: "player", status: "connected", roomCode: "SALA01", peerId: PEER, peers: ["modernrpg-armada-SALA01"] },
  };
  const units = snapshot.board.tokens.filter((entry) => !entry.hidden).map(tacticalViewForToken);
  const noop = () => {};
  return <ArmadaNextTable snapshot={snapshot} units={units} onOpenCharacters={noop} onOpenCharacter={noop} onOpenThreats={noop} onStartCombat={noop} onExit={noop}/>;
}

describe("A1 — saída de combate sincroniza o stage do Jogador", () => {
  it("volta sozinho para exploração quando o snapshot perde combat.active, preservando o estado", async () => {
    addToken(makeToken({ id: "sync-hero", name: "Alyssa", gx: 3, gy: 4, hp: 22, pm: 9, modernRpgCharacterId: undefined }));
    window.location.hash = "#/mesa";
    const node = mount(<App/>);
    await act(async () => buttonByText(node, "Continuar mesa local")!.click());
    await act(async () => buttonByText(node, "Combate")!.click());
    expect(node.querySelector('.appearance-table[data-mesa-view="combat"]')).toBeTruthy();
    const before = token("sync-hero");

    // O Mestre encerra o combate: o Jogador só recebe o snapshot, sem clicar em nada.
    await act(async () => { endCombat(); });

    expect(node.querySelector('.appearance-table[data-mesa-view="combat"]')).toBeNull();
    expect(node.querySelector('.appearance-table[data-mesa-view="explore"]')).toBeTruthy();
    expect(node.querySelector('img[alt="Ponte da Tormenta Rubra"]')).toBeTruthy();
    const after = token("sync-hero");
    expect({ hp: after.hp, pm: after.pm, gx: after.gx, gy: after.gy, controlledBy: after.controlledBy, sheet: after.modernRpgCharacterId })
      .toEqual({ hp: before.hp, pm: before.pm, gx: before.gx, gy: before.gy, controlledBy: before.controlledBy, sheet: before.modernRpgCharacterId });
    expect(getBoard().map.id).toBe(before ? getBoard().map.id : "");
  });

  it("não interfere na entrada em combate", async () => {
    addToken(makeToken({ id: "sync-hero", name: "Alyssa" }));
    window.location.hash = "#/mesa";
    const node = mount(<App/>);
    await act(async () => buttonByText(node, "Continuar mesa local")!.click());
    await act(async () => buttonByText(node, "Combate")!.click());
    expect(node.querySelector('.appearance-table[data-mesa-view="combat"]')).toBeTruthy();
    expect(getRuntimeSnapshot().combat.active).toBe(true);
  });
});

describe("A4 — colisão da reentrada automática aparece no lobby", () => {
  const base = (error?: string): RuntimeSnapshot => ({
    ...getRuntimeSnapshot(),
    multiplayer: { ...getRuntimeSnapshot().multiplayer, role: "player", status: error ? "error" : "disconnected", roomCode: "SALA01", peerId: "", peers: [], error },
  });

  it("mostra a mensagem do restore automático sem nenhum clique", () => {
    const message = "Esta mesa já está aberta em outra aba deste navegador. Feche a outra aba para reassumir seus personagens.";
    const node = mount(<MesaLobby snapshot={base(message)} campaigns={[]} onEnter={() => {}} onExit={() => {}}/>);
    const notice = node.querySelector(".mesa-connect-notice");
    expect(notice).toBeTruthy();
    expect(notice!.textContent).toBe(message);
    // Lobby continua aberto e utilizável: nada de entrar na mesa sozinho.
    expect(node.querySelector(".mesa-connect-card")).toBeTruthy();
    expect(buttonByText(node, "Criar sala online")).toBeTruthy();
  });

  it("não inventa aviso quando não há erro", () => {
    const node = mount(<MesaLobby snapshot={base()} campaigns={[]} onEnter={() => {}} onExit={() => {}}/>);
    expect(node.querySelector(".mesa-connect-notice")).toBeNull();
  });
});

describe("A6 — Jogador ajusta PV, PM e condições do próprio personagem", () => {
  it("mantém o rail completo e revela ferramentas administrativas bloqueadas só no submenu", async () => {
    addToken(makeToken({ id: "own-hero", name: "Alyssa", controlledBy: PEER }));
    const node = mount(<PlayerTable/>);

    const rail = [...node.querySelectorAll(".mesa-tool-rail button")];
    expect(rail).toHaveLength(8);
    expect((node.querySelector('[aria-label="Macros"]') as HTMLButtonElement).disabled).toBe(true);
    expect((node.querySelector('[aria-label="Inventário"]') as HTMLButtonElement).disabled).toBe(false);
    expect(node.querySelector('[aria-label="Fog, luz e clima"]')).toBeNull();
    expect(node.querySelector(".mesa-initiative-rail")).toBeNull();
    expect(node.querySelector(".mesa-exploration-context-rail")).toBeTruthy();

    const tools = node.querySelector('button[aria-label="Ferramentas do mapa"]') as HTMLButtonElement;
    expect(tools.getAttribute("aria-expanded")).toBe("false");
    expect(node.querySelector(".mesa-tool-menu")).toBeNull();
    await act(async () => tools.click());
    expect(tools.getAttribute("aria-expanded")).toBe("true");
    expect(node.querySelectorAll(".mesa-tool-menu button")).toHaveLength(MAP_TOOLS.length);
    expect((node.querySelector('.mesa-tool-menu [aria-label="Fog / visão"]') as HTMLButtonElement).disabled).toBe(true);
    expect((node.querySelector('.mesa-tool-menu [aria-label="Régua / medir"]') as HTMLButtonElement).disabled).toBe(false);
  });

  function selectUnit(node: HTMLElement, name: string) {
    const button = [...node.querySelectorAll(".next-token")].find((entry) => entry.textContent?.includes(name)) as HTMLButtonElement;
    return act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  }
  function addOwnAndForeign() {
    addToken(makeToken({ id: "own-hero", name: "Alyssa", gx: 2, gy: 2, hp: 30, hpMax: 40, pm: 15, pmMax: 20, controlledBy: PEER, conditions: [] }));
    addToken(makeToken({ id: "other-hero", name: "Bruno", gx: 6, gy: 6, hp: 25, hpMax: 30, pm: 8, pmMax: 10, controlledBy: "outro-peer", conditions: ["Abalado"] }));
  }

  it("altera PV e PM do próprio token e respeita os limites 0..máximo", async () => {
    addOwnAndForeign();
    const node = mount(<PlayerTable/>);
    await selectUnit(node, "Alyssa");
    expect(node.querySelector(".mesa-token-context")).toBeTruthy();

    await act(async () => (node.querySelector('[aria-label="Reduzir PV"]') as HTMLButtonElement).click());
    expect(token("own-hero").hp).toBe(29);
    await act(async () => (node.querySelector('[aria-label="Aumentar PV"]') as HTMLButtonElement).click());
    expect(token("own-hero").hp).toBe(30);
    await act(async () => (node.querySelector('[aria-label="Reduzir PM"]') as HTMLButtonElement).click());
    expect(token("own-hero").pm).toBe(14);
    await act(async () => (node.querySelector('[aria-label="Aumentar PM"]') as HTMLButtonElement).click());
    expect(token("own-hero").pm).toBe(15);
    // Nada vazou para o token alheio.
    expect({ hp: token("other-hero").hp, pm: token("other-hero").pm }).toEqual({ hp: 25, pm: 8 });
  });

  it("trava os botões no piso e no teto dos recursos", async () => {
    addToken(makeToken({ id: "own-hero", name: "Alyssa", hp: 0, hpMax: 40, pm: 20, pmMax: 20, controlledBy: PEER }));
    const node = mount(<PlayerTable/>);
    await selectUnit(node, "Alyssa");
    expect((node.querySelector('[aria-label="Reduzir PV"]') as HTMLButtonElement).disabled).toBe(true);
    expect((node.querySelector('[aria-label="Aumentar PV"]') as HTMLButtonElement).disabled).toBe(false);
    expect((node.querySelector('[aria-label="Aumentar PM"]') as HTMLButtonElement).disabled).toBe(true);
    expect((node.querySelector('[aria-label="Reduzir PM"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it("adiciona e remove a própria condição reutilizando token.conditions", async () => {
    addOwnAndForeign();
    const node = mount(<PlayerTable/>);
    await selectUnit(node, "Alyssa");

    // Exploração mantém a ficha compacta: a edição detalhada de efeitos só
    // aparece quando o jogador pede a aba correspondente.
    const effectsButton = node.querySelector('[aria-label="Ver condições e efeitos"]') as HTMLButtonElement;
    await act(async () => effectsButton.click());
    const form = node.querySelector(".mesa-condition-add") as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    await act(async () => {
      input.value = "Atordoado";
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(token("own-hero").conditions).toEqual(["Atordoado"]);
    expect(input.value).toBe("");

    // Sem duplicar a mesma condição.
    await act(async () => {
      input.value = "Atordoado";
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(token("own-hero").conditions).toEqual(["Atordoado"]);

    const chip = [...node.querySelectorAll(".mesa-effect-list button")].find((entry) => entry.getAttribute("aria-label") === "Remover Atordoado") as HTMLButtonElement;
    expect(chip.title).toBe("Remover Atordoado");
    await act(async () => chip.click());
    expect(token("own-hero").conditions).toEqual([]);
  });

  it("rola resistências e perícias da ficha persistente sem abrir ações de combate", async () => {
    addToken(makeToken({ id: "own-hero", name: "Alyssa", controlledBy: PEER, reflexes: 7, luta: 4 }));
    const node = mount(<PlayerTable/>);

    const reflexes = node.querySelector('[aria-label="Rolar teste de Reflexos"]') as HTMLButtonElement;
    expect(reflexes).toBeTruthy();
    await act(async () => reflexes.click());
    expect(getRuntimeSnapshot().combat.rolls[0]).toMatchObject({ actor: "Alyssa", action: "Reflexos", modifier: 7, formula: "1d20+7" });

    const luta = [...node.querySelectorAll(".mesa-player-skill-list button")].find((button) => button.textContent?.includes("Luta")) as HTMLButtonElement;
    await act(async () => luta.click());
    expect(getRuntimeSnapshot().combat.rolls[0]).toMatchObject({ actor: "Alyssa", action: "Luta", modifier: 4, formula: "1d20+4" });
    expect(node.textContent).not.toContain("Agir / Atacar");
    expect(node.textContent).not.toContain("Mover");
  });

  it("centraliza a cena a partir do índice Grupo sem trocar a ficha ancorada", async () => {
    addOwnAndForeign();
    const node = mount(<PlayerTable/>);
    const bruno = [...node.querySelectorAll(".mesa-group-member")].find((entry) => entry.textContent?.includes("Bruno")) as HTMLButtonElement;
    await act(async () => bruno.click());
    expect(getBoard().selectedTokenIds).toEqual(["other-hero"]);
    expect(node.querySelector(".mesa-token-context .mesa-context-identity strong")?.textContent).toBe("Alyssa");
  });

  it("mantém a ficha do próprio jogador ancorada ao inspecionar token alheio", async () => {
    addOwnAndForeign();
    const node = mount(<PlayerTable/>);
    // A ficha já nasce visível: exploração do Jogador não começa com uma
    // coluna vazia que muda para a ficha de quem foi clicado no mapa.
    expect(node.querySelector(".mesa-token-context .mesa-context-identity strong")?.textContent).toBe("Alyssa");
    expect(node.textContent).toContain("Ficha do jogador");

    await selectUnit(node, "Bruno");
    expect(node.querySelector(".mesa-token-context .mesa-context-identity strong")?.textContent).toBe("Alyssa");
    expect(node.querySelector(".mesa-vital-steppers")).toBeTruthy();
    expect(node.querySelector(".mesa-context-condition-summary")).toBeTruthy();
    expect(node.querySelector(".mesa-condition-add")).toBeNull();
    expect(token("other-hero").conditions).toEqual(["Abalado"]);
  });
});
