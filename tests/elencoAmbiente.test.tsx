import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("Elenco, Ambiente e Bestiário", () => {
  let root: Root | undefined;
  let node: HTMLDivElement;
  beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
  afterEach(() => { act(() => root?.unmount()); node.remove(); root = undefined; });

  const buttonByText = (text: string) => [...node.querySelectorAll("button")].find((button) => button.textContent?.includes(text));

  async function mountPanel(panel: "roster" | "environment" | "master" | "scenes" | "map-context", role: "master" | "player" = "master") {
    const bridge = await import("../src/game/vttBridge");
    const { default: MesaGlobalPanel } = await import("../src/components/mesa/MesaGlobalPanel");
    const { tacticalViewForToken } = await import("../src/integration/modernRpgCharacterBridge");
    bridge.addToken(makeToken({ id: "h1", name: "Aro", side: "heroes" }));
    bridge.selectToken("h1");
    bridge.upsertWall({ id: "porta-1", type: "door", x1: 2, y1: 2, x2: 3, y2: 2, name: "Porta da taverna" });
    const snapshot = { ...bridge.getRuntimeSnapshot() };
    if (role === "player") snapshot.multiplayer = { ...snapshot.multiplayer, role: "player" };
    const units = snapshot.board.tokens.map(tacticalViewForToken);
    await act(async () => {
      root = createRoot(node);
      root.render(<MesaGlobalPanel panel={panel} snapshot={snapshot} units={units} selectedUnit={units.find((unit) => unit.id === "h1")} onClose={() => undefined} onOpenCharacter={() => undefined} onOpenCharacters={() => undefined} onOpenThreats={() => undefined}/>);
    });
    return bridge;
  }

  it("Elenco: clicar no token selecionado tira a seleção; só heróis e ameaças (itens e baús ficam na Ambientação)", async () => {
    const bridge = await mountPanel("roster");
    expect(buttonByText("Centralizar") ?? node.querySelector('button[aria-label="Centralizar no mapa"]')).toBeTruthy();
    expect(node.textContent).not.toContain("Adicionar ameaça");
    expect(node.textContent).not.toContain("ITENS, BAÚS E TESOUROS");
    await act(async () => buttonByText("Aro")!.click());
    expect(bridge.getRuntimeSnapshot().board.selectedTokenIds).toEqual([]);
  });

  it("Ambientação: o mestre cria baú ao lado do token selecionado", async () => {
    const bridge = await mountPanel("map-context");
    await act(async () => buttonByText("Baú")!.click());
    const objects = bridge.getRuntimeSnapshot().board.objects;
    expect(objects).toHaveLength(1);
    expect(objects[0].kind).toBe("chest");
  });

  it("Elenco: jogador não vê adicionar nem itens e baús", async () => {
    await mountPanel("roster", "player");
    expect(node.textContent).not.toContain("Personagem ou ficha");
    expect(node.textContent).not.toContain("ITENS, BAÚS E TESOUROS");
    expect(node.textContent).not.toContain("Mais opções do mestre");
  });

  it("Ambiente: Clima, Fog, Luz, Visão, Paredes e Portas, cada um na sua seção", async () => {
    await mountPanel("environment");
    for (const label of ["Clima", "Fog", "Luz", "Visão", "Paredes", "Portas"]) expect(buttonByText(label), label).toBeTruthy();
    await act(async () => buttonByText("Portas")!.click());
    expect(node.textContent).toContain("Porta da taverna");
    expect(node.textContent).toContain("Criar porta no mapa");
    await act(async () => buttonByText("Ambiente")!.click());
    await act(async () => buttonByText("Paredes")!.click());
    expect(node.textContent).toContain("Desenhar paredes no mapa");
    await act(async () => buttonByText("Ambiente")!.click());
    await act(async () => buttonByText("Visão")!.click());
    expect(node.textContent).toContain("VISÃO DOS JOGADORES");
  });

  it("Bestiário: lista do compêndio à esquerda e o formulário Nova ameaça à direita", async () => {
    const { ThreatLibraryDialog } = await import("../src/components/Libraries");
    const { listThreats } = await import("../src/tactics/engine/customThreats");
    await act(async () => {
      root = createRoot(node);
      root.render(<ThreatLibraryDialog open templates={listThreats()} onClose={() => undefined} onSpawn={() => undefined} onCatalogChanged={() => undefined}/>);
    });
    expect(node.querySelector(".dialog.wide .threat-dialog-grid")).toBeTruthy();
    expect(node.textContent).toContain("Compêndio ModernRPG");
    expect(node.textContent).toContain("Nova ameaça");
    expect(node.querySelectorAll(".threat-item").length).toBeGreaterThan(10);
    expect(node.textContent).toContain("ações interpretadas");
  });

  it("Ferramenta de mestre: Sala online é um submenu, com volta", async () => {
    await mountPanel("master");
    expect(node.textContent).toContain("Encontro aleatório".toUpperCase());
    await act(async () => buttonByText("Sala online")!.click());
    expect(node.textContent).toMatch(/Abrir sala|Criar sala|Entrar/i);
    expect(node.textContent).not.toContain("ENCONTRO ALEATÓRIO");
    await act(async () => buttonByText("Ferramenta de mestre")!.click());
    expect(node.textContent).toContain("ENCONTRO ALEATÓRIO");
  });

  it("Cenas e mapas: Nova cena e Importar mapa no alto (o mapa pergunta a cena); a mídia saiu daqui", async () => {
    await mountPanel("scenes");
    const titles = [...node.querySelectorAll("h4")].map((entry) => entry.textContent?.trim() || "");
    const at = (label: RegExp) => titles.findIndex((title) => label.test(title));
    expect(at(/ADICIONAR/)).toBeGreaterThan(-1);
    expect(at(/TAMANHO E POSIÇÃO/)).toBeGreaterThan(at(/ADICIONAR/));
    expect(at(/MÍDIA NA CENA/)).toBe(-1);
    expect(node.textContent).not.toContain("Novo mapa nesta cena");
    await act(async () => buttonByText("Importar mapa")!.click());
    expect(node.querySelector(".mesa-add-map select")).toBeTruthy();
    expect(node.textContent).toContain("Em qual cena o mapa entra?");
    await act(async () => buttonByText("Nova cena")!.click());
    expect(node.textContent).toContain("Nome da nova cena");
    expect((node.querySelector(".mesa-add-map input") as HTMLInputElement).value).toMatch(/^Cena \d+$/);
  });

  it("Ambientação: itens, armadilhas, luzes e a mídia (por último)", async () => {
    await mountPanel("map-context");
    const titles = [...node.querySelectorAll("h4")].map((entry) => entry.textContent?.trim() || "");
    for (const part of [/ITENS, BAÚS E TESOUROS/, /ARMADILHAS/, /LUZES/, /MÍDIA NA CENA/]) expect(titles.some((title) => part.test(title)), String(part)).toBe(true);
    expect(titles[titles.length - 1]).toMatch(/MÍDIA NA CENA/);
  });
});

