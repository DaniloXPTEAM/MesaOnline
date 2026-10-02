import {
  TESOURO_ND, getDiverso, getEquipamento, getMagicoMaior, getMagicoMedio, getMagicoMenor, getMelhoria, getMelhoria2, getMelhoria3, getMelhoria4,
  getPocao, getRiquezaMaior, getRiquezaMedia, getRiquezaMenor, setRollRecorder,
} from "./tabelas";

/**
 * Espólio: gera o tesouro de uma criatura pelas tabelas REAIS do Tormenta20 ("Tesouro por ND" e
 * sub-tabelas de riquezas, poções, itens diversos, equipamentos, superiores e mágicos), as mesmas de
 * `public/espolio` (a página do Espólio). Porta a lógica de `rolarMissao`, `resolverEntrada` e
 * `renderizarItensResolvidos` de `public/espolio/js.js`, sem a parte de tela. O `tesouro` da ficha da
 * ameaça diz quanto ela traz: Nenhum, Metade (divide o dinheiro por 2), Padrão, Dobro (rola duas vezes cada coluna).
 * "Triplo" aparece em fichas do bestiário e aqui rola três vezes (extensão do Dobro; a página não tem essa opção).
 */
export type TreasureTier = "nenhum" | "padrao" | "metade" | "dobro" | "triplo";

/** Cotação oficial usada pela página: 1 TC = 0,1 T$; 1 TO = 10 T$. */
const COIN_IN_TIBAR: Record<string, number> = { TC: 0.1, "T$": 1, TO: 10, PP: 100, PC: 0.01 };

interface Entry {
  kind: "vazio" | "dinheiro" | "contagem" | "rotulo";
  value?: number;
  coin?: string;
  quantity?: number;
  label?: string;
  /** "+%" na tabela: +20% na rolagem de d% do tipo de riqueza/poção */
  bonus: boolean;
  /** "2D" na tabela: role 2d6 e escolha uma de duas opções */
  twoD: boolean;
}

export interface LootResult {
  /** moedas por tipo (TC, T$, TO...) */
  coins: Record<string, number>;
  /** itens, riquezas e equipamentos, já em texto */
  items: string[];
  /** valor aproximado do conjunto em T$ (moedas + riquezas + itens com preço) */
  totalTibar: number;
}

const rollDie = (sides: number) => 1 + Math.floor(Math.random() * sides);

function parseDice(expr: string): { n: number; sides: number; bonus: number } | null {
  const match = expr.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
  return match ? { n: Number(match[1]), sides: Number(match[2]), bonus: match[3] ? Number(match[3]) : 0 } : null;
}

function rollSpec(spec: { n: number; sides: number; bonus: number }): number {
  let total = spec.bonus;
  for (let i = 0; i < spec.n; i += 1) total += rollDie(spec.sides);
  return total;
}

function resolveEntry(original: string | null): Entry {
  if (!original || original === "—") return { kind: "vazio", bonus: false, twoD: false };
  let text = original.trim();
  let bonus = false;
  let twoD = false;
  if (/\+%$/.test(text)) { bonus = true; text = text.replace(/\s*\+%$/, "").trim(); }
  if (/\s2D$/.test(text)) { twoD = true; text = text.replace(/\s2D$/, "").trim(); }

  const money = text.match(/^(\d+d\d+(?:\+\d+)?)x([\d.]+)\s*(TC|T\$|TO|PP|PC)$/);
  if (money) {
    const dice = parseDice(money[1]);
    if (dice) return { kind: "dinheiro", value: rollSpec(dice) * parseInt(money[2].replace(/\./g, ""), 10), coin: money[3], bonus, twoD };
  }
  const counted = text.match(/^(\d+d\d+(?:\+\d+)?)\s+(.+)$/);
  if (counted) {
    const dice = parseDice(counted[1]);
    if (dice) return { kind: "contagem", quantity: rollSpec(dice), label: counted[2], bonus, twoD };
  }
  const fixed = text.match(/^(\d+)\s+(.+)$/);
  if (fixed) return { kind: "contagem", quantity: parseInt(fixed[1], 10), label: fixed[2], bonus, twoD };
  return { kind: "rotulo", label: text, bonus, twoD };
}

/** Faixa de d% ("21-70") que contém a rolagem. */
function pickRow(rows: [string, string][], roll: number): string | null {
  for (const [range, result] of rows) {
    const [min, max] = range.split("-").map((part) => parseInt(part, 10));
    if (roll >= min && roll <= max) return result;
  }
  return null;
}

function hasSubTable(entry: Entry): boolean {
  const label = (entry.label || "").toLowerCase();
  return /riqueza|poç|poc|item diverso|equipamento|superior|mágico|magico/.test(label);
}

