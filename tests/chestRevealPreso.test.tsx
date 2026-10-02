import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChestReveal from "../src/components/mesa/ChestReveal";
import type { RuntimeSnapshot } from "../src/game/types";
import { makeBoard } from "./helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const REVEAL_AT = 1_000_000;
const chest = (extra = {}) => ({ id: "o1", name: "Armadilha", kind: "chest", x: 1, y: 1, opened: true, locked: false, contents: [], revealAt: REVEAL_AT, ...extra });
const snapshotWith = (objects: unknown[]) => ({ board: makeBoard([], { objects: objects as never }) }) as unknown as RuntimeSnapshot;

let root: Root | undefined;
let node: HTMLDivElement;
beforeEach(() => { vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] }); vi.setSystemTime(REVEAL_AT + 100); node = document.createElement("div"); document.body.appendChild(node); });
afterEach(() => { act(() => root?.unmount()); node.remove(); vi.useRealTimers(); });

describe("aviso de baú/armadilha aberta", () => {
  it("some sozinho mesmo quando o tabuleiro muda enquanto ele está na tela", async () => {
    root = createRoot(node);
    await act(async () => { root!.render(<ChestReveal snapshot={snapshotWith([chest()])} />); });
    expect(node.querySelector(".chest-reveal")).not.toBeNull();
    // um token anda, um ping chega…: o objeto vira outra referência, o efeito roda de novo
    await act(async () => { root!.render(<ChestReveal snapshot={snapshotWith([chest()])} />); });
    await act(async () => { vi.advanceTimersByTime(6000); });
    await act(async () => { vi.useRealTimers(); await new Promise((resolve) => setTimeout(resolve, 900)); });
    expect(node.querySelector(".chest-reveal")).toBeNull();
  });
});
