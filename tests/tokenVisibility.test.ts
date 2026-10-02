import { describe, expect, it } from "vitest";
import { tokenVisible, visionForTokens, visionTypeFromText, effectiveVisionRadius } from "../src/game/vision";
import { makeBoard, makeToken } from "./helpers";

/**
 * Pendências do Lote 4, fechadas aqui:
 *   1. a ENTIDADE inteira do token respeita visibilidade (não só a imagem);
 *   2. darkvision vem da ficha, nunca de valor fixo;
 *   3. porta aberta/fechada afeta visão de forma coerente.
 */
describe("1. token inteiro respeita a visibilidade", () => {
  const visivel = new Set(["5,5"]);
  const base = { visible: visivel, masterSeesPreview: false, fogEnabled: true };

  it("o Mestre tem visao administrativa por padrao", () => {
    expect(tokenVisible({ x: 9, y: 9, side: "threats" }, { ...base, isMaster: true })).toBe(true);
  });

  it("com a previa ligada, o Mestre passa a ver como o jogador", () => {
    expect(tokenVisible({ x: 9, y: 9, side: "threats" }, { ...base, isMaster: true, masterSeesPreview: true })).toBe(false);
    expect(tokenVisible({ x: 5, y: 5, side: "threats" }, { ...base, isMaster: true, masterSeesPreview: true })).toBe(true);
  });

  it("o jogador so ve ameacas dentro da visao", () => {
    expect(tokenVisible({ x: 9, y: 9, side: "threats" }, { ...base, isMaster: false })).toBe(false);
    expect(tokenVisible({ x: 5, y: 5, side: "threats" }, { ...base, isMaster: false })).toBe(true);
  });

  it("aliados continuam visiveis para o jogador", () => {
    expect(tokenVisible({ x: 9, y: 9, side: "heroes" }, { ...base, isMaster: false })).toBe(true);
  });

  it("com o fog desligado, tudo aparece", () => {
    expect(tokenVisible({ x: 9, y: 9, side: "threats" }, { ...base, isMaster: false, fogEnabled: false })).toBe(true);
  });
});

describe("2. darkvision vem da ficha", () => {
  it("le o texto de raca e habilidades, sem valor fixo", () => {
    expect(visionTypeFromText("Humano")).toBe("normal");
    expect(visionTypeFromText("Anão", "Visão no Escuro: você enxerga no escuro.")).toBe("dark");
    expect(visionTypeFromText("Elfo", "Visão na Penumbra")).toBe("penumbra");
    expect(visionTypeFromText(undefined, null, "")).toBe("normal");
  });

  it("o tipo detectado muda o alcance em cada iluminacao", () => {
    const normal = makeToken({ id: "n", visionType: "normal" });
    const escuro = makeToken({ id: "d", visionType: "dark" });
    const penumbra = makeToken({ id: "p", visionType: "penumbra" });

    expect(effectiveVisionRadius(normal, "darknight")).toBe(0);
    expect(effectiveVisionRadius(penumbra, "darknight")).toBe(0);
    expect(effectiveVisionRadius(escuro, "darknight")).toBe(6);

    expect(effectiveVisionRadius(penumbra, "twilight")).toBe(6);
    expect(effectiveVisionRadius(normal, "twilight")).toBeLessThan(effectiveVisionRadius(normal, "sunny"));
  });

  it("cego vence o tipo de visao", () => {
    const cegoComDarkvision = makeToken({ id: "c", visionType: "dark", conditions: ["Cego"] });
    expect(effectiveVisionRadius(cegoComDarkvision, "sunny")).toBe(1);
  });
});

describe("3. porta muda a visao e o que se ve alem dela", () => {
  const porta = (open: boolean) => ({ id: "d1", type: "door" as const, x1: 3, y1: 0, x2: 3, y2: 12, open });

  it("ameaca atras de porta fechada fica invisivel; abrindo, aparece", () => {
    const heroi = makeToken({ id: "h", gx: 1, gy: 5, side: "heroes" });
    const inimigo = { x: 6, y: 5, side: "threats" };

    const fechada = makeBoard([heroi], { walls: [porta(false)], lighting: "sunny" });
    const aberta = makeBoard([heroi], { walls: [porta(true)], lighting: "sunny" });

    const vf = visionForTokens(fechada, [heroi]).visible;
    const va = visionForTokens(aberta, [heroi]).visible;
    const opts = { isMaster: false, masterSeesPreview: false, fogEnabled: true };

    expect(tokenVisible(inimigo, { ...opts, visible: vf })).toBe(false);
    expect(tokenVisible(inimigo, { ...opts, visible: va })).toBe(true);
  });
});
