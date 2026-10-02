import spellsJson from "../../../ficha-modernrpg/t20/vtt/magias.json";
import type { GameAction } from "../../game/types";
import type { CastInfo } from "../../components/tactics/CastPanel";
import enhancementsJson from "../data/spellEnhancements.json";

/**
 * Normalização de conjuração.
 *
 * O CastPanel esperava uma entrada rica (alvo/duração/efeito/aprimoramentos
 * tipados) que nunca existiu: magias.json só traz `aprimoramentos: [{custo,
 * desc}]` em texto livre. Este módulo é a peça que faltava, e é PURO de
 * propósito — a UI usa para montar o painel e o runtime do Mestre usa para
 * recalcular o custo, para que um jogador não consiga conjurar mais barato
 * mandando um payload adulterado.
 */

export interface CanonicalSpellEntry {
  id: string;
  nome: string;
  circulo: number;
  tipo?: string;
  escola?: string;
  execucao?: string;
  alcance?: string;
  alvo?: string;
  duracao?: string;
  resistencia?: string;
  custo?: number;
  descricao?: string;
  aprimoramentos?: { custo: number; desc: string }[];
}

const CATALOG = spellsJson as CanonicalSpellEntry[];

export function spellKeyOf(name: string): string {
  return normalize(name);
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BY_ID = new Map(CATALOG.map((entry) => [entry.id, entry]));
const BY_NAME = new Map(CATALOG.map((entry) => [normalize(entry.nome), entry]));

/** Resolve a magia oficial de uma ação. Devolve null quando a ação é homebrew. */
export function findSpellEntry(action: Pick<GameAction, "sourceId" | "name" | "category">): CanonicalSpellEntry | null {
  if (action.category !== "spell") return null;
  const bySourceId = action.sourceId ? BY_ID.get(action.sourceId) || BY_NAME.get(normalize(action.sourceId)) : undefined;
  return bySourceId || BY_NAME.get(normalize(action.name)) || null;
}

export type AugmentKind = "aumenta" | "muda" | "truque" | "extra";

/**
 * Aprimoramentos curados das 25 magias com efeito automático (fonte: registro
 * `ArmadaSpellEffects` de `public/vtt/spell-effects.js`, ModernRPG-2026-09-23).
 * Trazem o que o texto livre do catálogo não tem: bônus somado por uso (`soma`),
 * limite pelo círculo (`limiteBonus`), círculo mínimo (`requerCirculo`) e a
 * característica alterada por um "muda" (`altera`).
 */
interface CuratedEnhancement {
  custo: number;
  tipo: AugmentKind;
  rotulo: string;
  soma?: Record<string, number>;
  limiteBonus?: "circulo";
  altera?: string[];
  requerCirculo?: number;
  manual?: boolean;
}
const CURATED = enhancementsJson as unknown as Record<string, { baseMods?: Record<string, number>; aprimoramentos: CuratedEnhancement[] }>;

/** Bônus base do efeito da magia (ex.: Bênção +1 ataque e +1 dano). */
export function curatedBaseMods(entry: Pick<CanonicalSpellEntry, "nome">): Record<string, number> {
  return { ...(CURATED[normalize(entry.nome)]?.baseMods || {}) };
}

export interface NormalizedAugment {
  custo: number;
  tipo: AugmentKind;
  rotulo: string;
  /** true = o painel só cobra o PM; o efeito é aplicado pelo mestre à mão. */
  manual: boolean;
  /** Alvos extras concedidos por uso, quando o texto é explícito. */
  extraTargets?: number;
  /** quanto cada uso soma aos bônus do efeito (ataque, dano, defesa, rd) */
  soma?: Record<string, number>;
  /** o primeiro bônus não passa do círculo máximo que o conjurador lança */
  limiteBonus?: "circulo";
  /** características que um "muda" altera (duas mudanças na mesma não acumulam) */
  altera?: string[];
  /** círculo mínimo que o conjurador precisa lançar (magia racial nunca cumpre) */
  requerCirculo?: number;
}

function augmentKind(desc: string): AugmentKind {
  if (/^\s*aumenta/i.test(desc)) return "aumenta";
  if (/^\s*muda/i.test(desc)) return "muda";
  if (/^\s*truque/i.test(desc)) return "truque";
  return "extra";
}

/**
 * Único aprimoramento que o motor sabe aplicar sozinho hoje: "aumenta o número
 * de alvos em +N". Todo o resto é marcado `manual` — o painel cobra o PM certo
 * e diz, na cara, que o efeito precisa ser aplicado à mão. Fingir automação
 * que não existe seria pior do que não ter o painel.
 */
export function normalizeAugments(entry: CanonicalSpellEntry): NormalizedAugment[] {
  const curated = CURATED[normalize(entry.nome)];
  if (curated) {
    return curated.aprimoramentos.map((option) => {
      const targets = Number(option.rotulo.match(/n[úu]mero de alvos em \+(\d+)/i)?.[1]);
      const targetsAuto = option.tipo === "aumenta" && Number.isFinite(targets) && targets > 0;
      return {
        custo: option.custo,
        tipo: option.tipo,
        rotulo: option.rotulo,
        manual: !option.soma && !targetsAuto,
        extraTargets: targetsAuto ? targets : undefined,
        soma: option.soma,
        limiteBonus: option.limiteBonus,
        altera: option.altera,
        requerCirculo: option.requerCirculo,
      };
    });
  }
  return (entry.aprimoramentos || []).map((option) => {
    const desc = String(option.desc || "").trim();
    const targets = Number(desc.match(/n[úu]mero de alvos em \+(\d+)/i)?.[1]);
    const automatable = Number.isFinite(targets) && targets > 0;
    return {
      custo: Number(option.custo) || 0,
      tipo: augmentKind(desc),
      rotulo: desc || "Aprimoramento",
      manual: !automatable,
      extraTargets: automatable ? targets : undefined,
    };
  });
}

function parseDuration(value?: string): CastInfo["entry"]["duracao"] {
  const text = String(value || "").trim();
  if (!text) return undefined;
  if (/cena/i.test(text)) return { tipo: "cena" };
  if (/sustentada/i.test(text)) return { tipo: "sustentada" };
  const rounds = Number(text.match(/(\d+)\s*rodada/i)?.[1]);
  if (Number.isFinite(rounds) && rounds > 0) return { tipo: "rodadas", n: rounds };
  return { tipo: "outra", rotulo: text };
}

function targetSide(action: GameAction): string {
  if (action.target === "self") return "si";
  if (action.target === "ally" || action.effect === "heal" || action.effect === "buff") return "aliados";
  return "inimigos";
}

function maxTargetsFromText(entry: CanonicalSpellEntry): number | undefined {
  const explicit = Number(String(entry.alvo || "").match(/(\d+)\s*criatur/i)?.[1]);
  return Number.isFinite(explicit) && explicit > 0 ? explicit : undefined;
}

export interface CastContext {
  action: GameAction;
  entry: CanonicalSpellEntry;
  /** Nível do conjurador — é o teto de PM por magia no T20. */
  level: number;
  currentPm: number;
  candidates: { id: string; name: string }[];
  effectLabel?: string;
  /** Círculo máximo que o conjurador lança (por classe e nível); sem valor, usa o círculo da magia. */
  maxCircle?: number;
  /** Magia racial: concedida pela raça, não pela classe. */
  racial?: boolean;
}

export function buildCastInfo(context: CastContext): CastInfo {
  const { action, entry } = context;
  return {
    actionId: action.id,
    name: action.name,
    baseCost: action.pmCost || entry.custo || Math.max(1, entry.circulo * 2 - 1),
    // Magia racial não cumpre pré-requisito de círculo: usa o círculo da própria magia como máximo.
    maxCircle: context.racial ? entry.circulo : Math.max(1, context.maxCircle ?? entry.circulo),
    circle: entry.circulo,
    racial: context.racial === true,
    level: Math.max(1, context.level),
    kind: action.kind,
    description: entry.descricao || action.description,
    currentPm: context.currentPm,
    candidates: context.candidates,
    entry: {
      alvo: {
        lado: targetSide(action),
        alcanceM: action.rangeM,
        incluiSi: action.target === "self",
        max: maxTargetsFromText(entry),
      },
      duracao: parseDuration(entry.duracao),
      efeito: { rotulo: context.effectLabel || action.damage || action.healing || action.condition || entry.alvo || "Especial", mods: curatedBaseMods(entry) },
      aprimoramentos: normalizeAugments(entry),
    },
  };
}

export interface CastPlan {
  cost: number;
  mods: Record<string, number>;
  error: string;
  maxTargets: number;
  manualNotes: string[];
}

export interface AugmentChoice {
  counts: Record<number, number>;
  racial: boolean;
}

/** Sanitiza uma escolha vinda da rede antes de qualquer cálculo. */
export function sanitizeAugmentChoice(value: unknown): AugmentChoice {
  const raw = (value && typeof value === "object" ? value : {}) as { counts?: unknown; racial?: unknown };
  const counts: Record<number, number> = {};
  if (raw.counts && typeof raw.counts === "object") {
    for (const [key, amount] of Object.entries(raw.counts as Record<string, unknown>)) {
      const index = Number(key);
      const times = Math.floor(Number(amount));
      // Teto defensivo: ninguém precisa de 10 mil usos do mesmo aprimoramento.
      if (Number.isInteger(index) && index >= 0 && index < 64 && Number.isFinite(times) && times > 0) counts[index] = Math.min(times, 99);
    }
  }
  return { counts, racial: raw.racial === true };
}

/**
 * Custo final e validação. Mesma função nos dois lados da rede: a UI usa para
 * habilitar o botão, o Mestre usa para recusar um pedido adulterado.
 */
export function computeCastPlan(info: CastInfo, choice: AugmentChoice): CastPlan {
  const augments = info.entry.aprimoramentos || [];
  // Racial marcada na escolha: o círculo máximo passa a ser o da própria magia e os pré-requisitos de círculo não valem.
  const racial = choice.racial === true;
  const maxCircle = racial ? info.circle : info.maxCircle;
  const mods: Record<string, number> = { ...(info.entry.efeito?.mods || {}) };
  const changed = new Set<string>();
  let cost = info.baseCost;
  let extraTargets = 0;
  let used = 0;
  let trick = false;
  let error = "";
  const fail = (message: string) => { if (!error) error = message; };
  const manualNotes: string[] = [];

  for (const [key, times] of Object.entries(choice.counts)) {
    const option = augments[Number(key)];
    if (!option || times <= 0) continue;
    used += 1;
    if (option.requerCirculo && (racial || maxCircle < option.requerCirculo)) fail(`"${option.rotulo}" exige lançar magias de ${option.requerCirculo}º círculo.`);
    // Só o "aumenta" acumula; os demais valem uma vez.
    const uses = option.tipo === "aumenta" ? times : 1;
    if (option.tipo !== "aumenta" && times > 1) fail(`"${option.rotulo}" só pode ser usado uma vez (só os aprimoramentos "aumenta" acumulam).`);
    if (option.tipo === "muda") {
      for (const feature of option.altera || []) {
        if (changed.has(feature)) fail(`Mudanças na mesma característica (${feature}) não se acumulam.`);
        changed.add(feature);
      }
    }
    if (option.tipo === "truque") trick = true;
    cost += option.custo * uses;
    for (const [mod, value] of Object.entries(option.soma || {})) mods[mod] = (mods[mod] || 0) + value * uses;
    if (option.limiteBonus === "circulo") {
      const first = Object.keys(option.soma || {})[0];
      if (first && mods[first] > maxCircle) fail(`O bônus não pode passar do círculo máximo que você lança (${maxCircle}º).`);
    }
    if (option.extraTargets) extraTargets += option.extraTargets * uses;
    else if (option.manual) manualNotes.push(option.rotulo);
  }
  if (trick) {
    if (used > 1) fail("Truque não pode ser usado junto com outros aprimoramentos.");
    cost = 0;
  }

  const pmLimit = Math.max(1, info.level);
  if (cost > pmLimit) fail(`Limite de PM em uma magia: ${pmLimit} (seu nível). Este lançamento custaria ${cost}.`);
  else if (cost > info.currentPm) fail(`PM insuficientes: precisa de ${cost}, você tem ${info.currentPm}.`);

  return {
    cost,
    mods,
    error,
    maxTargets: Math.max(1, (info.entry.alvo?.max || 1) + extraTargets),
    manualNotes,
  };
}
