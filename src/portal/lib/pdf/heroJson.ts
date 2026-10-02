/**
 * JSON de herói no formato do extrator do PDF "Modelo de Heróis":
 *   { "personagem": { nome, raca, classe, nivel, atributos: { forca… }, pv, pm, defesa, experiencia, tibares },
 *     "campos_originais_pdf": { …campos de formulário do PDF… } }
 * Com `campos_originais_pdf` a ficha sai completa (mesma leitura do PDF); só com `personagem`, sai o resumo.
 */
import type { CharacterSheet } from "../../types/sheet";
import { applyDraft } from "../../components/sheet/PdfImportModal";
import { T20_CLASSES, T20_RACES, findClassByName, findRaceByName, type AttrKey } from "../t20/compendium";
import { buildSheet } from "../t20/sheetRules";
import { levelForXp } from "../t20/xp";
import { parseFormFields, type PdfDraft } from "./parseSheetText";

type Any = Record<string, unknown>;

export const isHeroJson = (o: unknown): o is Any => {
  const p = o && typeof o === "object" ? (o as Any).personagem : undefined;
  return !!p && typeof p === "object" && typeof (p as Any).nome === "string";
};

const ATTR_JSON: Record<string, AttrKey> = { forca: "for", destreza: "des", constituicao: "con", inteligencia: "int", sabedoria: "sab", carisma: "car" };
const num = (v: unknown): number | undefined => (v === null || v === undefined || v === "" ? undefined : Number.isFinite(Number(v)) ? Number(v) : undefined);
const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export function heroJsonToDraft(o: Any): PdfDraft {
  const draft: PdfDraft = { attributes: {}, skills: {}, trainedSkills: [], rawText: "", formFields: {}, warnings: [] };
  const fields = o.campos_originais_pdf;
  if (fields && typeof fields === "object") {
    draft.formFields = Object.fromEntries(Object.entries(fields as Any).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [k, String(v)]));
    parseFormFields(draft.formFields, draft);
  }
  const p = o.personagem as Any;
  draft.name ??= text(p.nome);
  draft.race ??= text(p.raca);
  draft.origin ??= text(p.origem);
  draft.class ??= text(p.classe);
  draft.deity ??= text(p.divindade);
  draft.level ??= num(p.nivel);
  draft.xp ??= num(p.experiencia);
  draft.money ??= num(p.tibares);
  draft.defense ??= num(p.defesa);
  const attrs = (p.atributos ?? {}) as Any;
  for (const [key, attr] of Object.entries(ATTR_JSON)) if (draft.attributes[attr] === undefined && num(attrs[key]) !== undefined) draft.attributes[attr] = num(attrs[key]);
  const pv = (p.pv ?? {}) as Any;
  if (!draft.hp?.max && num(pv.maximo)) draft.hp = { max: num(pv.maximo), current: num(pv.atual) ?? num(pv.maximo) };
  const pm = (p.pm ?? {}) as Any;
  if (!draft.mp?.max && num(pm.maximo)) draft.mp = { max: num(pm.maximo), current: num(pm.atual) ?? num(pm.maximo) };
  if (draft.race) draft.raceId = findRaceByName(draft.race)?.id;
  if (draft.class) draft.classId = findClassByName(draft.class)?.id;
  return draft;
}

/** Ficha digital pronta (mesma montagem do botão "Criar nova ficha" da importação de PDF). */
export function sheetFromDraft(draft: PdfDraft, campaign = "Campanha livre", source = "JSON"): CharacterSheet {
  const base = buildSheet({
    name: draft.name ?? "Personagem importado",
    raceId: draft.raceId ?? T20_RACES[0].id,
    classId: draft.classId ?? T20_CLASSES[0].id,
    level: draft.level ?? (draft.xp !== undefined ? levelForXp(draft.xp) : 1),
    xp: draft.xp,
    campaign,
    attributes: draft.attributes,
    trainedSkills: draft.trainedSkills,
    notes: `Importado de ${source}.`,
  });
  return applyDraft(base, draft);
}

export const heroJsonToSheet = (o: Any, campaign?: string): CharacterSheet => sheetFromDraft(heroJsonToDraft(o), campaign, "JSON do herói");
