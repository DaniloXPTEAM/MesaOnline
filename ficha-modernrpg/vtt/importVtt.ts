/**
 * importVtt — leitura de exportações de outros VTTs (Foundry/Roll20) e de
 * fichas deste site, convertendo para o CharacterSheet oficial.
 *
 * Port mínimo oficial: reconhece os formatos declarados no modal de importação
 * e converte o que é determinístico (nome, raça, classe, nível, atributos,
 * PV/PM). Campos não mapeáveis viram avisos — nada é inventado.
 */
import type { AttrKey, CharacterSheet } from "../sheet";
import { makeAttributes, emptySkills, uid } from "../t20/sheetRules";

export interface VttCampaign {
  name: string;
  actors: CharacterSheet[];
  npcs: { name: string; threat?: string }[];
  scenes: string[];
  journals: { name: string }[];
}

export interface VttImportResult {
  kind: string;
  characters: CharacterSheet[];
  campaign?: VttCampaign;
  warnings: string[];
}

const ATTR_BY_HINT: [RegExp, AttrKey][] = [
  [/^for(str|ça|ca)?$/i, "for"], [/^des(treza)?$/i, "des"], [/^con(stitui(ç|c)(ã|a)o?)?$/i, "con"],
  [/^int(elig(ê|e)ncia)?$/i, "int"], [/^sab(edoria)?$/i, "sab"], [/^car(isma)?$/i, "car"],
];

const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function attrValue(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return num(raw.replace(/[+]/g, "")) ?? 0;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return num(o.valor ?? o.value ?? o.mod ?? o.total) ?? 0;
  }
  return 0;
}

function readAttrs(source: Record<string, unknown>): Partial<Record<AttrKey, number>> {
  const out: Partial<Record<AttrKey, number>> = {};
  for (const [k, v] of Object.entries(source)) {
    const hit = ATTR_BY_HINT.find(([re]) => re.test(k));
    if (hit) out[hit[1]] = attrValue(v);
  }
  return out;
}

