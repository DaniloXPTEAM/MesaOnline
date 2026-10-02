/**
 * Importador de dados de VTT (Foundry VTT — sistema tormenta20, Roll20 e
 * exportações genéricas) → ficha / campanha do Tormenta 20 Online.
 */
import type { CharacterSheet } from "../../types/sheet";
import { ATTR_KEYS, findClassByName, findItemByName, findRaceByName, findSpellByName, T20_SKILLS, type AttrKey } from "../t20/compendium";
import { heroJsonToSheet, isHeroJson } from "../pdf/heroJson";
import { buildSheet, itemToAttack, itemToEquipment, recalc, spellToItem, uid } from "../t20/sheetRules";

export interface VttCampaign {
  id: string;
  name: string;
  system?: string;
  source: "foundry" | "roll20" | "json";
  scenes: string[];
  journals: { name: string; text: string }[];
  actors: CharacterSheet[];
  npcs: { name: string; type?: string; nd?: string; hp?: number; defense?: number; notes?: string }[];
  importedAt: string;
}

type Any = Record<string, unknown>;
const g = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Any)[k] : undefined), o);
const n = (v: unknown, d = 0) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : d);
const str = (v: unknown) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v));
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const SKILL_ALIASES: Record<string, string> = {
  acro: "acr", acrobacia: "acr", ades: "ade", adestramento: "ade", atle: "atl", atletismo: "atl", atua: "atu", atuacao: "atu", cava: "cav", cavalgar: "cav",
  conh: "con", conhecimento: "con", cura: "cur", dipl: "dip", diplomacia: "dip", enga: "eng", enganacao: "eng", fort: "for", fortitude: "for",
  furt: "fur", furtividade: "fur", guer: "gue", guerra: "gue", inic: "ini", iniciativa: "ini", inti: "int", intimidacao: "int", intu: "intu", intuicao: "intu",
  inve: "inv", investigacao: "inv", joga: "jog", jogatina: "jog", ladi: "lad", ladinagem: "lad", luta: "lut", mist: "mis", misticismo: "mis",
  nobr: "nob", nobreza: "nob", ofic: "ofi", oficio: "ofi", perc: "per", percepcao: "per", pilo: "pil", pilotagem: "pil", pont: "pon", pontaria: "pon",
  refl: "ref", reflexos: "ref", reli: "rel", religiao: "rel", sobr: "sob", sobrevivencia: "sob", vont: "von", vontade: "von",
};
const skillId = (key: string) => {
  const k = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return SKILL_ALIASES[k] ?? SKILL_ALIASES[k.slice(0, 4)] ?? T20_SKILLS.find((s) => s.id === k)?.id;
};

/* --------------------------- Foundry (sistema tormenta20) --------------------- */

function isFoundryActor(o: Any) {
  return (o.type === "character" || o.type === "npc") && (o.system || o.data) && typeof o.name === "string";
}

