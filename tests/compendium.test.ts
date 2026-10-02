import { describe, expect, it } from "vitest";
import {
  KIND_LABEL, itemToEntry, powerToEntry, searchCompendium, spellToEntry,
} from "../src/game/compendium";

/**
 * Os catálogos (271 magias, 2.284 poderes, 1.400 itens) já existiam e
 * alimentavam o motor — faltava a porta de entrada para consulta na sessão.
 */
describe("conversao dos catalogos", () => {
  it("magia vira entrada com circulo, escola e campos", () => {
    const e = spellToEntry({
      id: "bola-de-fogo", nome: "Bola de Fogo", circulo: 3, escola: "Evocação",
      tipo: "Arcana", execucao: "Padrão", alcance: "Longo", alvo: "esfera de 6m",
      duracao: "Instantânea", resistencia: "Reflexos", custo: 5, descricao: "6d6 de dano de fogo.",
    });
    expect(e.kind).toBe("spell");
    expect(e.name).toBe("Bola de Fogo");
    expect(e.meta).toBe("3º círculo · Evocação · Arcana");
    expect(e.fields.map((f) => f.label)).toContain("Resistência");
    expect(e.description).toMatch(/6d6/);
  });

  it("poder e item viram entradas coerentes", () => {
    const p = powerToEntry({ id: "p1", nome: "Ataque Poderoso", categoria: "Combate", requisito: "For 1" });
    expect(p.meta).toBe("Combate");
    expect(p.fields[0]).toEqual({ label: "Requisito", value: "For 1" });

    const i = itemToEntry({ id: "i1", nome: "Espada Longa", categoria: "Arma", preco: 50, dano: "1d8", critico: "19/x2" });
    expect(i.meta).toBe("Arma · T$ 50");
    expect(i.fields.map((f) => f.value)).toContain("1d8");
  });

  it("campos vazios nao viram linhas em branco", () => {
    const e = spellToEntry({ nome: "Teste", execucao: "", alcance: null, alvo: undefined });
    expect(e.fields).toHaveLength(0);
    expect(e.meta).toBe("");
  });
});

describe("busca", () => {
  const base = [
    spellToEntry({ nome: "Bola de Fogo", escola: "Evocação", descricao: "dano em área" }),
    spellToEntry({ nome: "Explosão de Fogo", escola: "Evocação", descricao: "chamas" }),
    spellToEntry({ nome: "Curar Ferimentos", escola: "Abjuração", descricao: "restaura pontos de vida" }),
  ];

  it("sem termo devolve tudo", () => {
    expect(searchCompendium(base, "")).toHaveLength(3);
  });

  it("prioriza quem COMECA com o termo", () => {
    const r = searchCompendium(base, "bola");
    expect(r[0].name).toBe("Bola de Fogo");
  });

  it("ignora acento e caixa", () => {
    expect(searchCompendium(base, "EVOCACAO")).toHaveLength(2);
    expect(searchCompendium(base, "explosao")[0].name).toBe("Explosão de Fogo");
  });

  it("procura tambem na descricao", () => {
    expect(searchCompendium(base, "pontos de vida")[0].name).toBe("Curar Ferimentos");
  });

  it("termo sem resultado devolve vazio e respeita o limite", () => {
    expect(searchCompendium(base, "zzzz")).toEqual([]);
    expect(searchCompendium(base, "", 2)).toHaveLength(2);
  });

  it("expoe os tres catalogos", () => {
    expect(Object.keys(KIND_LABEL)).toEqual(["spell", "power", "item"]);
  });
});
