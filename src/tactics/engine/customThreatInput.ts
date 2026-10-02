import type { ThreatTemplate } from "../../game/types";

/** Campos do formulário "Nova ameaça" (todos texto, como o formulário os guarda). */
export interface ThreatFields {
  nome: string; tipo: string; nd: string; pv: string; pm: string; defesa: string;
  iniciativa: string; luta: string; pontaria: string; dano: string; desl: string;
}

export const DEFAULT_THREAT_FIELDS: ThreatFields = { nome: "", tipo: "Ameaça personalizada", nd: "3", pv: "30", pm: "10", defesa: "18", iniciativa: "5", luta: "8", pontaria: "5", dano: "1d8+4", desl: "9m (6q)" };

/** Lê um JSON de ameaça (campos em português ou inglês). Devolve também o retrato, se o arquivo trouxer um. */
export function threatFieldsFromJson(data: Record<string, unknown>): { fields: ThreatFields; portrait?: string } {
  const fields: ThreatFields = {
    nome: String(data.nome ?? data.name ?? ""),
    tipo: String(data.tipo ?? data.title ?? "Ameaça importada"),
    nd: String(data.nd ?? "—"),
    pv: String(data.pv ?? data.hp ?? 30),
    pm: String(data.pm ?? 0),
    defesa: String(data.defesa ?? data.defense ?? 18),
    iniciativa: String(data.iniciativa ?? data.initiative ?? 5),
    luta: String(data.luta ?? 8),
    pontaria: String(data.pontaria ?? 5),
    dano: String(data.dano ?? data.damage ?? "1d8+4"),
    desl: String(data.desl ?? data.deslocamento ?? "9m (6q)"),
  };
  const portrait = data.portrait ?? data.imagem;
  return { fields, portrait: portrait ? String(portrait) : undefined };
}

/** Ameaça jogável (com um ataque interpretado) montada a partir dos campos. */
export function customThreatInput(form: ThreatFields, portrait?: string): Omit<ThreatTemplate, "id" | "custom"> {
  const movementM = Number(form.desl.match(/\d+/)?.[0]) || 9;
  const ranged = Number(form.pontaria) > Number(form.luta);
  return {
    name: form.nome.trim(), title: `${form.tipo} · ND ${form.nd}`, symbol: form.nome.slice(0, 2).toUpperCase(),
    portrait: portrait || undefined, sprite: portrait || undefined, pv: Number(form.pv) || 1, pm: Number(form.pm) || 0,
    defense: Number(form.defesa) || 10, initiative: Number(form.iniciativa) || 0, luta: Number(form.luta) || 0,
    pontaria: Number(form.pontaria) || 0, damage: form.dano || "1d6", crit: 20, critMultiplier: 2,
    attackType: ranged ? "ranged" : "melee", rangeM: ranged ? 9 : 1.5,
    movementM, level: 1, spellDC: 12, actions: [], customActions: [{ id: `custom-action-${crypto.randomUUID()}`, name: "Ataque", category: "weapon", kind: "standard", effect: "damage", target: "enemy", description: "Ataque da ameaça personalizada.", pmCost: 0, rangeM: 1.5, attackSkill: "luta", damage: form.dano || "1d6", crit: 20, critMultiplier: 2, color: "blood" }],
    fortitude: 0, reflexes: 0, will: 0,
  };
}
