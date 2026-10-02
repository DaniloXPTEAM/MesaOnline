import { loadCharacterSheets, upsertCharacterSheet } from "../../ficha-modernrpg/characterRoute";
import { addCustomThreat } from "../tactics/engine/customThreats";
import { customThreatInput, threatFieldsFromJson } from "../tactics/engine/customThreatInput";
import { importCharacterSheet } from "./importers";
import type { TokenLink } from "./tokenLibrary";

/** Tem cara de ficha de herói (classe, raça, atributos…) ou de ameaça (PV + nome)? */
export function jsonKind(data: Record<string, unknown>): "character" | "threat" | null {
  const keys = Object.keys(data).map((key) => key.toLowerCase());
  const has = (...names: string[]) => names.some((name) => keys.includes(name));
  if (has("personagem", "class", "classe", "race", "raca", "raça", "atributos", "attributes", "campos_originais_pdf")) return "character";
  if (has("pv", "hp") && has("nome", "name")) return "threat";
  return null;
}

/**
 * Vincula um token a um arquivo JSON: se for um herói, a ficha entra na lista de personagens; se for uma ameaça,
 * ela entra no catálogo como ameaça própria. O token passa a apontar para o que foi criado (a imagem do token vira o retrato).
 */
export function linkFromJson(data: unknown, image: string): TokenLink {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("O JSON precisa ser um objeto de herói ou de ameaça.");
  const source = data as Record<string, unknown>;
  const kind = jsonKind(source);
  if (kind === "character") {
    const sheet = importCharacterSheet(source, image || undefined);
    upsertCharacterSheet(sheet);
    return { kind: "character", id: sheet.id, label: sheet.name };
  }
  if (kind === "threat") {
    const { fields, portrait } = threatFieldsFromJson(source);
    if (!fields.nome.trim()) throw new Error("A ameaça do JSON não tem nome.");
    const threat = addCustomThreat(customThreatInput(fields, image || portrait));
    return { kind: "threat", id: threat.id, label: threat.name };
  }
  throw new Error("Não reconheci o JSON: use um herói (classe, atributos…) ou uma ameaça (nome e PV).");
}

export const knownCharacterIds = (): Set<string> => new Set(loadCharacterSheets().map((sheet) => sheet.id));
