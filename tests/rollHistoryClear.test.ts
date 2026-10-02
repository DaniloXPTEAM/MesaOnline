import { afterEach, describe, expect, it } from "vitest";
import { appendChat, appendRoll, clearRollHistory, getRuntimeSnapshot } from "../src/game/vttBridge";

describe("limpeza do histórico de rolagens da máscara", () => {
  afterEach(() => clearRollHistory());

  it("remove somente rolagens e preserva a narrativa da mesa", () => {
    clearRollHistory();
    appendChat({ author: "Mestre", text: "A porta de bronze se abre.", kind: "system" });
    appendRoll({
      id: "roll-for-clear-test",
      actor: "Kael",
      target: "—",
      action: "Ataque",
      kind: "attack",
      natural: 14,
      modifier: 7,
      total: 21,
      formula: "1d20+7",
      rolls: [14],
      outcome: "Acerto",
      success: true,
      timestamp: Date.now(),
    });
    expect(getRuntimeSnapshot().combat.rolls.some((roll) => roll.id === "roll-for-clear-test")).toBe(true);
    expect(getRuntimeSnapshot().board.chat.some((entry) => entry.kind === "roll")).toBe(true);

    clearRollHistory();

    expect(getRuntimeSnapshot().combat.rolls).toEqual([]);
    expect(getRuntimeSnapshot().board.chat.some((entry) => entry.kind === "roll")).toBe(false);
    expect(getRuntimeSnapshot().board.chat.some((entry) => entry.text === "A porta de bronze se abre.")).toBe(true);
  });
});
