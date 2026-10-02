/**
 * COMPÊNDIO — entrada de consulta para os catálogos oficiais.
 *
 * Os dados já existiam no disco (271 magias, 2.284 poderes, 1.400 itens,
 * 620 ameaças) e alimentavam o motor, mas **não havia porta de entrada na UI**:
 * o Mestre não conseguia simplesmente procurar "Bola de Fogo" durante a sessão.
 *
 * Carregamento sob demanda (`import()`), como o resto dos catálogos — nada é
 * duplicado e nada entra no bundle inicial.
 */
export type CompendiumKind = "spell" | "power" | "item";

export interface CompendiumEntry {
  id: string;
  kind: CompendiumKind;
  name: string;
  /** linha curta de contexto: círculo/escola, categoria, preço… */
  meta: string;
  description: string;
  /** campos extras exibidos como pares rótulo/valor */
  fields: Array<{ label: string; value: string }>;
}

export const KIND_LABEL: Record<CompendiumKind, string> = {
  spell: "Magias",
  power: "Poderes",
  item: "Itens",
};

const texto = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v));

function campos(pares: Array<[string, unknown]>): Array<{ label: string; value: string }> {
  return pares
    .map(([label, value]) => ({ label, value: texto(value) }))
    .filter((entry) => entry.value);
}

export function spellToEntry(raw: Record<string, unknown>): CompendiumEntry {
  const circulo = texto(raw.circulo);
  return {
    id: `spell:${texto(raw.id) || texto(raw.nome)}`,
    kind: "spell",
    name: texto(raw.nome),
    meta: [circulo && `${circulo}º círculo`, texto(raw.escola), texto(raw.tipo)].filter(Boolean).join(" · "),
    description: texto(raw.descricao),
    fields: campos([
      ["Execução", raw.execucao], ["Alcance", raw.alcance], ["Alvo", raw.alvo],
      ["Duração", raw.duracao], ["Resistência", raw.resistencia], ["Custo", raw.custo],
    ]),
  };
}

export function powerToEntry(raw: Record<string, unknown>): CompendiumEntry {
  return {
    id: `power:${texto(raw.id) || texto(raw.nome)}`,
    kind: "power",
    name: texto(raw.nome),
    meta: [texto(raw.categoria), texto(raw.classe), texto(raw.subtipo)].filter(Boolean).join(" · "),
    description: texto(raw.descricao),
    fields: campos([
      ["Requisito", raw.requisito], ["Nível", raw.nivel], ["Habilidade", raw.habilidade], ["Fonte", raw.fonte],
    ]),
  };
}

export function itemToEntry(raw: Record<string, unknown>): CompendiumEntry {
  const preco = texto(raw.preco);
  return {
    id: `item:${texto(raw.id) || texto(raw.nome)}`,
    kind: "item",
    name: texto(raw.nome),
    meta: [texto(raw.categoria), preco && `T$ ${preco}`].filter(Boolean).join(" · "),
    description: texto(raw.descricao) || texto(raw.combate),
    fields: campos([
      ["Dano", raw.dano], ["Crítico", raw.critico], ["Tipo de dano", raw.danoTipo],
      ["Alcance", raw.alcance], ["Empunhadura", raw.empunhadura],
      ["Proficiência", raw.proficiencia], ["Espaços", raw.slots],
    ]),
  };
}

const cache = new Map<CompendiumKind, CompendiumEntry[]>();

/** Carrega um catálogo sob demanda. O resultado fica em memória na sessão. */
export async function loadCompendium(kind: CompendiumKind): Promise<CompendiumEntry[]> {
  const guardado = cache.get(kind);
  if (guardado) return guardado;

  let entradas: CompendiumEntry[] = [];
  if (kind === "spell") {
    const mod = await import("../../ficha-modernrpg/t20/vtt/magias.json");
    entradas = (mod.default as Array<Record<string, unknown>>).map(spellToEntry);
  } else if (kind === "power") {
    const mod = await import("../../ficha-modernrpg/t20/vtt/poderes.json");
    entradas = (mod.default as Array<Record<string, unknown>>).map(powerToEntry);
  } else {
    const mod = await import("../../ficha-modernrpg/t20/vtt/itens.json");
    entradas = (mod.default as Array<Record<string, unknown>>).map(itemToEntry);
  }
  cache.set(kind, entradas);
  return entradas;
}

function normaliza(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Busca por nome, descrição e meta, ignorando acento e caixa.
 * Prioriza quem começa com o termo — "bola" traz "Bola de Fogo" primeiro.
 */
export function searchCompendium(
  entries: CompendiumEntry[], query: string, limit = 60,
): CompendiumEntry[] {
  const termo = normaliza(query.trim());
  if (!termo) return entries.slice(0, limit);
  const pontuado: Array<{ entry: CompendiumEntry; score: number }> = [];
  for (const entry of entries) {
    const nome = normaliza(entry.name);
    let score = -1;
    if (nome.startsWith(termo)) score = 3;
    else if (nome.includes(termo)) score = 2;
    else if (normaliza(entry.meta).includes(termo)) score = 1;
    else if (normaliza(entry.description).includes(termo)) score = 0;
    if (score >= 0) pontuado.push({ entry, score });
  }
  return pontuado
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name, "pt-BR"))
    .slice(0, limit)
    .map((item) => item.entry);
}
