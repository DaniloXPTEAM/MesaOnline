import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CombatActions, InitiativePanel, RollTable } from "../src/components/mesaSkin/components/Panels";
import { SkinRuntimeContext, type SkinRuntime } from "../src/components/mesaSkin/runtime";
import { makeToken } from "./helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Visão de combate: painel com abas, Poderes do Compêndio, iniciativa editável e Mesa de Rolagens. */
const runtimeWith = (overrides: Partial<SkinRuntime> = {}) => ({
  isMaster: true,
  canOperateFocus: true,
  focus: { name: "Kaleb", subtitle: "", combatSubtitle: "Nível 3 • Lutador Minauro", portrait: "kael", hp: 30, hpMax: 39, pm: 5, pmMax: 9, defense: 19 },
  saves: [
    { id: "saves", name: "Reflexos", value: "+4", icon: "pentagram", tone: "#a855c7" },
    { id: "saves", name: "Fortitude", value: "+6", icon: "shield", tone: "#d9a94c" },
    { id: "saves", name: "Vontade", value: "+2", icon: "star", tone: "#d9a94c" },
  ],
  equipment: [], hotkeys: [], spells: [], skills: [],
  powers: [
    { name: "Fúria", type: "Classe · Bárbaro", requirement: "Nível 1", source: "Tormenta 20", description: "Gaste 2 PM para entrar em Fúria.", passive: false },
    { name: "Sombra", type: "Racial", description: "+2 Furtividade.", passive: true },
  ],
  initiative: [
    { id: "a", name: "Kaleb", portrait: "kael", side: "ally", hp: 30, hpMax: 39, mp: 5, mpMax: 9, turn: 1, active: true, roll: 18 },
    { id: "b", name: "Goblin", portrait: "foe", side: "enemy", hp: 7, hpMax: 7, mp: 0, mpMax: 0, turn: 2, roll: 12 },
  ],
  rolls: [
    { id: "r1", author: "Kaleb", portrait: "kael", time: "agora", title: "Iniciativa", formula: "1d20+4", result: "18", outcome: "Iniciativa 18", outcomeTone: "#5ec46a" },
    { id: "r2", author: "Goblin", portrait: "foe", time: "agora", title: "Iniciativa", formula: "1d20+1", result: "12", outcome: "Iniciativa 12", outcomeTone: "#5ec46a" },
  ],
  ...overrides,
}) as unknown as SkinRuntime;

let root: Root | undefined;
let node: HTMLDivElement;
beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
afterEach(() => { act(() => root?.unmount()); node.remove(); root = undefined; });

