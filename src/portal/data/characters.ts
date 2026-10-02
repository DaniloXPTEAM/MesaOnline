import type { CharacterSheet } from "../types/sheet";
import { findItemByName, findPowerByName, T20_SPELLS } from "../lib/t20/compendium";
import { buildSheet, itemToAttack, itemToEquipment, powerToEntry, spellToItem, uid } from "../lib/t20/sheetRules";

const item = (name: string, qty = 1, equipped = false) => {
  const def = findItemByName(name);
  return def ? itemToEquipment(def, qty, equipped) : null;
};
const items = (list: [string, number?, boolean?][]) =>
  list.map(([n, q, e]) => item(n, q, e)).filter((x): x is NonNullable<typeof x> => !!x);
const attack = (name: string) => {
  const def = findItemByName(name);
  return def ? itemToAttack(def) : null;
};
const attacks = (list: string[]) => list.map(attack).filter((x): x is NonNullable<typeof x> => !!x);
const power = (name: string) => {
  const p = findPowerByName(name);
  return p ? powerToEntry(p) : null;
};
const powers = (list: string[]) => list.map(power).filter((x): x is NonNullable<typeof x> => !!x);
const spells = (names: string[]) =>
  names
    .map((n) => T20_SPELLS.find((s) => s.nome.toLowerCase() === n.toLowerCase()))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map(spellToItem);

/* -------------------------------------------------------------------------- */

const vharo: CharacterSheet = {
  ...buildSheet({
    name: "Vharo Lumen",
    raceId: "elfo",
    classId: "arcanista",
    path: "Mago",
    originId: "estudioso",
    deityId: "wynna",
    deityName: "Wynna",
    level: 3,
    xp: 3450,
    campaign: "Os Ossos de Arton",
    // comprados: FOR −1 · DES +1 · CON 0 · INT +2 · SAB +1 · CAR 0 → com bônus élficos (INT+2, DES+1, CON−1)
    attributes: { for: -1, des: 2, con: -1, int: 4, sab: 1, car: 0 },
    trainedSkills: ["con", "ofi", "per", "inv"],
    powers: powers(["Foco em Perícia", "Familiar", "Fluxo de Mana"]),
    spells: spells(["Seta Infalível de Talude", "Armadura Arcana", "Sono", "Curar Ferimentos", "Imagem Espelhada"]),
    equipment: items([
      ["Adaga", 1, true],
      ["Armadura acolchoada", 1, true],
      ["Bordão", 1],
      ["Mochila", 1],
      ["Tocha", 2],
      ["Ração de viagem", 3],
      ["Corda", 1],
    ]),
    attacks: attacks(["Adaga", "Bordão"]),
    money: 143,
    languages: "Comum, Élfico, Valkar, Abissal",
    appearance: "Alto e esguio, cabelos prateados presos, olhos violeta.",
    personality: "Curioso ao ponto da imprudência; anota tudo o que vê.",
    history: "Aprendiz fugido da Academia Arcana de Wynlla, busca o grimório roubado do seu mestre.",
    notes: "Deve 3 favores a Nimb. Não perguntar sobre o incêndio na torre.",
  }),
  id: "vharo-lumen",
};
vharo.hp.current = Math.max(1, vharo.hp.max - 4);

const brakka: CharacterSheet = {
  ...buildSheet({
    name: "Brakka Punho de Ferro",
    raceId: "anao",
    classId: "guerreiro",
    originId: "capanga",
    deityId: "khalmyr",
    deityName: "Khalmyr",
    level: 4,
    xp: 6800,
    campaign: "Os Ossos de Arton",
    // comprados: FOR +3 · DES 0 · CON +1 · INT 0 · SAB 0 · CAR −1 → com bônus anões (CON+2, SAB+1, DES−1)
    attributes: { for: 3, des: -1, con: 3, int: 0, sab: 1, car: -1 },
    trainedSkills: ["gue", "ofi", "intm", "atl", "per"],
    powers: powers(["Ataque Poderoso", "Encouraçado", "Especialização em Arma", "Espada Justiceira"]),
    equipment: items([
      ["Machado de batalha", 1, true],
      ["Brunea", 1, true],
      ["Escudo pesado", 1, true],
      ["Besta leve", 1],
      ["Virotes", 1],
      ["Mochila", 1],
      ["Ração de viagem", 6],
      ["Saco de dormir", 1],
    ]),
    attacks: attacks(["Machado de batalha", "Besta leve"]),
    money: 87,
    languages: "Comum, Anão",
    appearance: "Barba ruiva trançada com anéis de ferro, cicatriz sobre o olho esquerdo.",
    personality: "Direto, leal e completamente incapaz de ignorar uma injustiça.",
    history: "Ex-capanga de um mercador corrupto em Valkaria; mudou de lado após um julgamento de Khalmyr.",
    notes: "Jurou destruir a Forja Maldita de Doherimm.",
  }),
  id: "brakka-punho-de-ferro",
};
brakka.hp.current = Math.max(1, brakka.hp.max - 6);

const sirih: CharacterSheet = {
  ...buildSheet({
    name: "Sirih Lâmina-Doce",
    raceId: "hynne",
    classId: "ladino",
    originId: "criminoso",
    deityId: "hyninn",
    deityName: "Hyninn",
    level: 2,
    xp: 1320,
    campaign: "Crônicas do Reinado",
    // comprados: FOR −1 · DES +2 · CON +1 · INT +1 · SAB 0 · CAR +1 → com bônus hynne (DES+2, CAR+1, FOR−1)
    attributes: { for: -2, des: 4, con: 1, int: 1, sab: 0, car: 2 },
    trainedSkills: ["fur", "acr", "eng", "jog", "per", "ini", "pon"],
    powers: powers(["Esquiva", "Mãos Rápidas", "Sombra"]),
    equipment: items([
      ["Adaga", 2, true],
      ["Couro batido", 1, true],
      ["Besta de mão", 1],
      ["Gazua", 1],
      ["Corda", 1],
      ["Mochila", 1],
    ]),
    attacks: attacks(["Adaga", "Besta de mão"]),
    money: 212,
    languages: "Comum, Hynne",
    appearance: "Pequena, cabelos castanhos cacheados, sorriso que antecede problemas.",
    personality: "Encantadora, imprevisível e alérgica a autoridade.",
    history: "Cresceu nos becos de Valkaria roubando de quem já roubava alguém.",
    notes: "Procurada em duas cidades. Tecnicamente, três.",
  }),
  id: "sirih-lamina-doce",
};

// garante ids estáveis nos ataques desarmados
for (const c of [vharo, brakka, sirih]) {
  if (!c.attacks.length) {
    c.attacks.push({
      id: uid("atk"),
      name: "Desarmado",
      skill: "Luta",
      damage: "1d3",
      damageAttr: "for",
      critical: "x2",
      damageType: "Impacto",
    });
  }
}

export const INITIAL_CHARACTERS: CharacterSheet[] = [vharo, brakka, sirih];
