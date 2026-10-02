import { describe, expect, it } from "vitest";
import { sensoryLabel, sensoryStateFor } from "../src/game/senses";
import { advanceDay, encounterChance, resetAfterEncounter, travelState } from "../src/game/travel";
import type { MultiplayerState } from "../src/game/types";
import { makeBoard, makeToken } from "./helpers";

const mp = (over: Partial<MultiplayerState> = {}): MultiplayerState => ({
  role: "player", status: "connected", roomCode: "AAA", peerId: "peer-1",
  peers: [], commandLog: [], ...over,
});

describe("efeitos sensoriais", () => {
  const cego = makeToken({ id: "t1", name: "Vigia", controlledBy: "peer-1", conditions: ["Cego"] });
  const surdo = makeToken({ id: "t2", name: "Ouvinte", controlledBy: "peer-1", conditions: ["Surdo"] });
  const sao = makeToken({ id: "t3", name: "Sadio", controlledBy: "peer-1", conditions: [] });

  it("jogador com token cego fica cego", () => {
    const s = sensoryStateFor(makeBoard([cego]), mp());
    expect(s.blind).toBe(true);
    expect(s.source).toBe("Vigia");
    expect(sensoryLabel(s)).toBe("Cego");
  });

  it("surdo e detectado separadamente, e os dois juntos", () => {
    expect(sensoryStateFor(makeBoard([surdo]), mp()).deaf).toBe(true);
    const ambos = sensoryStateFor(makeBoard([makeToken({ id: "t4", name: "X", controlledBy: "peer-1", conditions: ["Cego", "Surdo"] })]), mp());
    expect(sensoryLabel(ambos)).toBe("Cego e surdo");
  });

  it("o MESTRE nunca fica cego pela condicao de um token", () => {
    expect(sensoryStateFor(makeBoard([cego]), mp({ role: "master" })).blind).toBe(false);
    expect(sensoryStateFor(makeBoard([cego]), mp({ role: "local" })).blind).toBe(false);
  });

  it("token de OUTRO jogador nao afeta voce", () => {
    const alheio = makeToken({ id: "t5", name: "Outro", controlledBy: "peer-2", conditions: ["Cego"] });
    expect(sensoryStateFor(makeBoard([alheio]), mp()).blind).toBe(false);
  });

  it("sem token controlado, sem efeito", () => {
    expect(sensoryStateFor(makeBoard([sao]), mp({ peerId: "peer-9" })).blind).toBe(false);
    expect(sensoryLabel({ blind: false, deaf: false, source: "" })).toBe("");
  });

  it("casa por texto, nao por igualdade exata", () => {
    const t = makeToken({ id: "t6", name: "Y", controlledBy: "peer-1", conditions: ["totalmente cego pela luz"] });
    expect(sensoryStateFor(makeBoard([t]), mp()).blind).toBe(true);
  });
});

describe("viagem e passagem de dia", () => {
  it("chance sobe 5% por dia e tem teto", () => {
    expect(encounterChance(0)).toBe(5);
    expect(encounterChance(3)).toBe(20);
    expect(encounterChance(500)).toBe(95);
  });

  it("avancar o dia soma nos dois contadores", () => {
    const d1 = advanceDay(travelState());
    expect(d1.next).toMatchObject({ days: 1, total: 1, done: 1 });
    expect(d1.chance).toBe(10);
    const d2 = advanceDay(d1.next);
    expect(d2.next).toMatchObject({ days: 2, total: 2, done: 2 });
    expect(d2.message).toMatch(/2 dias sem encontro/);
  });

  it("encontro zera os dias mas preserva o total", () => {
    // o dia do encontro também é um dia de viagem: o total sobe, os dias sem encontro voltam a zero
    const depois = resetAfterEncounter(travelState({ days: 4, total: 11 }));
    expect(depois.next).toMatchObject({ days: 0, total: 12, done: 1 });
    expect(depois.message).toMatch(/Encontro na estrada/);
    expect(encounterChance(depois.next.days)).toBe(5);
  });
});