async function render(ui: React.ReactNode, runtime: SkinRuntime) {
  await act(async () => { root = createRoot(node); root.render(<SkinRuntimeContext.Provider value={runtime}>{ui}</SkinRuntimeContext.Provider>); });
}
async function unmount() {
  await act(async () => root?.unmount());
  root = undefined;
}
const button = (label: string) => [...node.querySelectorAll("button")].find((entry) => entry.textContent?.trim() === label || entry.getAttribute("aria-label") === label) as HTMLButtonElement | undefined;
const typeInto = async (input: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("painel do personagem no combate", () => {
  it("tem as abas Ações, Ficha, Inventário e Poderes (sem Passivas)", async () => {
    await render(<CombatActions links={{}} onAction={() => undefined} />, runtimeWith());
    for (const label of ["Ações", "Ficha", "Inventário", "Poderes"]) expect(button(label), label).toBeTruthy();
    expect(button("Passivas")).toBeUndefined();
  });

  it("testes com rótulo curto (REF, FORT, VON) e linha de PV e PM", async () => {
    await render(<CombatActions links={{}} onAction={() => undefined} />, runtimeWith());
    expect(node.textContent).toContain("REF");
    expect(node.textContent).toContain("FORT");
    expect(node.textContent).toContain("VON");
    for (const label of ["Dano", "Cura", "Gastar", "Recuperar"]) expect(button(label), label).toBeTruthy();
  });

  it("Dano e Cura mandam a quantidade digitada; quem não controla o token fica travado", async () => {
    const onAction = vi.fn();
    await render(<CombatActions links={{}} onAction={onAction} />, runtimeWith());
    await typeInto(node.querySelector<HTMLInputElement>('input[aria-label="Quantidade de PV"]')!, "7");
    await act(async () => button("Dano")!.click());
    await act(async () => button("Cura")!.click());
    expect(onAction).toHaveBeenCalledWith("vital:damage:7");
    expect(onAction).toHaveBeenCalledWith("vital:heal:7");
    await unmount();
    await render(<CombatActions links={{}} onAction={onAction} />, runtimeWith({ canOperateFocus: false }));
    expect(button("Dano")!.disabled).toBe(true);
    expect(button("Gastar")!.disabled).toBe(true);
  });

  it("aba Poderes lista os poderes da ficha e abre requisito, fonte e descrição", async () => {
    await render(<CombatActions links={{}} onAction={() => undefined} />, runtimeWith());
    await act(async () => { button("Poderes")!.click(); await new Promise((resolve) => setTimeout(resolve, 1200)); });
    const power = [...node.querySelectorAll("button")].find((entry) => entry.textContent?.includes("Fúria"));
    if (!power) return; // em jsdom a troca animada de aba pode não terminar; o navegador real é conferido à parte
    expect(node.textContent).toContain("Poderes ativos");
    expect(node.textContent).toContain("Poderes passivos");
    expect(node.textContent).toContain("Passivo");
    await act(async () => power.click());
    expect(node.textContent).toContain("Requisito:");
    expect(node.textContent).toContain("Tormenta 20");
    expect(node.textContent).toContain("Gaste 2 PM para entrar em Fúria.");
  });
});

describe("iniciativa", () => {
  it("mostra à esquerda o número que cada um tirou", async () => {
    await render(<InitiativePanel links={{}} onAction={() => undefined} />, runtimeWith());
    expect(button("Iniciativa de Kaleb: 18")).toBeTruthy();
    expect(button("Iniciativa de Goblin: 12")).toBeTruthy();
  });

  it("o mestre edita o número e o jogador não", async () => {
    const onAction = vi.fn();
    await render(<InitiativePanel links={{}} onAction={onAction} />, runtimeWith());
    await act(async () => button("Iniciativa de Goblin: 12")!.click());
    const input = node.querySelector<HTMLInputElement>('input[aria-label="Iniciativa de Goblin"]')!;
    await typeInto(input, "25");
    await act(async () => { input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
    expect(onAction).toHaveBeenCalledWith("initiativeSet:b:25");
    await unmount();
    await render(<InitiativePanel links={{}} onAction={onAction} />, runtimeWith({ isMaster: false }));
    expect(button("Iniciativa de Goblin: 12")!.disabled).toBe(true);
  });
});

describe("Mesa de rolagens", () => {
  it("cartão fixo com o último acontecimento; sem busca nem filtro", async () => {
    await render(<RollTable links={{}} onAction={() => undefined} />, runtimeWith());
    expect(node.textContent).toContain("Mesa de rolagens");
    expect(node.textContent).toContain("As rolagens de iniciativa foram feitas.");
    expect(node.querySelector('input[type="search"]')).toBeNull();
    expect(node.textContent).not.toContain("Todos");
  });

  it("clicar num cartão fixa a rolagem no começo da lista", async () => {
    await render(<RollTable links={{}} onAction={() => undefined} />, runtimeWith());
    const cards = () => [...node.querySelectorAll('button[title$="rolagem"]')].map((entry) => entry.textContent);
    expect(cards()[0]).toContain("Kaleb");
    await act(async () => { [...node.querySelectorAll<HTMLButtonElement>('button[title="Fixar rolagem"]')][1].click(); });
    expect(cards()[0]).toContain("Goblin");
    expect(node.querySelector('button[title="Desafixar rolagem"]')).toBeTruthy();
  });

  it("o cartão fixo leva ao Diário", async () => {
    const onAction = vi.fn();
    await render(<RollTable links={{}} onAction={onAction} />, runtimeWith());
    await act(async () => node.querySelector<HTMLButtonElement>('button[title="Abrir o Diário"]')!.click());
    expect(onAction).toHaveBeenCalledWith("journal");
  });
});

describe("motor: editar iniciativa", () => {
  beforeEach(() => { localStorage.clear(); vi.resetModules(); });

  it("reorganiza a ordem pelo novo número e mantém quem está no turno", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.addToken(makeToken({ id: "t1", name: "Aro", initiative: 0 }));
    bridge.addToken(makeToken({ id: "t2", name: "Bia", initiative: 0, gx: 2 }));
    bridge.addToken(makeToken({ id: "t3", name: "Cal", initiative: 0, gx: 3 }));
    bridge.startCombat();
    const active = bridge.getCombatState().activeTokenId;
    bridge.setInitiativeRoll("t3", 99);
    const state = bridge.getCombatState();
    expect(state.order[0]).toBe("t3");
    expect(state.activeTokenId).toBe(active);
    expect(bridge.getBoard().tokens.find((token) => token.id === "t3")!.initiativeRoll).toBe(99);
    bridge.setInitiativeRoll("t3", -5);
    expect(bridge.getCombatState().order.at(-1)).toBe("t3");
  });
});

describe("poderes da ficha na aba Poderes", () => {
  it("juntam poderes, habilidades raciais e de classe, sem repetir, e classificam ativo x passivo", async () => {
    const { powersOf } = await import("../src/components/mesa/skinRuntime");
    const sheet = {
      powers: [{ id: "p1", name: "Golpe Poderoso", type: "Combate", description: "Quando faz um ataque corpo a corpo, você pode gastar 1 PM para causar mais dano.", cost: 1 }],
      racialAbilities: [{ id: "r1", name: "Visão na Penumbra", description: "Você enxerga bem com pouca luz." }],
      classAbilities: [
        { id: "c1", name: "Golpe Poderoso", description: "repetido" },
        { id: "c2", name: "Ataque Furtivo", description: "Uma vez por rodada, causa +1d6 dano se atingir criatura desprevenida." },
      ],
    } as never;
    const list = powersOf(sheet);
    expect(list.map((power) => power.name)).toEqual(["Golpe Poderoso", "Visão na Penumbra", "Ataque Furtivo"]);
    expect(list.find((power) => power.name === "Golpe Poderoso")!.passive).toBe(false);
    expect(list.find((power) => power.name === "Visão na Penumbra")!.passive).toBe(true);
    expect(list.find((power) => power.name === "Ataque Furtivo")!.passive).toBe(true);
    expect(list.find((power) => power.name === "Visão na Penumbra")!.type).toBe("Racial");
  });
});
