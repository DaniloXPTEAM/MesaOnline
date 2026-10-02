import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("janela Novo token", () => {
  let root: Root | undefined;
  let node: HTMLDivElement;
  beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
  afterEach(() => { act(() => root?.unmount()); node.remove(); document.body.querySelectorAll(".dialog-backdrop").forEach((el) => el.remove()); root = undefined; });

  it("abre no corpo da página (não presa na gaveta), pede imagem e nome, e mostra os dados de ameaça só para ameaça", async () => {
    const { default: TokenEditorDialog } = await import("../src/components/mesa/TokenEditorDialog");
    const onSave = vi.fn();
    await act(async () => { root = createRoot(node); root.render(<TokenEditorDialog sheets={[]} threats={[]} onClose={() => undefined} onSave={onSave}/>); });
    const dialog = document.body.querySelector('[role="dialog"][aria-label="Novo token"]');
    expect(dialog).toBeTruthy();
    expect(node.contains(dialog)).toBe(false);
    expect(dialog!.textContent).not.toContain("Dados da ameaça");
    const buttons = () => [...dialog!.querySelectorAll("button")];
    await act(async () => buttons().find((button) => button.textContent?.includes("Salvar na biblioteca"))!.click());
    expect(dialog!.textContent).toContain("Escolha uma imagem");
    expect(onSave).not.toHaveBeenCalled();
    const select = dialog!.querySelector("select") as HTMLSelectElement;
    await act(async () => { select.value = "threats"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(dialog!.textContent).toContain("Dados da ameaça");
    expect(dialog!.textContent).toContain("Tesouro");
  });

  it("a edição de um token já guardado traz os dados dele", async () => {
    const { default: TokenEditorDialog } = await import("../src/components/mesa/TokenEditorDialog");
    const token = { id: "tok-1", name: "Capitão Orc", image: "data:image/png;base64,AAAA", addedAt: 1, template: { side: "threats" as const, hp: 55, pm: 3, defense: 19, loot: ["Machado"], aura: { radiusM: 6, color: "#ffb765" } } };
    await act(async () => { root = createRoot(node); root.render(<TokenEditorDialog token={token} sheets={[]} threats={[]} onClose={() => undefined} onSave={() => undefined}/>); });
    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-label")).toBe("Editar token");
    expect((dialog.querySelector('input[maxlength="60"]') as HTMLInputElement).value).toBe("Capitão Orc");
    expect([...dialog.querySelectorAll("input")].map((input) => (input as HTMLInputElement).value)).toEqual(expect.arrayContaining(["55", "3", "19", "6"]));
    expect(dialog.querySelector("textarea")!.value).toBe("Machado");
  });
});
