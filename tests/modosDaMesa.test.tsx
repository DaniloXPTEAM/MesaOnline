import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { localStorage.clear(); vi.resetModules(); document.documentElement.removeAttribute("data-table-mode"); });

describe("modos da Mesa: Minimalista e Expandido", () => {
  it("o modo vai para <html data-table-mode> e lembra a escolha", async () => {
    const prefs = await import("../src/game/mesaPreferences");
    expect(document.documentElement.dataset.tableMode).toBe("minimal");
    prefs.setPreferences({ tableMode: "expanded" });
    expect(document.documentElement.dataset.tableMode).toBe("expanded");
    expect(JSON.parse(localStorage.getItem("mesa-preferences-v1")!).tableMode).toBe("expanded");
    vi.resetModules();
    const again = await import("../src/game/mesaPreferences");
    expect(again.getPreferences().tableMode).toBe("expanded");
    expect(document.documentElement.dataset.tableMode).toBe("expanded");
    again.setPreferences({ tableMode: "minimal" });
    expect(document.documentElement.dataset.tableMode).toBe("minimal");
  });

  describe("Configurações", () => {
    let root: Root | undefined;
    let node: HTMLDivElement;
    beforeEach(() => { node = document.createElement("div"); document.body.appendChild(node); });
    afterEach(() => { act(() => root?.unmount()); node.remove(); root = undefined; });

    it("os dois botões estão ativos e trocam o modo", async () => {
      const bridge = await import("../src/game/vttBridge");
      const { default: MesaGlobalPanel } = await import("../src/components/mesa/MesaGlobalPanel");
      const prefs = await import("../src/game/mesaPreferences");
      const snapshot = bridge.getRuntimeSnapshot();
      await act(async () => { root = createRoot(node); root.render(<MesaGlobalPanel panel="settings" snapshot={snapshot} units={[]} onClose={() => undefined} onOpenCharacter={() => undefined} onOpenCharacters={() => undefined} onOpenThreats={() => undefined}/>); });
      const button = (label: string) => [...node.querySelectorAll("button")].find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
      expect(button("Minimalista").disabled).toBe(false);
      expect(button("Expandido").disabled).toBe(false);
      await act(async () => button("Expandido").click());
      expect(prefs.getPreferences().tableMode).toBe("expanded");
      await act(async () => button("Minimalista").click());
      expect(prefs.getPreferences().tableMode).toBe("minimal");
    });
  });

  it("toda variável de cor usada no código está definida nos dois modos (senão a tela fica sem fundo)", () => {
    const css = readFileSync(join(process.cwd(), "src/modeColors.css"), "utf8");
    const [minimal, expanded] = css.split(':root[data-table-mode="expanded"]');
    const defined = (block: string) => new Set([...block.matchAll(/--(mxr?-[0-9a-z-]+):/g)].map((match) => match[1]));
    const base = defined(minimal);
    const exp = defined(expanded);
    expect([...base].filter((name) => !exp.has(name))).toEqual([]);
    const used = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (entry === "portal" || entry === "modeColors.css") continue;
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(tsx?|css)$/.test(entry)) for (const match of readFileSync(path, "utf8").matchAll(/var\(--(mxr?-[0-9a-z-]+)\)/g)) used.add(match[1]);
      }
    };
    walk(join(process.cwd(), "src"));
    expect(used.size).toBeGreaterThan(50);
    expect([...used].filter((name) => !base.has(name))).toEqual([]);
  });
});