/** Função que sorteia UMA unidade da sub-tabela indicada pelo rótulo (`obterPickUnidadeSub` da página). */
function unitPicker(entry: Entry): (() => string) | null {
  const label = (entry.label || "").toLowerCase();
  const bonus = entry.bonus ? 20 : 0;
  if (label.includes("riqueza")) {
    const kind = label.includes("maior") ? "maior" : /média|media/.test(label) ? "media" : "menor";
    return () => (kind === "maior" ? getRiquezaMaior(bonus) : kind === "media" ? getRiquezaMedia(bonus) : getRiquezaMenor(bonus));
  }
  if (/poç|poc/.test(label)) return () => getPocao(bonus);
  if (label.includes("item diverso")) return () => getDiverso();
  if (label.includes("equipamento")) return () => getEquipamento();
  if (label.includes("superior")) {
    const n = Number(label.match(/\((\d)\s*melhoria/)?.[1] || 1);
    const pick = [getMelhoria, getMelhoria2, getMelhoria3, getMelhoria4][Math.min(4, Math.max(1, n)) - 1];
    return () => pick();
  }
  if (/mágico|magico/.test(label)) {
    const tag = (label.match(/\((\w+)\)/)?.[1] || "menor").toLowerCase();
    return () => (tag.includes("maior") ? getMagicoMaior() : tag.includes("menor") ? getMagicoMenor() : getMagicoMedio());
  }
  return null;
}

/** Soma os valores em T$ escritos no texto ("T$ 100" ou "(25 T$)"), como `totalT$NoTexto` da página. */
export function tibarInText(text: string): number {
  let sum = 0;
  for (const match of text.matchAll(/T\$\s*([\d.]+)/g)) sum += parseInt(match[1].replace(/\./g, ""), 10);
  for (const match of text.matchAll(/\(\s*([\d.]+)\s*T\$/g)) sum += parseInt(match[1].replace(/\./g, ""), 10);
  return sum;
}

/** "Nome — Ex.: exemplos" vira "Nome (exemplos)"; o resto do texto fica como está. */
function readable(text: string): string {
  const cut = text.search(/\s[—–-]\s*Ex\.:/);
  if (cut < 0) return text.trim();
  return `${text.slice(0, cut).trim()} (${text.slice(cut).replace(/^\s*[—–-]\s*Ex\.:\s*/, "").trim()})`;
}

/**
 * Riqueza da tabela ("4d4 (10 T$) — Ex.: ágata, hematita"): o valor exato é o dado (com o multiplicador, se houver)
 * e o objeto é um dos exemplos. A página usa só a média entre parênteses; aqui o valor é sorteado.
 */
function rollRichness(text: string): { line: string; value: number } | null {
  const match = text.match(/^(\d+)d(\d+)\s*(?:[×x]\s*(\d+))?\s*\(([\d.]+)\s*T\$\)\s*[—–-]\s*Ex\.:\s*(.+)$/);
  if (!match) return null;
  let total = 0;
  for (let i = 0; i < Number(match[1]); i += 1) total += rollDie(Number(match[2]));
  const value = total * (match[3] ? Number(match[3]) : 1);
  const examples = match[5].split(",").map((part) => part.trim()).filter(Boolean);
  const example = examples[Math.floor(Math.random() * examples.length)] || "Objeto de valor";
  return { line: `${example.charAt(0).toUpperCase()}${example.slice(1)} (T$ ${value})`, value };
}

function itemLines(entry: Entry, totals: { riches: number; items: number }): string[] {
  if (entry.kind === "vazio" || entry.kind === "dinheiro") return [];
  const quantity = Math.min(entry.quantity || 1, 12);
  if (hasSubTable(entry)) {
    const pick = unitPicker(entry);
    if (pick) {
      const isRich = (entry.label || "").toLowerCase().includes("riqueza");
      const lines: string[] = [];
      for (let i = 0; i < quantity; i += 1) {
        if (entry.twoD) {
          // Escolha de 2d6 entre duas opções (a página mostra um cartão de escolha): aqui ficam as duas.
          lines.push(`${readable(pick())} ou ${readable(pick())}`);
          continue;
        }
        const rolled = pick();
        const rich = isRich ? rollRichness(rolled) : null;
        if (rich) { totals.riches += rich.value; lines.push(rich.line); continue; }
        const value = tibarInText(rolled);
        if (isRich) totals.riches += value; else totals.items += value;
        lines.push(readable(rolled));
      }
      return lines;
    }
  }
  const label = entry.label || "";
  const text = label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
  return entry.kind === "contagem" ? [`${entry.quantity}× ${text}`] : [text];
}

/** Sorteia o tesouro de UMA criatura de ND `ndKey` (chave da tabela: "1/4", "1/2", "1".."20"). */
export function rollThreatLoot(ndKey: string, tier: TreasureTier, bonusPct = 0): LootResult {
  const result: LootResult = { coins: {}, items: [], totalTibar: 0 };
  const row = TESOURO_ND.find((entry) => entry.nd === ndKey);
  if (!row || tier === "nenhum") return result;

  const times = tier === "dobro" ? 2 : tier === "triplo" ? 3 : 1;
  const totals = { riches: 0, items: 0 };
  for (let round = 0; round < times; round += 1) {
    const money = resolveEntry(pickRow(row.dinheiro, Math.min(100, rollDie(100) + bonusPct)));
    if (money.kind === "dinheiro" && money.coin) {
      const value = tier === "metade" ? Math.floor((money.value || 0) / 2) : money.value || 0;
      result.coins[money.coin] = (result.coins[money.coin] || 0) + value;
    } else if (money.kind !== "vazio") {
      // Coluna Dinheiro que dá uma riqueza ("1 riqueza menor") entra como item.
      result.items.push(...itemLines(money, totals));
    }
    const item = resolveEntry(pickRow(row.itens, Math.min(100, rollDie(100) + bonusPct)));
    result.items.push(...itemLines(item, totals));
  }
  const coinsInTibar = Object.entries(result.coins).reduce((sum, [coin, value]) => sum + value * (COIN_IN_TIBAR[coin] ?? 1), 0);
  result.totalTibar = Math.round(coinsInTibar + totals.riches + totals.items);
  return result;
}

/** Texto das moedas ("35 TC · 120 T$"). */
export function coinsText(coins: Record<string, number>): string {
  return Object.entries(coins).filter(([, value]) => value > 0).map(([coin, value]) => `${value} ${coin}`).join(" · ");
}

// ---- leitura da ficha da ameaça ------------------------------------------------------

/**
 * Chave da tabela para o ND da ficha. Aceita "1/4", "¼", "ND 5", "Agora 10"; "S" e "S+" usam a linha 20
 * (a tabela termina em ND 20); "1/3" cai em 1/4. Devolve `null` quando não dá para saber ("-", "?").
 */
export function challengeKey(nd: unknown): string | null {
  const text = String(nd ?? "").toLowerCase().replace("½", "1/2").replace("¼", "1/4").replace(/^\s*(nd|agora)\s*/, "").trim();
  if (!text || text === "-" || text === "?") return null;
  if (text === "s" || text === "s+") return "20";
  const fraction = text.match(/^1\/(\d+)$/);
  if (fraction) return Number(fraction[1]) === 2 ? "1/2" : "1/4";
  const whole = Number(text);
  if (!Number.isFinite(whole) || whole <= 0) return null;
  return String(Math.min(20, Math.max(1, Math.round(whole))));
}

/**
 * Quanto a ficha diz que a criatura traz. O campo `tesouro` é texto livre: começa com Nenhum, Metade,
 * Padrão, Dobro ou Triplo e depois pode trazer equipamento ("Padrão (Adaga, gazua)") ou materiais
 * ("Metade mais duas garras"). `tier` é `null` quando o texto só descreve materiais para extrair.
 * `note` é o resto do texto, que vai para o baú como está.
 */
export function parseTreasure(text: unknown): { tier: TreasureTier | null; note: string } {
  const raw = String(text ?? "").trim();
  const match = raw.match(/^(nenhum|nenhuma|metade|padr[aã]o|dobro|triplo)\b\.?/i);
  if (!match) return { tier: null, note: raw.replace(/\.$/, "") };
  const word = match[1].toLowerCase();
  const tier: TreasureTier = word.startsWith("nenhum") ? "nenhum" : word === "metade" ? "metade" : word.startsWith("padr") ? "padrao" : word === "dobro" ? "dobro" : "triplo";
  const rest = raw.slice(match[0].length).trim();
  const wrapped = rest.match(/^\((.*)\)\.?$/s);
  return { tier, note: (wrapped ? wrapped[1] : rest).replace(/^[,;]\s*/, "").replace(/\.$/, "").trim() };
}

/** Conteúdo do baú de espólio: moedas, itens sorteados e o que a ficha diz que a criatura carrega. */
export function lootContents(loot: LootResult, note: string): string[] {
  const contents: string[] = [];
  const coins = coinsText(loot.coins);
  if (coins) contents.push(coins);
  contents.push(...loot.items);
  if (note) contents.push(note);
  return contents;
}

export { setRollRecorder };
