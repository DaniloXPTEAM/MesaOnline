import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import InitiativeRail from "../src/components/mesa/InitiativeRail";
import { getRuntimeSnapshot } from "../src/game/vttBridge";
import type { TacticalUnitView } from "../src/game/types";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const unit = (id: string, name: string, side: TacticalUnitView["side"], initiative: number): TacticalUnitView => ({
  id, name, side, initiative, initiativeRoll: initiative, title: side === "heroes" ? "Herói" : "Ameaça",
  x: 0, y: 0, symbol: name.slice(0, 2).toUpperCase(), accent: side === "heroes" ? "#386d93" : "#8c3338",
  pv: 20, pvMax: 30, pm: 5, pmMax: 10, defense: 15, luta: 5, pontaria: 4,
  damage: "1d8", crit: 20, critMultiplier: 2, attackType: "melee", rangeM: 1.5,
  movementM: 9, level: 4, spellDC: 15, actions: [], fortitude: 5, reflexes: 4, will: 3,
});

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
  root = null;
  host = null;
});

describe("ordem de iniciativa V3", () => {
  it("usa a ordem autoritativa do combate e seleciona o mesmo token", () => {
    const hero = unit("hero", "Kael Thorne", "heroes", 18);
    const threat = unit("threat", "Brasa do Crepúsculo", "threats", 12);
    const snapshot = {
      ...getRuntimeSnapshot(),
      combat: {
        ...getRuntimeSnapshot().combat,
        active: true,
        round: 3,
        activeTokenId: threat.id,
        order: [threat.id, hero.id],
      },
    };
    const select = vi.fn();
    const view = mount(<InitiativeRail snapshot={snapshot} units={[hero, threat]} onSelect={select}/>);

    const buttons = [...view.querySelectorAll(".mesa-initiative-list-v3 > button")];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain("Brasa do Crepúsculo");
    expect(buttons[0].classList.contains("is-active")).toBe(true);
    expect(buttons[1].textContent).toContain("Kael Thorne");
    act(() => buttons[1].click());
    expect(select).toHaveBeenCalledWith(hero.id);
  });

  it("mantém os tokens da cena visíveis na exploração mesmo sem combate", () => {
    const hero = unit("hero", "Seraphine", "heroes", 7);
    const snapshot = getRuntimeSnapshot();
    const view = mount(<InitiativeRail snapshot={snapshot} units={[hero]} onSelect={() => {}}/>);

    expect(view.textContent).toContain("CENA ATUAL");
    expect(view.textContent).toContain("Seraphine");
    expect(view.querySelector(".mesa-initiative-empty")).toBeNull();
  });
});