export function foundryActorToSheet(actor: Any): CharacterSheet {
  const sys = (actor.system ?? actor.data ?? {}) as Any;
  const items = (Array.isArray(actor.items) ? actor.items : []) as Any[];

  const attrs: Partial<Record<AttrKey, number>> = {};
  for (const k of ATTR_KEYS) {
    const a = g(sys, `atributos.${k}`) ?? g(sys, `attributes.${k}`) ?? g(sys, `abilities.${k}`);
    if (a !== undefined) attrs[k] = n(g(a, "value") ?? g(a, "mod") ?? a);
    // Foundry T20 antigo usa valores clássicos (8-18) em "base"
    const base = n(g(a, "base"), NaN);
    if (!isNaN(base) && base >= 8 && attrs[k] === undefined) attrs[k] = Math.floor((base - 10) / 2);
  }

  const raceItem = items.find((i) => i.type === "raca" || i.type === "race");
  const classItems = items.filter((i) => i.type === "classe" || i.type === "class");
  const level = classItems.reduce((a, c) => a + n(g(c, "system.niveis") ?? g(c, "system.nivel") ?? g(c, "system.level") ?? g(c, "data.niveis"), 0), 0) || n(g(sys, "detalhes.nivel") ?? g(sys, "nivel") ?? g(sys, "details.level"), 1);
  const race = findRaceByName(str(raceItem?.name) || str(g(sys, "detalhes.raca")) || "Humano");
  const cls = findClassByName(str(classItems[0]?.name) || str(g(sys, "detalhes.classe")) || "Guerreiro");

  const trained: string[] = [];
  const others: Record<string, number> = {};
  const per = (g(sys, "pericias") ?? g(sys, "skills") ?? {}) as Any;
  for (const [k, v] of Object.entries(per)) {
    const id = skillId(k);
    if (!id) continue;
    const treino = n(g(v, "treino") ?? g(v, "treinado") ?? g(v, "trained"), 0);
    if (treino > 0 || g(v, "treinado") === true) trained.push(id);
    const outros = n(g(v, "outros") ?? g(v, "bonus") ?? g(v, "outro"), 0);
    if (outros) others[id] = outros;
  }

  const sheet = buildSheet({
    name: str(actor.name),
    avatar: str(actor.img).startsWith("http") ? str(actor.img) : undefined,
    raceId: race?.id ?? "humano",
    classId: cls?.id ?? "guerreiro",
    level: Math.max(1, Math.min(20, level)),
    xp: n(g(sys, "detalhes.xp") ?? g(sys, "detalhes.experiencia.value") ?? g(sys, "details.xp.value")),
    attributes: attrs,
    trainedSkills: trained,
    money: n(g(sys, "dinheiro.ts") ?? g(sys, "dinheiro.value") ?? g(sys, "currency.ts")),
    languages: str(g(sys, "detalhes.idiomas")) || "Comum",
    history: stripHtml(str(g(sys, "detalhes.biografia") ?? g(sys, "detalhes.biography") ?? g(sys, "details.biography.value"))) || undefined,
    equipment: [],
    powers: items.filter((i) => ["poder", "power", "habilidade", "feat"].includes(str(i.type))).map((i) => ({ id: uid("pw"), name: str(i.name), type: str(g(i, "system.tipo") ?? g(i, "system.type") ?? "Poder") || "Poder", description: stripHtml(str(g(i, "system.description.value") ?? g(i, "system.descricao") ?? g(i, "system.description") ?? "")) })),
    spells: items.filter((i) => i.type === "magia" || i.type === "spell").map((i) => { const s = findSpellByName(str(i.name)); return s ? spellToItem(s) : { id: uid("sp"), name: str(i.name), circle: n(g(i, "system.circulo") ?? g(i, "system.level"), 1), cost: n(g(i, "system.custo") ?? g(i, "system.pm"), 1), description: stripHtml(str(g(i, "system.description.value") ?? "")) }; }),
    notes: "Importado do Foundry VTT.",
  });
  for (const [id, v] of Object.entries(others)) sheet.skills[id] = { ...(sheet.skills[id] ?? { trained: false }), other: v };

  // equipamento (substitui o kit padrão quando o ator traz itens)
  const eqItems = items.filter((i) => ["arma", "weapon", "armadura", "armor", "equipamento", "equipment", "consumivel", "consumable", "loot", "tesouro"].includes(str(i.type)));
  if (eqItems.length) sheet.equipment = [];
  for (const it of eqItems) {
    const def = findItemByName(str(it.name));
    const equipped = !!(g(it, "system.equipado") ?? g(it, "system.equipped"));
    if (def) {
      sheet.equipment.push(itemToEquipment(def, n(g(it, "system.qtd") ?? g(it, "system.quantity"), 1), equipped));
      const atk = itemToAttack(def);
      if (atk && equipped) sheet.attacks.push(atk);
    } else {
      sheet.equipment.push({ id: uid("eq"), equipped, name: str(it.name), quantity: n(g(it, "system.qtd") ?? g(it, "system.quantity"), 1), slots: n(g(it, "system.peso") ?? g(it, "system.espacos"), 1), price: n(g(it, "system.preco"), 0) || null, description: stripHtml(str(g(it, "system.description.value") ?? "")), category: str(it.type).startsWith("arma") || it.type === "weapon" ? "Arma" : str(it.type).startsWith("armadura") || it.type === "armor" ? "Armadura" : "Item Geral", defenseBonus: n(g(it, "system.defesa") ?? g(it, "system.armor.value"), 0) || undefined, armorPenalty: -Math.abs(n(g(it, "system.penalidade"), 0)) || undefined });
    }
  }
  if (sheet.attacks.length > 1 && sheet.attacks[0].name === "Desarmado") sheet.attacks.shift();

  const out = recalc(sheet);
  const pv = g(sys, "attributes.pv") ?? g(sys, "pv");
  const pm = g(sys, "attributes.pm") ?? g(sys, "pm");
  if (pv) out.hp = { current: n(g(pv, "value"), out.hp.max), max: n(g(pv, "max"), out.hp.max) || out.hp.max };
  if (pm) out.mp = { current: n(g(pm, "value"), out.mp.max), max: n(g(pm, "max"), out.mp.max) || out.mp.max };
  const def = n(g(sys, "attributes.defesa.value") ?? g(sys, "defesa.value") ?? g(sys, "attributes.ac.value"), NaN);
  if (!isNaN(def)) {
    const armor = out.equipment.filter((i) => i.equipped && (i.category === "Armadura" || i.category === "Escudo")).reduce((a, i) => a + (i.defenseBonus ?? 0), 0);
    out.defenseOther = def - 10 - out.attributes.des.value - armor;
  }
  return out;
}

