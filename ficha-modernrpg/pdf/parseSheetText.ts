/**
 * Heurísticas puras de leitura de ficha (sem dependência de pdf.js) —
 * recebem texto/campos de formulário e devolvem um rascunho de ficha.
 */
import type { AttrKey } from "../t20/compendium";
import { ATTR_KEYS, T20_SKILLS } from "../t20/compendium";

export interface PdfDraft {
  name?: string;
  player?: string;
  race?: string;
  raceId?: string;
  class?: string;
  classId?: string;
  origin?: string;
  deity?: string;
  level?: number;
  xp?: number;
  attributes: Partial<Record<AttrKey, number>>;
  hp?: { current?: number; max?: number };
  mp?: { current?: number; max?: number };
  defense?: number;
  speed?: number;
  /** total anotado na ficha para cada perícia (id → valor) */
  skills: Record<string, number>;
  /** perícias marcadas como treinadas */
  trainedSkills: string[];
  money?: number;
  languages?: string;
  notes?: string;
  rawText: string;
  formFields: Record<string, string>;
  warnings: string[];
}

/* --------------------------------- utilidades -------------------------------- */

const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/** normaliza para comparação (minúsculas, sem acento, só letras/dígitos/+-./) */
const norm = (s: string) => strip(s).toLowerCase().replace(/[^a-z0-9+\-./ ]/g, " ").replace(/\s+/g, " ").trim();

