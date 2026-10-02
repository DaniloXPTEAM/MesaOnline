/**
 * OVERLAY VISUAL DE CONDIÇÕES NO TOKEN.
 *
 * O motor de condições da Mesa é superior ao do VTT antigo (219 referências,
 * com expiração por turno). O que faltava era a camada visual: o Mestre tinha
 * de abrir a ficha para saber que alguém estava Atordoado.
 *
 * Recuperado de `Vtt/app.js`: `_renderCondEffects`, `_atualizarOverlayCondicao`,
 * `_mostrarIndicadorCondicao` — as 33 funções `cond*` do legado.
 */
export interface ConditionBadge {
  key: string;
  glyph: string;
  label: string;
  tone: "danger" | "warn" | "control" | "buff";
}

const TABELA: Array<{ match: RegExp } & Omit<ConditionBadge, "key">> = [
  { match: /cego|blind/i,            glyph: "◍", label: "Cego",        tone: "control" },
  { match: /surdo|deaf/i,            glyph: "◑", label: "Surdo",       tone: "control" },
  { match: /atordoad/i,              glyph: "✷", label: "Atordoado",   tone: "control" },
  { match: /paralisad/i,             glyph: "⊘", label: "Paralisado",  tone: "control" },
  { match: /ca[íi]d/i,               glyph: "⤓", label: "Caído",       tone: "warn" },
  { match: /agarrad|enredad/i,       glyph: "⛓", label: "Agarrado",    tone: "warn" },
  { match: /envenenad|veneno/i,      glyph: "☠", label: "Envenenado",  tone: "danger" },
  { match: /sangrand|hemorragia/i,   glyph: "❥", label: "Sangrando",   tone: "danger" },
  { match: /queimand|em chamas|fogo/i, glyph: "▲", label: "Queimando", tone: "danger" },
  { match: /abalad|amedrontad/i,     glyph: "⚑", label: "Abalado",     tone: "warn" },
  { match: /lento|lentid/i,          glyph: "⏱", label: "Lento",       tone: "warn" },
  { match: /ofuscad/i,               glyph: "◐", label: "Ofuscado",    tone: "warn" },
  { match: /exaust|fatigad/i,        glyph: "⌛", label: "Exausto",     tone: "warn" },
  { match: /fraco|enfraquecid/i,     glyph: "▽", label: "Fraco",       tone: "warn" },
  { match: /confus/i,                glyph: "⁇", label: "Confuso",     tone: "control" },
  { match: /invis[íi]vel/i,          glyph: "◌", label: "Invisível",   tone: "buff" },
  { match: /acelerad|c[ée]lere/i,    glyph: "»",  label: "Acelerado",  tone: "buff" },
  { match: /aben[çc]oad|inspirad/i,  glyph: "✚", label: "Abençoado",   tone: "buff" },
];

/** Converte a lista de condições do token em selos desenháveis. */
export function conditionBadges(conditions: string[] | undefined, limite = 4): ConditionBadge[] {
  if (!conditions?.length) return [];
  const vistos = new Set<string>();
  const selos: ConditionBadge[] = [];
  for (const entrada of conditions) {
    const achado = TABELA.find((item) => item.match.test(entrada));
    const label = achado?.label || entrada;
    if (vistos.has(label)) continue;
    vistos.add(label);
    selos.push({
      key: label,
      glyph: achado?.glyph || "•",
      label: achado ? entrada : entrada,
      tone: achado?.tone || "warn",
    });
    if (selos.length >= limite) break;
  }
  return selos;
}

/** Quantas condições ficaram de fora do limite de selos. */
export function hiddenConditionCount(conditions: string[] | undefined, limite = 4): number {
  const total = new Set((conditions || []).map((entry) => {
    const achado = TABELA.find((item) => item.match.test(entry));
    return achado?.label || entry;
  })).size;
  return Math.max(0, total - limite);
}
