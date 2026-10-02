import type { ThreatTemplate } from "../../game/types";
import { getOfficialThreats } from "../data/bestiaryAdapter";

export const CUSTOM_THREATS_STORAGE_KEY = "modernrpg_armada_custom_threats_v1";

function loadCustom(): ThreatTemplate[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_THREATS_STORAGE_KEY) || "[]") as ThreatTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Camada persistente equivalente ao AMEACAS_DB legado. */
let database: ThreatTemplate[] | undefined;
function threatDb(): ThreatTemplate[] { return (database ??= [...getOfficialThreats(), ...loadCustom()]); }

function persist() {
  const custom = threatDb().filter((threat) => threat.custom);
  localStorage.setItem(CUSTOM_THREATS_STORAGE_KEY, JSON.stringify(custom));
  window.dispatchEvent(new CustomEvent("modernrpg-threats-changed"));
}

export function listThreats(options: { includeHidden?: boolean } = {}): ThreatTemplate[] {
  return threatDb().filter((threat) => options.includeHidden || !threat.hidden);
}

export function getThreat(threatId: string): ThreatTemplate | null {
  return threatDb().find((threat) => threat.id === threatId) || null;
}

export function addCustomThreat(input: Omit<ThreatTemplate, "id" | "custom"> & { id?: string }): ThreatTemplate {
  const threat: ThreatTemplate = {
    ...input,
    id: input.id || `custom-threat-${crypto.randomUUID()}`,
    custom: true,
  };
  database = [...threatDb().filter((entry) => entry.id !== threat.id), threat];
  persist();
  return threat;
}

export function updateCustomThreat(threatId: string, patch: Partial<ThreatTemplate>): ThreatTemplate {
  const threat = getThreat(threatId);
  if (!threat?.custom) throw new Error("A ameaça personalizada não foi encontrada.");
  const next = { ...threat, ...patch, id: threat.id, custom: true };
  database = threatDb().map((entry) => entry.id === threat.id ? next : entry);
  persist();
  return next;
}

/**
 * Preserva índices/referências: remoção marca hidden em vez de deslocar a base.
 */
export function removeCustomThreat(threatId: string): void {
  const threat = getThreat(threatId);
  if (!threat?.custom) return;
  database = threatDb().map((entry) => entry.id === threatId ? { ...entry, hidden: true } : entry);
  persist();
}

export function ensureSyntheticThreat(template: ThreatTemplate): ThreatTemplate {
  const existing = threatDb().find((entry) => entry.id === template.id);
  if (existing) return existing;
  const synthetic = { ...template, custom: true, hidden: true };
  database = [...threatDb(), synthetic];
  persist();
  return synthetic;
}