const num = (s: string | undefined | null): number | undefined => {
  if (s === undefined || s === null) return undefined;
  const m = String(s).replace(/\.(?=\d{3}\b)/g, "").replace(",", ".").match(/[+-]?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

/** transforma um rótulo em regex tolerante a acentos e maiúsculas */
const rx = (label: string) =>
  strip(label)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/a/g, "[aáàâã]")
    .replace(/e/g, "[eéê]")
    .replace(/i/g, "[ií]")
    .replace(/o/g, "[oóôõ]")
    .replace(/u/g, "[uú]")
    .replace(/c/g, "[cç]")
    .replace(/\s+/g, "\\s+");

const LABELS = ["nome do personagem", "nome", "jogador", "raça", "classe", "nível", "origem", "divindade", "deus", "campanha", "idiomas", "tamanho", "deslocamento", "tendência", "pv", "pm", "defesa", "xp", "pe", "experiência", "tibares"];
const NEXT_LABEL = `(?=\\s{2,}|\\s*[|•·]|\\s+(?:${LABELS.map(rx).join("|")})\\s*[:\\-–]|$)`;

/* --------------------------------- aliases ----------------------------------- */

const FIELD_ALIASES: Record<string, string[]> = {
  name: ["nome", "nome do personagem", "personagem", "character", "name"],
  player: ["jogador", "player"],
  race: ["raca", "race"],
  class: ["classe", "classe e nivel", "class"],
  origin: ["origem", "origin"],
  deity: ["divindade", "deus", "deity"],
  level: ["nivel", "nvl", "level", "nd"],
  xp: ["xp", "pe", "experiencia", "pontos de experiencia"],
  hpMax: ["pv max", "pv maximo", "pv total", "pontos de vida max", "vida max", "hp max", "pvmax", "pv_max"],
  hpCur: ["pv atual", "pv", "pontos de vida", "vida", "hp", "pv_atual"],
  mpMax: ["pm max", "pm maximo", "pm total", "pontos de mana max", "mana max", "pmmax", "pm_max"],
  mpCur: ["pm atual", "pm", "pontos de mana", "mana", "pm_atual"],
  defense: ["defesa", "def", "ca"],
  speed: ["deslocamento", "desloc", "movimento"],
  money: ["tibares", "t$", "dinheiro", "ouro"],
  languages: ["idiomas", "linguas"],
};

const ATTR_ALIASES: Record<AttrKey, string[]> = {
  for: ["for", "forca"],
  des: ["des", "destreza"],
  con: ["con", "constituicao"],
  int: ["int", "inteligencia"],
  sab: ["sab", "sabedoria"],
  car: ["car", "carisma"],
};
const ATTR_NAMES_RX = "(?:for[çc]a|destreza|constitui[çc][ãa]o|intelig[êe]ncia|sabedoria|carisma|for|des|con|int|sab|car)";

function matchAlias(key: string, aliases: string[]): boolean {
  const k = norm(key).replace(/[_\-.]/g, " ").trim();
  return aliases.some((a) => k === a || k.endsWith(" " + a) || k.startsWith(a + " ") || k.replace(/\s/g, "") === a.replace(/\s/g, ""));
}

/* ---------------------------- campos de formulário --------------------------- */

export function parseFormFields(fields: Record<string, string>, draft: PdfDraft) {
  for (const [rawKey, rawVal] of Object.entries(fields)) {
    const key = norm(rawKey).replace(/[_\-.]/g, " ").trim();
    const val = rawVal.trim();
    if (!val) continue;

    let handled = false;
    for (const a of ATTR_KEYS) {
      if (matchAlias(key, ATTR_ALIASES[a]) && num(val) !== undefined && draft.attributes[a] === undefined) {
        draft.attributes[a] = num(val);
        handled = true;
      }
    }
    if (handled) continue;

    for (const sk of T20_SKILLS) {
      const skn = norm(sk.nome);
      if (key === skn || key.startsWith(skn + " ") || key.endsWith(" " + skn)) {
        const isTrainFlag = /trein|^t /.test(key) || val === "on";
        if (isTrainFlag) {
          if (val === "on" || /^(1|true|sim|x)$/i.test(val)) draft.trainedSkills.push(sk.id);
        } else if (num(val) !== undefined) draft.skills[sk.id] = num(val)!;
        handled = true;
      }
    }
    if (handled) continue;

    if (matchAlias(key, FIELD_ALIASES.name) && !draft.name) draft.name = val;
    else if (matchAlias(key, FIELD_ALIASES.player) && !draft.player) draft.player = val;
    else if (matchAlias(key, FIELD_ALIASES.race) && !draft.race) draft.race = val;
    else if (matchAlias(key, FIELD_ALIASES.class) && !draft.class) draft.class = val;
    else if (matchAlias(key, FIELD_ALIASES.origin) && !draft.origin) draft.origin = val;
    else if (matchAlias(key, FIELD_ALIASES.deity) && !draft.deity) draft.deity = val;
    else if (matchAlias(key, FIELD_ALIASES.level) && draft.level === undefined) draft.level = num(val);
    else if (matchAlias(key, FIELD_ALIASES.xp) && draft.xp === undefined) draft.xp = num(val);
    else if (matchAlias(key, FIELD_ALIASES.hpMax)) draft.hp = { ...draft.hp, max: num(val) };
    else if (matchAlias(key, FIELD_ALIASES.hpCur)) draft.hp = { ...draft.hp, current: num(val) };
    else if (matchAlias(key, FIELD_ALIASES.mpMax)) draft.mp = { ...draft.mp, max: num(val) };
    else if (matchAlias(key, FIELD_ALIASES.mpCur)) draft.mp = { ...draft.mp, current: num(val) };
    else if (matchAlias(key, FIELD_ALIASES.defense) && draft.defense === undefined) draft.defense = num(val);
    else if (matchAlias(key, FIELD_ALIASES.speed) && draft.speed === undefined) draft.speed = num(val);
    else if (matchAlias(key, FIELD_ALIASES.money) && draft.money === undefined) draft.money = num(val);
    else if (matchAlias(key, FIELD_ALIASES.languages) && !draft.languages) draft.languages = val;
  }
  draft.trainedSkills = [...new Set(draft.trainedSkills)];
}

/* -------------------------------- texto livre -------------------------------- */

export function parseText(text: string, draft: PdfDraft) {
  const lines = text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const flat = " " + norm(lines.join(" ")) + " ";

  /** valor textual após "Rótulo:" na linha original (mantém acentos/caixa) */
  const grabText = (labels: string[]) => {
    for (const label of labels) {
      const re = new RegExp(`(?:^|\\s)${rx(label)}\\s*[:\\-–]\\s*(.+?)${NEXT_LABEL}`, "i");
      for (const line of lines) {
        const m = line.match(re);
        if (m && m[1].trim().length > 0 && m[1].trim().length < 60) return m[1].trim().replace(/[|•·]+$/, "").trim();
      }
    }
    return undefined;
  };
  /** número após um rótulo no texto normalizado */
  const grabNum = (labels: string[], pattern = "([+-]?\\d+(?:[.,]\\d+)?)") => {
    for (const l of labels) {
      const m = flat.match(new RegExp(`(?:^|\\s)${l}\\s*[:=]?\\s*${pattern}`, "i"));
      if (m) return m[1];
    }
    return undefined;
  };

  // atributos: "FOR +2", "Força 2", "FOR: -1" (valores 8..30 = ficha clássica → converte)
  for (const a of ATTR_KEYS) {
    if (draft.attributes[a] !== undefined) continue;
    const v = grabNum(ATTR_ALIASES[a], "([+-]?\\d{1,2})(?!\\d|[.,]\\d)");
    if (v !== undefined) {
      const n = num(v)!;
      draft.attributes[a] = n >= 8 && n <= 30 && !/[+-]/.test(v) ? Math.floor((n - 10) / 2) : n;
    }
  }

  if (!draft.name) draft.name = grabText(["nome do personagem", "nome"]);
  if (!draft.player) draft.player = grabText(["jogador"]);
  if (!draft.race) draft.race = grabText(["raça"]);
  if (!draft.class) draft.class = grabText(["classe"]);
  if (!draft.origin) draft.origin = grabText(["origem"]);
  if (!draft.deity) draft.deity = grabText(["divindade", "deus"]);
  if (!draft.languages) draft.languages = grabText(["idiomas"]);
  if (draft.level === undefined) draft.level = num(grabNum(["nivel", "nvl", "level"], "(\\d{1,2})(?!\\d)"));
  if (draft.xp === undefined) draft.xp = num(grabNum(["xp", "experiencia", "pe"], "(\\d[\\d.]*)"));

  if (!draft.hp?.max) {
    const pv = flat.match(/\b(?:pv|pontos de vida)\s*[:=\-]?\s*(\d+)\s*(?:\/|de)\s*(\d+)/);
    if (pv) draft.hp = { current: Number(pv[1]), max: Number(pv[2]) };
    else {
      const max = num(grabNum(["pv max", "pv maximo", "pv total", "pontos de vida", "pv"], "(\\d+)"));
      if (max) draft.hp = { current: max, max };
    }
  }
  if (!draft.mp?.max) {
    const pm = flat.match(/\b(?:pm|pontos de mana)\s*[:=\-]?\s*(\d+)\s*(?:\/|de)\s*(\d+)/);
    if (pm) draft.mp = { current: Number(pm[1]), max: Number(pm[2]) };
    else {
      const max = num(grabNum(["pm max", "pm maximo", "pm total", "pontos de mana", "pm"], "(\\d+)"));
      if (max) draft.mp = { current: max, max };
    }
  }
  if (draft.defense === undefined) draft.defense = num(grabNum(["defesa", "def"], "(\\d{1,2})(?!\\d)"));
  if (draft.speed === undefined) draft.speed = num(grabNum(["deslocamento", "desloc"], "(\\d{1,2})(?!\\d)"));
  if (draft.money === undefined) draft.money = num(grabNum(["tibares", "t\\$", "dinheiro"], "(\\d[\\d.]*)"));

  // perícias: "Acrobacia +5", "Acrobacia (Des) +5", "Acrobacia: 5", "[x] Acrobacia +5"
  for (const sk of T20_SKILLS) {
    const label = norm(sk.nome);
    const re = new RegExp(`(?:^|\\s)(x\\s+|\\*\\s*)?${label}\\b(?:\\s*\\(?\\s*${ATTR_NAMES_RX}\\s*\\)?)?\\s*[:=]?\\s*([+-]?\\d{1,2})(?!\\d)`, "i");
    const m = flat.match(re);
    if (m) {
      if (draft.skills[sk.id] === undefined) draft.skills[sk.id] = Number(m[2]);
      if (m[1] && !draft.trainedSkills.includes(sk.id)) draft.trainedSkills.push(sk.id);
    }
  }
  draft.trainedSkills = [...new Set(draft.trainedSkills)];
}
