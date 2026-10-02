import { describe, expect, it } from "vitest";
import { mountError } from "../src/game/mount";
import { footprintOf, mountSizeError, parseSize, sizeOf } from "../src/game/tokenSize";
import { getOfficialThreats } from "../src/tactics/data/bestiaryAdapter";
import { ownedMountTokens } from "../src/game/companions";
import { makeBoard, makeToken } from "./helpers";

describe("tamanho e montaria", () => {
  it("lê o tamanho do texto do bestiário e da raça", () => {
    expect(parseSize("Humanoide (humano) Médio")).toBe("medio");
    expect(parseSize("Monstro Enorme")).toBe("enorme");
    expect(parseSize("Pequeno")).toBe("pequeno");
    expect(parseSize("")).toBeUndefined();
    expect(getOfficialThreats().find((threat) => threat.id === "bandido")!.size).toBe("medio");
  });
  it("espaço ocupado por categoria", () => {
    expect([footprintOf("pequeno"), footprintOf("medio"), footprintOf("grande"), footprintOf("enorme"), footprintOf("colossal")]).toEqual([1, 1, 2, 3, 6]);
  });
  it("a montaria precisa ser 1 ou 2 categorias maior que o cavaleiro", () => {
    const goblin = makeToken({ id: "g", name: "Goblin", size: "pequeno" });
    expect(mountSizeError(goblin, makeToken({ name: "Lobo", size: "medio" }))).toBeNull();
    expect(mountSizeError(goblin, makeToken({ name: "Urso", size: "grande" }))).toBeNull();
    expect(mountSizeError(goblin, makeToken({ name: "Dragão", size: "enorme" }))).not.toBeNull();
    expect(mountSizeError(goblin, makeToken({ name: "Rato", size: "pequeno" }))).not.toBeNull();
    const humano = makeToken({ id: "h", name: "Aro", size: "medio" });
    expect(mountSizeError(humano, makeToken({ name: "Cavalo", size: "grande" }))).toBeNull();
    expect(mountSizeError(humano, makeToken({ name: "Cão", size: "medio" }))).not.toBeNull();
  });
  it("montar também confere distância e tamanho", () => {
    const rider = makeToken({ id: "r", name: "Aro", side: "heroes", gx: 1, gy: 1, size: "medio" });
    const horse = makeToken({ id: "m", name: "Cavalo", side: "heroes", gx: 2, gy: 1, size: "grande" });
    const small = makeToken({ id: "p", name: "Pônei", side: "heroes", gx: 2, gy: 2, size: "medio" });
    const board = makeBoard([rider, horse, small]);
    expect(mountError(board, rider, horse)).toBeNull();
    expect(mountError(board, rider, small)).toMatch(/categorias de tamanho/);
  });

  it("token sem tamanho gravado usa o tipo escrito na ameaça (Goblin = Pequeno)", () => {
    expect(sizeOf(makeToken({ title: "Humanoide (goblin) Pequeno · ND 1" }))).toBe("pequeno");
    expect(sizeOf(makeToken({ title: "Arcanista" }))).toBe("medio");
  });
  it("aventureiro só vê as montarias da própria ficha; parceiro de outro personagem não aparece", () => {
    localStorage.setItem("tormenta20_online_companions_v1", JSON.stringify([
      { id: "c1", name: "Trovão", kind: "Montaria", owner: "ficha-1", threatId: "cavalo" },
      { id: "c2", name: "Sombra", kind: "Montaria", owner: "ficha-2" },
      { id: "c3", name: "Piu", kind: "Familiar", owner: "ficha-1" },
    ]));
    const rider = makeToken({ id: "r", name: "Aro", modernRpgCharacterId: "ficha-1" });
    const board = makeBoard([rider, makeToken({ id: "t", name: "Trovão", size: "grande" }), makeToken({ id: "s", name: "Sombra", size: "grande" }), makeToken({ id: "p", name: "Piu", size: "minusculo" }), makeToken({ id: "x", name: "Corcel", size: "grande", abilities: [{ name: "Parceiro", type: "", description: "Montaria Grande. Iniciante: +2 em testes. Veterano: ..." }] }), makeToken({ id: "y", name: "Ursinho", size: "grande" })]);
    expect(ownedMountTokens(board, rider).map((token) => token.name)).toEqual(["Trovão"]);
    expect(ownedMountTokens(board, rider, ["Corcel", "Ursinho"]).map((token) => token.name).sort()).toEqual(["Corcel", "Trovão"]); // Ursinho está na mochila mas não é montaria no bestiário
    localStorage.clear();
  });
});
