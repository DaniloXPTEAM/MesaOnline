import terrenosRaw from "./encontros/terrenos.json";
import { rollFormula } from "./macros";

/**
 * Encontros aleatórios (Ferramenta de mestre). As tabelas por ambiente e região vêm de
 * `public/EncontrosAleatorios/data.js` (copiadas para `encontros/terrenos.json`, sem as imagens externas);
 * a rolagem segue o gerador do VTT antigo (`Vtt/app.js`, `gerarEncontro`): d100 + ajuste do patamar do
 * grupo, e 1% de chance de "O Rhandomm" (evento lendário, sorteado de novo com 25%).
 */
export interface EncontroEntrada { porcentagem: number; descricao: string; pag?: string }

export const TERRENOS = terrenosRaw as Record<string, EncontroEntrada[]>;
const AMBIENTES = Object.keys(TERRENOS);
/** Os 11 primeiros são terrenos; o resto são regiões de Arton. */
export const GRUPOS_DE_AMBIENTE = { terrenos: AMBIENTES.slice(0, 11), regioes: AMBIENTES.slice(11) };

export const PATAMARES = [
  { id: "iniciante", label: "Iniciante", ajuste: 0 },
  { id: "veterano", label: "Veterano", ajuste: 30 },
  { id: "campeao", label: "Campeão", ajuste: 70 },
  { id: "lenda", label: "Lenda", ajuste: 110 },
] as const;
export type PatamarId = (typeof PATAMARES)[number]["id"];

export interface EncontroSorteado {
  ambiente: string;
  patamar: PatamarId;
  /** d100 puro */
  rolagem: number;
  /** d100 + ajuste do patamar */
  total: number;
  descricao: string;
  pag?: string;
  lendario: boolean;
}

export function sortearEncontro(ambiente: string, patamar: PatamarId, random: () => number = Math.random): EncontroSorteado {
  const tabela = TERRENOS[ambiente];
  if (!tabela?.length) throw new Error(`Ambiente sem tabela de encontros: ${ambiente}`);
  const rolagem = 1 + Math.floor(random() * 100);
  if (rolagem === 100 && 1 + Math.floor(random() * 100) <= 25) {
    return { ambiente, patamar, rolagem, total: rolagem, descricao: "O Rhandomm", pag: "Ameaças, pag. 113", lendario: true };
  }
  const ajuste = PATAMARES.find((entry) => entry.id === patamar)?.ajuste ?? 0;
  const total = rolagem + ajuste;
  const entrada = tabela.find((linha) => total <= linha.porcentagem) ?? tabela[tabela.length - 1];
  return { ambiente, patamar, rolagem, total, descricao: entrada.descricao, pag: entrada.pag, lendario: false };
}

/** Chance de encontro na viagem (5% + 5% por dia sem encontro); devolve o d100 e se houve encontro. */
export function testarSorteDaViagem(chance: number, random: () => number = Math.random): { rolagem: number; encontro: boolean } {
  const rolagem = 1 + Math.floor(random() * 100);
  return { rolagem, encontro: rolagem <= chance };
}

/* ---------------- ameaças citadas na descrição ---------------- */

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const normalize = (text: string) => plain(text).replace(/\*/g, "").replace(/['’`]/g, "").replace(/[^a-z0-9\s]/g, " ");
const STOP = new Set(["das", "dos", "com", "sob", "uma", "uns", "para", "pelo", "pela", "pelos", "pelas", "como"]);

/** Singular aproximado (bandidos → bandido, goblins → goblin, leões → leao), o mesmo do gerador antigo. */
function stem(word: string): string {
  let s = word;
  if (s.endsWith("oes")) s = `${s.slice(0, -3)}ao`;
  else if (s.endsWith("ais")) s = `${s.slice(0, -3)}al`;
  else if (s.endsWith("eis")) s = `${s.slice(0, -3)}el`;
  else if (s.endsWith("ens")) s = `${s.slice(0, -3)}em`;
  else if (s.endsWith("ins")) s = `${s.slice(0, -3)}im`;
  else if (s.endsWith("uns")) s = `${s.slice(0, -3)}um`;
  else if (s.endsWith("ons") || s.endsWith("ans") || s.endsWith("nns")) s = s.slice(0, -1);
  else if (s.endsWith("res") || s.endsWith("ses") || s.endsWith("zes")) s = s.slice(0, -2);
  else if (s.endsWith("is") && !/(lis|mis|ris)$/.test(s)) s = s.slice(0, -1);
  else if (s.endsWith("s")) s = s.slice(0, -1);
  return s;
}

const tokens = (text: string) => normalize(text).split(/\s+/).filter((word) => word.length > 2 && !STOP.has(word)).map(stem);

export interface AmeacaDoEncontro<T> {
  template: T;
  quantidade: number;
  /** "1d3", "2" ou vazio quando o texto não traz número */
  formula?: string;
}

/**
 * Procura na descrição as criaturas do catálogo (todas as palavras do nome, no singular) e rola a quantidade
 * escrita antes do nome ("1d3 bandidos comuns" → 1 a 3 Bandido Comum; "2 lacedons" → 2 Lacedon).
 */
export function ameacasNaDescricao<T extends { name: string }>(descricao: string, catalogo: readonly T[], random: () => number = Math.random): AmeacaDoEncontro<T>[] {
  const palavras = new Set(tokens(descricao));
  const achados = catalogo
    .map((template) => ({ template, nome: tokens(template.name) }))
    .filter((entry) => entry.nome.length > 0 && entry.nome.every((word) => palavras.has(word)))
    .sort((a, b) => b.nome.length - a.nome.length || b.template.name.length - a.template.name.length);
  // "Pirata" dentro de "Capitão Pirata" não vira uma segunda ameaça.
  const aceitos: typeof achados = [];
  for (const entry of achados) {
    if (aceitos.some((accepted) => accepted.nome !== entry.nome && entry.nome.every((word) => accepted.nome.includes(word)))) continue;
    if (aceitos.some((accepted) => accepted.template.name === entry.template.name)) continue;
    aceitos.push(entry);
  }
  const texto = plain(descricao);
  return aceitos.map(({ template, nome }) => {
    const radical = nome[0].slice(0, 5);
    const match = texto.match(new RegExp(`(\\d+d\\d+(?:\\s*\\+\\s*\\d+)?|\\d+)\\s+(?:[a-z-]+\\s+){0,2}?${radical}`));
    if (!match) return { template, quantidade: 1 };
    const formula = match[1].replace(/\s+/g, "");
    const rolado = /d/.test(formula) ? rollFormula(formula, random)?.total : Number(formula);
    return { template, quantidade: Math.max(1, Math.min(20, Math.trunc(rolado ?? 1))), formula };
  });
}