/* ---------------------------------- Roll20 ----------------------------------- */

function isRoll20Character(o: Any) {
  return Array.isArray(o.attribs) && typeof o.name === "string";
}

export function roll20ToSheet(char: Any): CharacterSheet {
  const attribs = new Map<string, string>();
  for (const a of char.attribs as Any[]) attribs.set(str(a.name).toLowerCase(), str(a.current));
  const get = (...keys: string[]) => { for (const k of keys) { const v = attribs.get(k.toLowerCase()); if (v !== undefined && v !== "") return v; } return undefined; };

  const attrs: Partial<Record<AttrKey, number>> = {};
  const names: Record<AttrKey, string[]> = { for: ["for", "forca", "força", "str"], des: ["des", "destreza", "dex"], con: ["con", "constituicao"], int: ["int", "inteligencia"], sab: ["sab", "sabedoria", "wis"], car: ["car", "carisma", "cha"] };
  for (const k of ATTR_KEYS) {
    const v = get(...names[k], ...names[k].map((x) => x + "_mod"), ...names[k].map((x) => x + "_base"));
    if (v !== undefined) { const num = n(v); attrs[k] = num >= 8 && num <= 30 ? Math.floor((num - 10) / 2) : num; }
  }
  const trained = T20_SKILLS.filter((s) => { const v = get(`${s.nome.toLowerCase()}_treino`, `${s.id}_treino`, `treino_${s.id}`, `${s.nome.toLowerCase()}_trained`); return v !== undefined && v !== "0" && v !== "false"; }).map((s) => s.id);
  const race = findRaceByName(get("raca", "race") ?? "Humano");
  const cls = findClassByName(get("classe", "class") ?? "Guerreiro");
  const sheet = buildSheet({ name: str(char.name), raceId: race?.id ?? "humano", classId: cls?.id ?? "guerreiro", level: n(get("nivel", "level"), 1), xp: n(get("xp", "experiencia")), attributes: attrs, trainedSkills: trained, money: n(get("tibares", "dinheiro", "ts")), notes: "Importado do Roll20." });
  const out = recalc(sheet);
  const pv = get("pv", "hp"); const pvm = get("pv_max", "hp_max");
  if (pv) out.hp = { current: n(pv), max: n(pvm, out.hp.max) || out.hp.max };
  const pm = get("pm", "mana"); const pmm = get("pm_max", "mana_max");
  if (pm) out.mp = { current: n(pm), max: n(pmm, out.mp.max) || out.mp.max };
  return out;
}

/* ------------------------------ Detecção / entrada ---------------------------- */

export interface VttImportResult {
  characters: CharacterSheet[];
  campaign?: VttCampaign;
  kind: string;
  warnings: string[];
}

