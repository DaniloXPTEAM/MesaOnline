import type { Ability, CharacterSheet, AttackItem, EquipmentItem, JournalEntry, PowerEntry, SpellItem } from "../../ficha-modernrpg/sheet";
import { upsertCharacterSheet } from "../../ficha-modernrpg/characterRoute";
import { emptySkills, makeAttributes, uid } from "../../ficha-modernrpg/t20/sheetRules";
import type { BattleMap, BoardState, ThreatTemplate } from "./types";
import { threatToTemplate, type CanonicalThreat } from "../tactics/data/bestiaryAdapter";
import { addCustomThreat } from "../tactics/engine/customThreats";

export type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject => value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (source: JsonObject, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = key.split(".").reduce<unknown>((current, part) => object(current)[part], source);
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return fallback;
};
const number = (source: JsonObject, keys: string[], fallback = 0) => {
  const parsed = Number(text(source, keys, String(fallback)));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function importMap(data: unknown, imageFallback = ""): BattleMap {
  const source = object(data);
  const id = text(source, ["id"], uid("map"));
  return {
    id,
    name: text(source, ["name", "nome", "title"], "Mapa importado"),
    location: text(source, ["location", "local", "description"], "Cena importada"),
    image: text(source, ["image", "imagem", "mapDataUrl", "url"], imageFallback),
    isoImage: text(source, ["isoImage", "imagemIso"], "") || undefined,
    cols: Math.max(4, number(source, ["cols", "columns", "gridCols"], 20)),
    rows: Math.max(4, number(source, ["rows", "lines", "gridRows"], 20)),
    terrain: object(source.terrain) as BattleMap["terrain"],
    custom: true,
  };
}

export function importScenePackage(data: unknown): Partial<BoardState> & { map: BattleMap } {
  const source = object(data);
  const board = object(source.BOARD || source.board || source.scene);
  return {
    map: importMap(board.map || source.map, text(source, ["image"], "")),
    tokens: list(board.tokens || source.tokens) as BoardState["tokens"],
    walls: list(board.walls || source.walls) as BoardState["walls"],
    lights: list(board.lights || source.lights) as BoardState["lights"],
    shapes: list(board.shapes || source.shapes) as BoardState["shapes"],
    objects: list(board.objects || source.objects) as BoardState["objects"],
    fog: list(board.fog || source.fog).map(String),
    explored: list(board.explored || source.explored).map(String),
  };
}

export function importThreat(data: unknown): ThreatTemplate {
  const source = object(data);
  const canonical: CanonicalThreat = {
    id: text(source, ["id"], uid("threat")),
    nome: text(source, ["nome", "name"], "Ameaça importada"),
    tipo: text(source, ["tipo", "type"], "Ameaça personalizada"),
    nd: text(source, ["nd", "challenge"], "—"),
    iniciativa: text(source, ["iniciativa", "initiative"], "+0"),
    defesa: number(source, ["defesa", "defense"], 10),
    fort: text(source, ["fort", "fortitude"], "+0"),
    ref: text(source, ["ref", "reflexes"], "+0"),
    von: text(source, ["von", "vontade", "will"], "+0"),
    pv: number(source, ["pv", "hp"], 1),
    pm: number(source, ["pm", "mp"], 0),
    deslocamento: text(source, ["deslocamento", "speed"], "9m"),
    ataques: list(source.ataques || source.attacks) as CanonicalThreat["ataques"],
    habilidades: list(source.habilidades || source.abilities) as CanonicalThreat["habilidades"],
    tesouro: text(source, ["tesouro", "loot"], ""),
    imagem: text(source, ["imagem", "image", "portrait"], "") || undefined,
    custom: true,
  };
  const template = { ...threatToTemplate(canonical), custom: true };
  return addCustomThreat(template);
}

/**
 * Qualquer importação de personagem termina em CharacterSheet e é gravada
 * diretamente em tormenta20_online_characters_v2 via characterRoute.
 */
/** Habilidades raciais/de classe da Oficina. Antes eram descartadas. */
function abilities(value: unknown): Ability[] {
  return list(value).map((entry, index): Ability => {
    const item = object(entry);
    return {
      id: text(item, ["id"], uid("ability")),
      name: text(item, ["name", "nome"], `Habilidade ${index + 1}`),
      description: text(item, ["description", "descricao", "desc"], ""),
      level: Number(text(item, ["level", "nivel"], "")) || undefined,
      source: text(item, ["source", "origem"], "") || undefined,
    };
  });
}

/** Campo opcional de texto: so entra no objeto se existir de verdade. */
function optionalText(source: JsonObject, keys: string[]): string | undefined {
  const value = text(source, keys, "");
  return value || undefined;
}

export function importCharacterSheet(data: unknown, portrait?: string): CharacterSheet {
  const source = object(data);
  const level = Math.max(1, number(source, ["level", "nivel", "nível"], 1));
  const hpMax = number(source, ["hp.max", "pv.max", "hpMax", "pvMax", "hp", "pv"], 10);
  const mpMax = number(source, ["mp.max", "pm.max", "mpMax", "pmMax", "mp", "pm"], 0);
  const attacks = list(source.attacks || source.ataques).map((entry, index): AttackItem => {
    const item = object(entry);
    return {
      id: text(item, ["id"], uid("atk")),
      name: text(item, ["name", "nome"], `Ataque ${index + 1}`),
      skill: /pont|dist/i.test(text(item, ["skill", "pericia", "tipo"], "Luta")) ? "Pontaria" : "Luta",
      damage: text(item, ["damage", "dano", "formula"], "1d4"),
      critical: text(item, ["critical", "critico", "crit"], "20/x2"),
      range: text(item, ["range", "alcance"], "") || undefined,
      damageType: text(item, ["damageType", "tipoDano"], "Físico"),
      properties: text(item, ["properties", "descricao", "description"], "") || undefined,
      bonus: number(item, ["bonus", "attackBonus"], 0),
      damageBonus: number(item, ["damageBonus", "bonusDano"], 0),
    };
  });
  const powers = list(source.powers || source.poderes).map((entry, index): PowerEntry => {
    const item = object(entry);
    return {
      id: text(item, ["id"], uid("power")), name: text(item, ["name", "nome"], `Poder ${index + 1}`),
      type: text(item, ["type", "tipo", "category"], "Poder"), description: text(item, ["description", "descricao"], ""),
      requirement: text(item, ["requirement", "requisito"], "") || undefined,
      cost: number(item, ["cost", "custo", "pmCost"], 0),
    };
  });
  const spells = list(source.spells || source.magias).map((entry, index): SpellItem => {
    const item = object(entry);
    return {
      id: text(item, ["id"], uid("spell")), name: text(item, ["name", "nome"], `Magia ${index + 1}`),
      circle: number(item, ["circle", "circulo"], 1), cost: number(item, ["cost", "custo", "pmCost"], 1),
      school: text(item, ["school", "escola"], "") || undefined, type: text(item, ["type", "tipo"], "") || undefined,
      execution: text(item, ["execution", "execucao"], "") || undefined, range: text(item, ["range", "alcance"], "") || undefined,
      duration: text(item, ["duration", "duracao"], "") || undefined, resistance: text(item, ["resistance", "resistencia", "save"], "") || undefined,
      effect: text(item, ["effect", "efeito", "damage", "dano"], "") || undefined,
      description: text(item, ["description", "descricao"], "") || undefined,
    };
  });
  const equipment = list(source.equipment || source.itens || source.inventory).map((entry): EquipmentItem => {
    const item = object(entry);
    return {
      id: text(item, ["id"], uid("item")), equipped: Boolean(item.equipped ?? item.equipado),
      name: text(item, ["name", "nome"], "Item"), quantity: number(item, ["quantity", "quantidade"], 1),
      slots: number(item, ["slots", "espacos"], 1), price: number(item, ["price", "preco"], 0) || null,
      description: text(item, ["description", "descricao"], ""), category: text(item, ["category", "categoria"], "Item Geral") as EquipmentItem["category"],
      defenseBonus: number(item, ["defenseBonus", "bonusDefesa"], 0) || undefined,
    };
  });
  const attributes = object(source.attributes || source.atributos);
  const sheet: CharacterSheet = {
    id: text(source, ["id"], uid("char")),
    name: text(source, ["name", "nome", "character.name"], "Herói importado"),
    avatar: portrait || text(source, ["avatar", "portrait", "retrato", "image"], "") || undefined,
    race: text(source, ["race", "raca", "raça"], "Humano"),
    class: text(source, ["class", "className", "classe"], "Aventureiro"),
    level,
    campaign: text(source, ["campaign", "campanha"], "Campanha livre"),
    attributes: makeAttributes({
      for: number(object(attributes.for), ["value", "valor"], Number(attributes.for) || 0),
      des: number(object(attributes.des), ["value", "valor"], Number(attributes.des) || 0),
      con: number(object(attributes.con), ["value", "valor"], Number(attributes.con) || 0),
      int: number(object(attributes.int), ["value", "valor"], Number(attributes.int) || 0),
      sab: number(object(attributes.sab), ["value", "valor"], Number(attributes.sab) || 0),
      car: number(object(attributes.car), ["value", "valor"], Number(attributes.car) || 0),
    }),
    hp: { current: number(source, ["hp.current", "pv.current", "hpCurrent", "pvAtual"], hpMax), max: hpMax, temp: Number(text(source, ["hp.temp", "pv.temp"], "")) || undefined },
    mp: { current: number(source, ["mp.current", "pm.current", "mpCurrent", "pmAtual"], mpMax), max: mpMax },
    defenseOther: number(source, ["defenseOther", "defesaOutros"], 0),
    speed: number(source, ["speed", "movementM", "deslocamento"], 9),
    skills: object(source.skills || source.pericias) as CharacterSheet["skills"] || emptySkills(),
    attacks, powers, spells,
    racialAbilities: abilities(source.racialAbilities || source.habilidadesRaciais),
    classAbilities: abilities(source.classAbilities || source.habilidadesDeClasse),
    money: number(source, ["money", "dinheiro"], 0), equipment,
    conditions: list(source.conditions || source.condicoes).map(String),
    languages: text(source, ["languages", "idiomas"], "Comum"), xp: number(source, ["xp", "experiencia"], 0),
    notes: text(source, ["notes", "notas"], ""),
    // --- campos da Oficina que antes eram silenciosamente descartados ---
    avatarPos: optionalText(source, ["avatarPos"]),
    raceId: optionalText(source, ["raceId"]),
    raceVariantId: optionalText(source, ["raceVariantId"]),
    classId: optionalText(source, ["classId"]),
    path: optionalText(source, ["path", "caminho"]),
    origin: optionalText(source, ["origin", "origem"]),
    originId: optionalText(source, ["originId"]),
    deity: optionalText(source, ["deity", "divindade"]),
    deityId: optionalText(source, ["deityId"]),
    campaignUrl: optionalText(source, ["campaignUrl"]),
    appearance: optionalText(source, ["appearance", "aparencia"]),
    personality: optionalText(source, ["personality", "personalidade"]),
    history: optionalText(source, ["history", "historia"]),
    // deslocamentos alternativos: o motor ja os consome (characterActionAdapter)
    flySpeed: Number(text(source, ["flySpeed", "deslocamentoVoo"], "")) || undefined,
    burrowSpeed: Number(text(source, ["burrowSpeed", "deslocamentoEscavacao"], "")) || undefined,
    defenseOtherTemp: Number(text(source, ["defenseOtherTemp"], "")) || undefined,
    journal: list(source.journal).length ? (list(source.journal) as JournalEntry[]) : undefined,
    builder: object(source.builder) && Object.keys(object(source.builder)).length ? (source.builder as CharacterSheet["builder"]) : undefined,
    createdAt: text(source, ["createdAt"], new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
  upsertCharacterSheet(sheet);
  return sheet;
}

export const CHARACTER_JSON_EXAMPLE = {
  name: "Áurea de Valkaria", race: "Humana", class: "Guerreira", level: 7,
  hp: { current: 62, max: 62 }, mp: { current: 21, max: 21 }, speed: 9,
  attacks: [{ name: "Espada longa", skill: "Luta", damage: "1d8+7", critical: "19/x2" }],
};
