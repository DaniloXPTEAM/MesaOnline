import type { GameAction, SaveType } from "../../game/types";

export function normalizeRuleText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function formulasIn(value: unknown): string[] {
  return [...String(value ?? "").matchAll(/\d+d\d+(?:\s*[+-]\s*\d+)?/gi)]
    .map((match) => match[0].replace(/\s/g, ""));
}

export function numberBonus(value: unknown, fallback = 0): number {
  return Number(String(value ?? "").match(/[+-]?\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".")) || fallback;
}

export function parseRangeM(value: unknown, fallback = 1.5): number {
  const text = String(value ?? "");
  const explicit = Number(text.match(/(\d+(?:[.,]\d+)?)\s*m\b/i)?.[1]?.replace(",", "."));
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  if (/pessoal/i.test(text)) return 0;
  if (/toque|adjacente|corpo a corpo/i.test(text)) return 1.5;
  if (/curto/i.test(text)) return 9;
  if (/m[eé]dio/i.test(text)) return 30;
  if (/longo/i.test(text)) return 90;
  return fallback;
}

export function parseAreaM(value: unknown): number | undefined {
  const text = String(value ?? "");
  if (!/área|area|cone|linha|esfera|explos|quadrado|cubo|raio/i.test(text)) return undefined;
  const explicit = Number(text.match(/(?:raio|cone|linha|esfera|quadrado|cubo|explos[aã]o)(?:\s+de)?\s*(\d+(?:[.,]\d+)?)\s*m/i)?.[1]?.replace(",", "."));
  return Number.isFinite(explicit) && explicit > 0 ? explicit : 3;
}

export function parseSave(value: unknown): SaveType | undefined {
  const text = normalizeRuleText(value);
  if (/fort(?:itude)?/.test(text)) return "fortitude";
  if (/ref(?:lexos)?/.test(text)) return "reflexes";
  if (/von(?:tade)?/.test(text)) return "will";
  return undefined;
}

export function parseCondition(value: unknown): string | undefined {
  const normalized = normalizeRuleText(value);
  const conditions = [
    "abalado", "agarrado", "apavorado", "atordoado", "caído", "cego", "confuso",
    "debilitado", "enjoado", "enredado", "esmorecido", "exausto", "fascinado",
    "fatigado", "fraco", "frustrado", "imóvel", "inconsciente", "lento", "ofuscado",
    "paralisado", "pasmo", "surdo", "vulnerável",
  ];
  return conditions.find((condition) => normalized.includes(normalizeRuleText(condition)));
}

export function inferActionFields(textValue: unknown): Pick<GameAction,
  "areaM" | "condition" | "autoHit" | "halfOnSave" | "extraDamage" | "save" | "saveDC"
> {
  const text = String(textValue ?? "");
  const formulas = formulasIn(text);
  const save = parseSave(text);
  return {
    areaM: parseAreaM(text),
    condition: parseCondition(text),
    autoHit: Boolean(formulas.length) && !save && !/teste de ataque|ataque corpo|ataque à distância|ataque a distancia/i.test(text),
    halfOnSave: Boolean(save && /metade|reduz[^.]*metade/i.test(text)),
    extraDamage: formulas[1],
    save,
    saveDC: Number(text.match(/\bCD\s*(\d+)/i)?.[1]) || undefined,
  };
}

export function actionKindFromExecution(value: unknown): GameAction["kind"] {
  const text = normalizeRuleText(value);
  if (/reacao/.test(text)) return "reaction";
  if (/movimento/.test(text)) return "movement";
  if (/completa/.test(text)) return "full";
  if (/livre/.test(text)) return "free";
  return "standard";
}