/** Constrói um CharacterSheet esqueleto válido a partir de campos soltos. */
function skeleton(p: { name: string; race?: string; klass?: string; level?: number; attrs?: Partial<Record<AttrKey, number>>; hp?: number; hpMax?: number; pm?: number; pmMax?: number; id?: string }): CharacterSheet {
  const level = Math.max(1, Math.min(20, p.level ?? 1));
  const hpMax = p.hpMax ?? p.hp ?? 10;
  return {
    id: p.id || uid("char"),
    name: p.name,
    race: p.race ?? "—",
    class: p.klass ?? "—",
    level,
    campaign: "",
    attributes: makeAttributes(p.attrs ?? {}),
    hp: { current: Math.min(p.hp ?? hpMax, hpMax), max: hpMax },
    mp: { current: p.pm ?? p.pmMax ?? 0, max: p.pmMax ?? p.pm ?? 0 },
    defenseOther: 0,
    speed: 9,
    skills: emptySkills(),
    attacks: [],
    racialAbilities: [],
    classAbilities: [],
    powers: [],
    spells: [],
    money: 0,
    equipment: [],
    languages: "",
    xp: 0,
    notes: "Importado de outro VTT (conversão mínima — revise a ficha).",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function isSiteSheet(x: unknown): x is CharacterSheet {
  const c = x as CharacterSheet | null;
  return !!c && typeof c === "object" && typeof c.name === "string" && !!c.attributes && typeof c.attributes === "object";
}

function fromFoundryActor(a: Record<string, unknown>, warnings: string[]): CharacterSheet | null {
  const name = str(a.name);
  if (!name) return null;
  const sys = (a.system && typeof a.system === "object" ? a.system : {}) as Record<string, unknown>;
  const attrs = readAttrs((sys.atributos ?? sys.attributes ?? sys.attrs ?? {}) as Record<string, unknown>);
  const hp = (sys.pv ?? sys.hp ?? {}) as Record<string, unknown>;
  const pm = (sys.pm ?? sys.mp ?? {}) as Record<string, unknown>;
  warnings.push(`Foundry "${name}": conversão mínima (itens/poderes não são convertidos automaticamente).`);
  return skeleton({
    name,
    race: str((sys.raca as Record<string, unknown> | undefined)?.nome ?? sys.raca ?? sys.race),
    klass: str((sys.classe as Record<string, unknown> | undefined)?.nome ?? sys.classe ?? sys.class),
    level: num(sys.nivel ?? sys.level),
    attrs,
    hp: num(hp.valor ?? hp.value), hpMax: num(hp.max ?? hp.maximo),
    pm: num(pm.valor ?? pm.value), pmMax: num(pm.max ?? pm.maximo),
    id: str(a._id) ? `foundry-${String(a._id)}` : undefined,
  });
}

function fromRoll20(r: Record<string, unknown>, warnings: string[]): CharacterSheet | null {
  const attribs = Array.isArray(r.attribs) ? (r.attribs as { name?: string; current?: unknown; max?: unknown }[]) : null;
  if (!attribs) return null;
  const get = (n: string) => attribs.find((a) => a?.name === n);
  const name = str(get("charName")?.current ?? r.name);
  if (!name) return null;
  const attrs: Partial<Record<AttrKey, number>> = {};
  for (const k of ["FOR", "DES", "CON", "INT", "SAB", "CAR"] as const) {
    const v = num(get(k)?.current);
    if (v !== undefined) attrs[k.toLowerCase() as AttrKey] = v;
  }
  warnings.push(`Roll20 "${name}": conversão mínima (atributos e PV/PM).`);
  return skeleton({
    name,
    race: str(get("charRace")?.current),
    klass: str(get("charClass")?.current),
    level: num(get("charLevel")?.current),
    attrs,
    hp: num(get("pvC")?.current), hpMax: num(get("pvM")?.max ?? get("pvM")?.current),
    pm: num(get("pmC")?.current), pmMax: num(get("pmM")?.max ?? get("pmM")?.current),
  });
}

function convertOne(doc: unknown, warnings: string[]): CharacterSheet | null {
  if (!doc || typeof doc !== "object") return null;
  if (isSiteSheet(doc)) return doc;
  const d = doc as Record<string, unknown>;
  if (Array.isArray(d.attribs)) return fromRoll20(d, warnings);
  if ("system" in d || d.type === "character" || d.type === "npc") return fromFoundryActor(d, warnings);
  return null;
}

/**
 * Analisa o JSON (ou conteúdo .db NeDB) exportado de outro VTT.
 * Lança Error com mensagem amigável quando o formato não é reconhecido.
 */
export function importVttJson(raw: string, name = "importado"): VttImportResult {
  const warnings: string[] = [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // .db NeDB: um documento JSON por linha
  if (lines.length > 1 && lines.every((l) => l.startsWith("{"))) {
    const docs: unknown[] = [];
    for (const l of lines) {
      try { docs.push(JSON.parse(l)); } catch { warnings.push("Linha .db ignorada (JSON inválido)."); }
    }
    return collect(docs, "VTT (.db NeDB)", warnings);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("o arquivo não é um JSON válido.");
  }

  const docs: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).actors)
      ? ((parsed as Record<string, unknown>).actors as unknown[])
      : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).characters)
        ? ((parsed as Record<string, unknown>).characters as unknown[])
        : [parsed];

  const foundryWorld = parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray((parsed as Record<string, unknown>).actors);
  return collect(docs, foundryWorld ? "Foundry (mundo/aventura)" : "VTT (JSON)", warnings);

  function collect(docs: unknown[], kind: string, warnings: string[]): VttImportResult {
    const characters: CharacterSheet[] = [];
    const npcs: { name: string }[] = [];
    for (const d of docs) {
      const c = convertOne(d, warnings);
      if (!c) continue;
      const tipo = d && typeof d === "object" ? (d as Record<string, unknown>).type : undefined;
      if (tipo === "npc" || c.race === "—" && c.class === "—") npcs.push({ name: c.name });
      else characters.push(c);
    }
    if (!characters.length && !npcs.length) {
      throw new Error("não encontrei personagens reconhecíveis nesse arquivo (esperado ficha do site, ator Foundry ou personagem Roll20).");
    }
    const campaign: VttCampaign = {
      name: name.replace(/\.(json|db)$/i, ""),
      actors: characters,
      npcs,
      scenes: [],
      journals: [],
    };
    return { kind, characters, campaign, warnings };
  }
}