export function importVttJson(text: string, fileName = "arquivo"): VttImportResult {
  const warnings: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    if (text.startsWith("PK")) throw new Error("Este arquivo é um ZIP. Extraia o ZIP e escolha o arquivo .json (ou .db) que está dentro, ou exporte a aventura do Foundry como JSON.");
    // Foundry "db" (NeDB): um JSON por linha
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: unknown[] = [];
    for (const l of lines) { try { parsed.push(JSON.parse(l)); } catch { /* ignora linha */ } }
    if (!parsed.length) throw new Error("não é JSON nem banco NeDB do Foundry. No Foundry, use “Exportar dados” (JSON) no ator, ou exporte a aventura/compêndio como JSON. Pastas “packs” em formato LevelDB não podem ser lidas diretamente.");
    data = parsed;
    warnings.push(`Arquivo lido como banco NeDB (${parsed.length} documentos).`);
  }

  const unwrap = (o: Any): Any => (o && typeof o === "object" && o.adventure && typeof o.adventure === "object" ? (o.adventure as Any) : o);
  const list: Any[] = (Array.isArray(data) ? (data as Any[]) : [data as Any]).map(unwrap);
  const chars: CharacterSheet[] = [];
  const npcs: VttCampaign["npcs"] = [];
  const journals: VttCampaign["journals"] = [];
  const scenes: string[] = [];
  let kind = "json";

  // Mundo/campanha do Foundry exportado como objeto com coleções
  const root = list.length === 1 ? list[0] : undefined;
  const listOf = (...keys: string[]) => {
    for (const k of keys) { const v = root?.[k]; if (Array.isArray(v)) return v as Any[]; }
    return undefined;
  };
  const actorsCol = listOf("actors", "Actors");
  const isRoll20Campaign = !!root && Array.isArray(root.characters) && (root.characters as Any[]).some(isRoll20Character);
  if (actorsCol || (!isRoll20Campaign && listOf("scenes", "Scenes", "journal", "journals"))) {
    kind = "foundry-world";
    let skipped = 0;
    for (const a of actorsCol ?? []) {
      if (!isFoundryActor(a)) { skipped++; continue; }
      if (a.type === "npc") npcs.push({ name: str(a.name), type: str(g(a, "system.tipo") ?? g(a, "system.details.type")), nd: str(g(a, "system.nd") ?? g(a, "system.details.cr")), hp: n(g(a, "system.attributes.pv.max")), defense: n(g(a, "system.attributes.defesa.value")) });
      else chars.push(foundryActorToSheet(a));
    }
    for (const j of ((root!.journal ?? root!.journals ?? []) as Any[])) journals.push({ name: str(j.name), text: stripHtml(str(g(j, "content") ?? (Array.isArray(j.pages) ? (j.pages as Any[]).map((p) => str(g(p, "text.content"))).join(" ") : ""))) .slice(0, 2000) });
    for (const s of ((root!.scenes ?? root!.Scenes ?? []) as Any[])) scenes.push(str(s.name));
    if (skipped) warnings.push(`${skipped} ator(es) de outros tipos (ex.: veículo, item solto) foram ignorados; só personagens e NPCs são importados.`);
  } else if (isRoll20Campaign) {
    kind = "roll20";
    for (const c of root!.characters as Any[]) if (isRoll20Character(c)) chars.push(roll20ToSheet(c));
    for (const pg of ((root!.pages ?? []) as Any[])) scenes.push(str(pg.name));
    for (const h of ((root!.handouts ?? []) as Any[])) journals.push({ name: str(h.name), text: stripHtml(str(h.notes ?? h.gmnotes)).slice(0, 2000) });
  } else {
    for (const o of list) {
      if (isFoundryActor(o)) {
        kind = "foundry-actor";
        if (o.type === "npc") npcs.push({ name: str(o.name), type: str(g(o, "system.tipo")), nd: str(g(o, "system.nd")), hp: n(g(o, "system.attributes.pv.max")), defense: n(g(o, "system.attributes.defesa.value")) });
        else chars.push(foundryActorToSheet(o));
      } else if (isRoll20Character(o)) {
        kind = "roll20";
        chars.push(roll20ToSheet(o));
      } else if (isHeroJson(o)) {
        kind = "heroi-json";
        chars.push(heroJsonToSheet(o));
      } else if (o && typeof o === "object" && (o as Any).name && (o as Any).attributes && (o as Any).hp) {
        kind = "t20online";
        chars.push(o as unknown as CharacterSheet);
      } else if (o && typeof o === "object" && str((o as Any).type) === "scene") scenes.push(str((o as Any).name));
      else if (o && typeof o === "object" && str((o as Any).type) === "journal") journals.push({ name: str((o as Any).name), text: stripHtml(str(g(o, "content"))).slice(0, 2000) });
    }
  }

  if (!chars.length && !npcs.length && !scenes.length && !journals.length) warnings.push("Nenhum personagem, NPC, cena ou diário reconhecido no arquivo.");

  const campaign: VttCampaign | undefined = npcs.length || scenes.length || journals.length || chars.length > 1
    ? { id: `camp-${Date.now().toString(36)}`, name: str(root?.title ?? root?.name) || fileName.replace(/\.(json|db)$/i, ""), system: str(root?.system ?? "tormenta20"), source: kind.startsWith("foundry") ? "foundry" : kind === "roll20" ? "roll20" : "json", scenes, journals, actors: chars, npcs, importedAt: new Date().toISOString() }
    : undefined;
  return { characters: chars, campaign, kind, warnings };
}
