import { describe, expect, it } from "vitest";
import { importVttJson } from "../src/portal/lib/vtt/importVtt";
import { boardTokenFromCharacter } from "../src/integration/modernRpgCharacterBridge";

/** Personagem pronto de outro VTT vira ficha oficial e depois token na Mesa (identidade = CharacterSheet.id). */
describe("importar personagem pronto em VTT", () => {
  it("ator do Foundry vira ficha e token com PV/PM e identidade da ficha", () => {
    const actor = { _id: "abc123", name: "Kael Vento Sul", type: "character", system: { detalhes: { nivel: 5, raca: "Elfo", classe: "Ladino" }, attributes: { pv: { value: 30, max: 38 }, pm: { value: 10, max: 12 } }, atributos: { for: { value: 0 }, des: { value: 4 }, con: { value: 1 }, int: { value: 2 }, sab: { value: 1 }, car: { value: 2 } } } };
    const result = importVttJson(JSON.stringify([actor]), "mundo.json");
    expect(result.characters).toHaveLength(1);
    const sheet = result.characters[0];
    expect(sheet.name).toBe("Kael Vento Sul");
    expect(sheet.id).toBeTruthy();
    expect(sheet.level).toBe(5);
    const token = boardTokenFromCharacter(sheet, { x: 2, y: 3 });
    expect(token.modernRpgCharacterId).toBe(sheet.id);
    expect(token.hpMax).toBe(38);
    expect(token.hp).toBe(30);
    expect([token.gx, token.gy]).toEqual([2, 3]);
  });

  it("personagem do Roll20 e NPC do Foundry: personagem entra, NPC vai para a lista de NPCs", () => {
    const roll20 = { name: "Brakka", attribs: [{ name: "charName", current: "Brakka" }, { name: "charClass", current: "Guerreiro" }, { name: "charLevel", current: "4" }, { name: "pvC", current: "40" }, { name: "pvM", current: "40", max: "52" }] };
    const npc = { name: "Guarda", type: "npc", system: {} };
    const result = importVttJson(JSON.stringify([roll20, npc]));
    expect(result.characters.map((sheet) => sheet.name)).toEqual(["Brakka"]);
    expect(result.campaign?.npcs.map((entry) => entry.name)).toContain("Guarda");
  });

  it("arquivo que não é personagem dá mensagem amigável", () => {
    const empty = importVttJson("{\"foo\": 1}");
    expect(empty.characters).toHaveLength(0);
    expect(empty.warnings.join(" ")).toMatch(/Nenhum personagem/);
    expect(() => importVttJson("não é json")).toThrow(/não é JSON/);
  });
});
