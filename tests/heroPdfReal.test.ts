import { describe, expect, it } from "vitest";
import rahkar from "./fixtures/rahkar-campos-pdf.json";
import lagrima from "./fixtures/lagrima-campos-pdf.json";
import { heroJsonToDraft, sheetFromDraft } from "../src/portal/lib/pdf/heroJson";
import { attackTotal, defense, skillTotal } from "../src/portal/lib/t20/sheetRules";
import { boardTokenFromCharacter } from "../src/integration/modernRpgCharacterBridge";

/**
 * Campos de formulário extraídos (com a mesma regra do leitor do sistema) de duas fichas reais feitas no
 * mesmo PDF "Modelo de Heróis": Rahkar (bárbaro, preenchido com símbolos como "−1", "3.000", "•")
 * e Lágrima (arcanista, magias em lista solta, perícias em texto).
 */
const draftOf = (fields: Record<string, string>) => heroJsonToDraft({ personagem: { nome: fields.Nome }, campos_originais_pdf: fields });

describe("ficha real: Rahkar (bárbaro)", () => {
  const draft = draftOf(rahkar);
  const sheet = sheetFromDraft(draft, "", "PDF");

  it("lê dados básicos, números com milhar e atributos", () => {
    expect(draft).toMatchObject({ name: "Rahkar", race: "Humano", origin: "Gladiador", class: "Bárbaro", level: 3, xp: 3000, money: 600, speed: 9 });
    expect(draft.attributes).toEqual({ for: 4, des: 3, con: 3, int: 0, sab: 1, car: 1 });
    expect(draft.hp).toEqual({ max: 45, current: 45 });
  });

  it("nível do campo (1) não bate com 3000 PE: vale o nível dos PE e avisa", () => {
    expect(draft.warnings.join(" ")).toMatch(/não bate com os 3000 PE/);
    expect(sheet.level).toBe(3);
  });

  it("treinadas: lista de texto + marcas do formulário", () => {
    expect([...draft.trainedSkills].sort()).toEqual(["atl", "atu", "for", "ini", "int", "lut", "per", "ref", "von"]);
  });

  it("armadura com penalidade em sinal unicode e defesa da ficha", () => {
    const armor = sheet.equipment.find((item) => item.name === "Couro batido")!;
    expect(armor).toMatchObject({ equipped: true, category: "Armadura", defenseBonus: 3, armorPenalty: -1 });
    expect(defense(sheet).total).toBe(20);
    expect(sheet.equipment.find((item) => item.name.startsWith("Machado de guerra"))!.equipped).toBe(true);
  });

  it("ataques com bônus e dano da ficha", () => {
    expect(sheet.attacks.map((a) => a.name)).toEqual(["Machado de guerra", "Machado de guerra (Fúria)", "Desarmado"]);
    const axe = sheet.attacks[0];
    expect(axe).toMatchObject({ skill: "Luta", damage: "1d12", damageBonus: 9, critical: "x3", damageType: "Corte" });
    expect(attackTotal(sheet, axe).bonus).toBe(7);
    expect(axe.bonus).toBeUndefined();
    expect(skillTotal(sheet, "lut")!.total).toBe(7); // ½ nível 1 + FOR 4 + treino 2: bate com o +7 da ficha, sem ajuste
  });

  it("na Mesa o token sai com os números da ficha importada", () => {
    const token = boardTokenFromCharacter(sheet, { x: 2, y: 2 });
    expect(token).toMatchObject({ name: "Rahkar", hp: 45, hpMax: 45, pmMax: 9, defense: 20, luta: 7, movementM: 9, critMultiplier: 3, modernRpgCharacterId: sheet.id });
    expect(token.tacticalActions?.some((action) => /machado de guerra/i.test(action.name))).toBe(true);
  });

  it("poderes da ficha, sem as linhas 'Nenhuma…'", () => {
    const names = sheet.powers.map((p) => p.name.toLowerCase());
    for (const name of ["fúria", "golpe poderoso", "pele de ferro", "instinto selvagem", "torcida", "estilo de duas mãos"]) expect(names.some((n) => n.includes(name))).toBe(true);
    expect(names.some((n) => n.startsWith("nenhum"))).toBe(false);
  });
});

describe("ficha real: Lágrima (arcanista)", () => {
  const draft = draftOf(lagrima);
  const sheet = sheetFromDraft(draft, "", "PDF");

  it("classe sem o parêntese, jogador e atributos", () => {
    expect(draft.class).toBe("Arcanista");
    expect(draft.classId).toBeTruthy();
    expect(draft.attributes).toMatchObject({ for: -2, des: 2, int: 2, sab: 8, car: 1 });
    expect(sheet.notes).toContain("Feiticeiro");
    expect(draft.hp).toEqual({ max: 56, current: 56 });
    expect(draft.mp).toEqual({ max: 32, current: 32 });
  });

  it("perícias (texto com 'Reflexo' no singular) e atributo trocado em Misticismo", () => {
    expect([...draft.trainedSkills].sort()).toEqual(["for", "ini", "mis", "per", "ref", "von"]);
    expect(draft.skillAttr).toEqual({ mis: "sab" });
    expect(skillTotal(sheet, "mis")!.attr).toBe("sab");
  });

  it("magias em lista solta entram, sem repetir nem trazer o texto-modelo", () => {
    const names = sheet.spells.map((s) => s.name.toLowerCase());
    expect(names.length).toBeGreaterThanOrEqual(6);
    expect(new Set(names).size).toBe(names.length);
    expect(names.some((n) => n.includes("<"))).toBe(false);
  });

  it("instruções do modelo (*…*) não viram itens", () => {
    expect(sheet.equipment.some((item) => item.name.startsWith("*"))).toBe(false);
    expect(sheet.equipment.some((item) => /besta leve/i.test(item.name))).toBe(true);
  });
});
