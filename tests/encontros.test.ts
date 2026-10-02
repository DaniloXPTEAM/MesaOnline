import { describe, expect, it } from "vitest";
import { GRUPOS_DE_AMBIENTE, PATAMARES, TERRENOS, ameacasNaDescricao, sortearEncontro, testarSorteDaViagem } from "../src/game/encontros";
import { listThreats } from "../src/tactics/engine/customThreats";

/** Encontro aleatório: tabelas do projeto, patamar do grupo e tokens das ameaças sorteadas. */
const seq = (...values: number[]) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };

describe("tabelas", () => {
  it("têm os ambientes e as regiões do gerador antigo", () => {
    expect(GRUPOS_DE_AMBIENTE.terrenos).toContain("Floresta");
    expect(GRUPOS_DE_AMBIENTE.regioes).toContain("Lamnor");
    expect(Object.values(TERRENOS).reduce((total, tabela) => total + tabela.length, 0)).toBeGreaterThan(500);
    for (const tabela of Object.values(TERRENOS)) for (let i = 1; i < tabela.length; i += 1) expect(tabela[i].porcentagem).toBeGreaterThanOrEqual(tabela[i - 1].porcentagem);
  });
});

describe("sorteio", () => {
  it("d100 + ajuste do patamar escolhe a linha da tabela", () => {
    const base = sortearEncontro("Aquático", "iniciante", seq(0.05)); // d100 = 6
    expect(base.rolagem).toBe(6);
    expect(base.descricao).toMatch(/bandidos comuns/);
    const lenda = sortearEncontro("Aquático", "lenda", seq(0.05));
    expect(lenda.total).toBe(6 + PATAMARES.find((p) => p.id === "lenda")!.ajuste);
    expect(lenda.descricao).not.toBe(base.descricao);
  });

  it("1% de chance do evento lendário (100 e depois até 25)", () => {
    expect(sortearEncontro("Floresta", "iniciante", seq(0.999, 0.1)).descricao).toBe("O Rhandomm");
    expect(sortearEncontro("Floresta", "iniciante", seq(0.999, 0.9)).lendario).toBe(false);
  });

  it("teste de sorte da viagem compara o d100 com a chance", () => {
    expect(testarSorteDaViagem(30, seq(0.1))).toEqual({ rolagem: 11, encontro: true });
    expect(testarSorteDaViagem(30, seq(0.9))).toEqual({ rolagem: 91, encontro: false });
  });
});

describe("ameaças na descrição", () => {
  const catalogo = listThreats();
  it("acha a criatura e rola a quantidade ('1d3 bandidos comuns')", () => {
    const [achado] = ameacasNaDescricao("1d3 bandidos comuns", catalogo, seq(0.99));
    expect(achado.template.name).toBe("Bandido Comum");
    expect(achado.formula).toBe("1d3");
    expect(achado.quantidade).toBe(3);
  });

  it("número fixo ('2 lacedons') e sem número vale 1", () => {
    expect(ameacasNaDescricao("2 lacedons", catalogo)[0]?.quantidade).toBe(2);
    expect(ameacasNaDescricao("1 canceronte", catalogo)[0]?.quantidade).toBe(1);
  });

  it("não cria uma segunda ameaça para 'pirata' dentro de 'capitão pirata'", () => {
    const nomes = ameacasNaDescricao("1 capitão pirata", catalogo).map((entry) => entry.template.name);
    expect(nomes.filter((nome) => /pirata/i.test(nome)).length).toBe(1);
  });

  it("resultado sem criatura (tempestade, baú) não devolve ameaça", () => {
    expect(ameacasNaDescricao("Tempestade em alto mar", catalogo)).toEqual([]);
  });
});
