import { beforeEach, describe, expect, it, vi } from "vitest";

/** Botões "Avançar um dia" e "Houve encontro" da Viagem (Ferramenta de mestre). */
beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("viagem", () => {
  it("avançar um dia soma o contador e a chance; houve encontro zera os dias sem apagar o total", async () => {
    const bridge = await import("../src/game/vttBridge");
    expect(bridge.getRuntimeSnapshot().board.travel?.days ?? 0).toBe(0);
    bridge.advanceTravelDay();
    bridge.advanceTravelDay();
    expect(bridge.getRuntimeSnapshot().board.travel).toMatchObject({ days: 2, total: 2 });
    bridge.resetTravelEncounter();
    // o dia do encontro também é um dia de viagem
    expect(bridge.getRuntimeSnapshot().board.travel).toMatchObject({ days: 0, total: 3 });
  });

  it("registra no chat", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.advanceTravelDay();
    expect(bridge.getBoard().chat.some((entry) => /viagem|dia/i.test(entry.text))).toBe(true);
  });
});
