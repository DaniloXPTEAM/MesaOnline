import { describe, expect, it } from "vitest";
import { rangeM, withinRange } from "../src/tactics/engine/targeting";
import { makeToken } from "./helpers";

/**
 * TRAVA DA REGRA DE ALCANCE (T20, dupla diagonal).
 *
 * Escrito ao investigar uma falha da E2E: a fixture de
 * `multiplayer.spec.ts` posicionava o alvo a 4x3 casas e assumia 6 m
 * (Chebyshev). Pela regra correta são 10,5 m, e uma magia de 9 m NÃO alcança.
 *
 * A E2E foi corrigida na FIXTURE (alcance do dardo de teste), nunca nas
 * asserções. Estes casos existem para que, se alguém voltar o alcance para
 * Chebyshev "para o teste passar", isto quebre primeiro e em voz alta.
 */
describe("alcance usa dupla diagonal", () => {
  const a = makeToken({ id: "a", gx: 3, gy: 1 });
  const alvo = makeToken({ id: "b", gx: 7, gy: 4 });

  it("4x3 casas sao 10,5 m, nao 6 m", () => {
    expect(rangeM(a, alvo)).toBe(10.5);
    expect(rangeM(a, alvo)).not.toBe(6);
  });

  it("uma acao de 9 m NAO alcanca esse alvo", () => {
    expect(withinRange(a, alvo, 9)).toBe(false);
  });

  it("uma acao de 12 m alcanca", () => {
    expect(withinRange(a, alvo, 12)).toBe(true);
  });

  it("na horizontal pura a conta continua simples", () => {
    const reto = makeToken({ id: "c", gx: 9, gy: 1 });
    expect(rangeM(a, reto)).toBe(9);
    expect(withinRange(a, reto, 9)).toBe(true);
  });
});
