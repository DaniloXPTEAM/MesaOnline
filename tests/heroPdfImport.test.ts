import { describe, expect, it } from "vitest";
import kaleb from "./fixtures/kaleb-heroi-pdf.json";
import { parseFormFields, parseText, type PdfDraft } from "../src/portal/lib/pdf/parseSheetText";
import { applyDraft } from "../src/portal/components/sheet/PdfImportModal";
import { findClassByName, findRaceByName } from "../src/portal/lib/t20/compendium";
import { buildSheet, defense, load, skillTotal } from "../src/portal/lib/t20/sheetRules";

/**
 * Importação do herói em PDF, usando o importador do PORTAL (o mesmo da Oficina).
 * `kaleb-heroi-pdf.json` traz os campos de formulário originais do PDF "Modelo de Heróis" do usuário.
 */
const blank = (): PdfDraft => ({ attributes: {}, skills: {}, trainedSkills: [], rawText: "", formFields: {}, warnings: [] });
const asFields = (source: Record<string, unknown>) => Object.fromEntries(Object.entries(source).map(([key, value]) => [key, String(value)]));

function kalebDraft() {
  const draft = blank();
  parseFormFields(asFields(kaleb.campos_originais_pdf), draft);
  if (draft.race) draft.raceId = findRaceByName(draft.race)?.id;
  if (draft.class) draft.classId = findClassByName(draft.class)?.id;
  return draft;
}

function kalebSheet() {
  const draft = kalebDraft();
  const base = buildSheet({ name: draft.name!, raceId: draft.raceId!, classId: draft.classId!, level: draft.level, xp: draft.xp, campaign: "", attributes: draft.attributes, trainedSkills: draft.trainedSkills });
  return applyDraft(base, draft);
}

describe("PDF do herói: campos de formulário", () => {
  it("lê nome, raça, origem, classe, nível, divindade, PV, PM, deslocamento, PE e tibares", () => {
    const draft = kalebDraft();
    expect(draft).toMatchObject({ name: "Kaleb", race: "Minauro", origin: "Cosmopolita", class: "Lutador", level: 3, deity: "Arsenal", xp: 3000, money: 124, speed: 9, hp: { max: 39 }, mp: { max: 9 } });
    expect(draft.raceId).toBeTruthy();
    expect(draft.classId).toBeTruthy();
  });

  it("lê os seis atributos do formulário (modFor…modCar)", () => {
    expect(kalebDraft().attributes).toEqual({ for: 6, des: 1, con: 3, int: 1, sab: 0, car: -1 });
  });

  it("lê perícias treinadas (lista e marcas), 'outros' e atributo trocado", () => {
    const draft = kalebDraft();
    expect([...draft.trainedSkills].sort()).toEqual(["eng", "for", "ini", "int", "lut", "ref", "von"]);
    expect(draft.skillOther).toEqual({ eng: 2 });
    expect(draft.skillAttr).toEqual({ eng: "for" });
  });

  it("lê inventário com espaços, sem as instruções do modelo", () => {
    const draft = kalebDraft();
    const names = draft.equipment!.map((item) => item.name);
    expect(names).toContain("Gibão de peles");
    expect(names).toContain("Pó do aparecimento");
    expect(names.some((name) => name.startsWith("*"))).toBe(false);
    expect(draft.equipment!.find((item) => item.name === "Pó do aparecimento")!.slots).toBe(0.5);
    const armor = draft.equipment!.find((item) => item.name === "Gibão de peles")!;
    expect(armor).toMatchObject({ equipped: true, category: "Armadura", defenseBonus: 4, armorPenalty: -3 });
  });

  it("lê o ataque, os poderes e as anotações", () => {
    const draft = kalebDraft();
    expect(draft.attacks).toHaveLength(1);
    expect(draft.attacks![0]).toMatchObject({ name: "Desarmado", skill: "Luta", damage: "1d6", damageAttr: "for", critical: "20/x3", damageType: "Impacto" });
    const powers = draft.powers!.map((p) => p.name.toLowerCase());
    for (const name of ["briga", "casca grossa", "golpe relâmpago", "bom de trago", "rasteira", "sangue de ferro", "alma livre"]) expect(powers.some((p) => p.includes(name))).toBe(true);
    expect(draft.notes).toContain("Habilidades de Raça e Origem");
    expect(draft.notes).toContain("Pontos-Entre-Aventuras");
    expect(draft.notes).not.toContain("Missão 00: Nome (mestre)");
  });

  it("ficha de texto corrido (PDF sem formulário) continua funcionando", () => {
    const draft = blank();
    parseText("Nome: Alyssa\nRaça: Elfo\nClasse: Arcanista\nNível: 5\nFOR 0 DES 2 CON 1 INT 4 SAB 2 CAR 1", draft);
    expect(draft.name).toBe("Alyssa");
    expect(draft.class).toBe("Arcanista");
    expect(draft.level).toBe(5);
    expect(draft.attributes.int).toBe(4);
  });
});

describe("herói aplicado na ficha digital (Oficina e Mesa)", () => {
  it("ficha final bate com o PDF: atributos, PV/PM, defesa, deslocamento, perícias e ataque", () => {
    const sheet = kalebSheet();
    expect(sheet.name).toBe("Kaleb");
    expect(Object.fromEntries(Object.entries(sheet.attributes).map(([k, a]) => [k, a.value]))).toEqual({ for: 6, des: 1, con: 3, int: 1, sab: 0, car: -1 });
    expect(sheet.hp).toEqual({ current: 39, max: 39 });
    expect(sheet.mp).toEqual({ current: 9, max: 9 });
    expect(sheet.speed).toBe(9);
    expect(sheet.xp).toBe(3000);
    expect(sheet.money).toBe(124);
    expect(defense(sheet).total).toBe(19);
    // Luta: ½ nível 1 + FOR 6 + treino 2 = +9 (igual ao ataque "1d20+9" da ficha)
    expect(skillTotal(sheet, "lut")!.total).toBe(9);
    expect(skillTotal(sheet, "for")!.total).toBe(6);
    expect(skillTotal(sheet, "eng")!.total).toBe(11);
    expect(sheet.attacks).toHaveLength(1);
    expect(sheet.attacks[0].bonus).toBeUndefined();
  });

  it("o inventário é o da ficha (não o kit inicial) e respeita a carga", () => {
    const sheet = kalebSheet();
    expect(sheet.equipment.some((item) => /ração/i.test(item.name))).toBe(false);
    expect(sheet.equipment.find((item) => item.name === "Gibão de peles")!.equipped).toBe(true);
    expect(load(sheet).used).toBeGreaterThan(8);
    expect(sheet.powers.length).toBeGreaterThanOrEqual(7);
    expect(sheet.notes).toContain("Anotações");
  });
});
