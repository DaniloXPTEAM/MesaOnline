/**
 * EFEITO MECÂNICO DAS CONDIÇÕES (Tormenta 20).
 *
 * As regras seguem os textos do catálogo do VTT legado (`CONDITION_INFO`,
 * `Vtt/app.js`), guardados em `conditionInfo.ts`. Este módulo é puro: recebe os
 * nomes das condições do token e devolve números. Quem aplica (ataque, Defesa,
 * saves, movimento, ações, início de turno) é o motor tático.
 */

const key = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

/** Condições que já incluem outras. Aplicado em cadeia (Paralisado → Indefeso → Desprevenido). */
const IMPLIES: Record<string, string[]> = {
  amedrontado: ["abalado"], // termo usado na mesa para o estado de medo (Abalado)
  exausto: ["debilitado", "lento", "vulneravel"],
  fatigado: ["fraco", "vulneravel"],
  agarrado: ["desprevenido", "imovel"],
  enredado: ["lento", "vulneravel"],
  cego: ["desprevenido", "lento"],
  paralisado: ["imovel", "indefeso"],
  indefeso: ["desprevenido"],
  atordoado: ["desprevenido"],
  surpreendido: ["desprevenido"],
  petrificado: ["inconsciente"],
  inconsciente: ["indefeso"],
};

/** Ao receber a mesma condição de novo, ela vira a seguinte. */
export const ESCALATION: Record<string, string> = {
  abalado: "Apavorado",
  fraco: "Debilitado",
  debilitado: "Inconsciente",
  fatigado: "Exausto",
  exausto: "Inconsciente",
  frustrado: "Esmorecido",
};

/** Condições ativas já com as implícitas expandidas (chaves sem acento). */
export function activeConditions(names: readonly string[] | undefined): Set<string> {
  const out = new Set<string>();
  const visit = (name: string) => {
    const k = key(name);
    if (!k || out.has(k)) return;
    out.add(k);
    (IMPLIES[k] || []).forEach(visit);
  };
  (names || []).forEach(visit);
  return out;
}

export interface ConditionMods {
  /** bônus/penalidade em qualquer teste de ataque */
  attack: number;
  /** extra só em ataque corpo a corpo */
  meleeAttack: number;
  /** modificador de Defesa geral */
  defense: number;
  /** extra de Defesa contra ataque corpo a corpo / à distância */
  defenseVsMelee: number;
  defenseVsRanged: number;
  reflexes: number;
  /** falha automática em Reflexos */
  failReflexes: boolean;
  /** não pode fazer ações (nem reações) */
  canAct: boolean;
  blockedBy?: string;
  /** só uma ação padrão OU de movimento por rodada */
  oneActionPerRound: boolean;
  /** redução de dano fixa da condição */
  damageReduction: number;
}

const BLOCKERS: Array<[string, string]> = [
  ["atordoado", "Atordoado"], ["pasmo", "Pasmo"], ["surpreendido", "Surpreendido"],
  ["inconsciente", "Inconsciente"], ["fascinado", "Fascinado"], ["paralisado", "Paralisado"],
];

export function conditionMods(names: readonly string[] | undefined): ConditionMods {
  const set = activeConditions(names);
  const has = (name: string) => set.has(name);
  const blocker = BLOCKERS.find(([k]) => has(k));
  return {
    attack: (has("agarrado") ? -2 : 0) + (has("enredado") ? -2 : 0) + (has("ofuscado") ? -2 : 0),
    meleeAttack: has("caido") ? -5 : 0,
    defense: (has("vulneravel") ? -2 : 0) + (has("desprevenido") ? -5 : 0) + (has("indefeso") ? -10 : 0),
    defenseVsMelee: has("caido") ? -5 : 0,
    defenseVsRanged: has("caido") ? 5 : 0,
    reflexes: has("desprevenido") ? -5 : 0,
    failReflexes: has("indefeso"),
    canAct: !blocker,
    blockedBy: blocker?.[1],
    oneActionPerRound: has("enjoado"),
    damageReduction: has("petrificado") ? 8 : 0,
  };
}

/**
 * Penalidade em teste de perícia. `attr` é o atributo-chave da perícia
 * (for/des/con/int/sab/car) e `skillId` o id da perícia (ex.: "per").
 */
export function conditionSkillPenalty(names: readonly string[] | undefined, attr?: string, skillId?: string): number {
  const set = activeConditions(names);
  const has = (name: string) => set.has(name);
  let penalty = 0;
  penalty += has("apavorado") ? -5 : has("abalado") ? -2 : 0; // Abalado vira Apavorado: não acumulam
  const physical = attr === "for" || attr === "des" || attr === "con";
  const mental = attr === "int" || attr === "sab" || attr === "car";
  if (physical) penalty += has("debilitado") ? -5 : has("fraco") ? -2 : 0;
  if (mental) penalty += has("esmorecido") ? -5 : has("frustrado") ? -2 : 0;
  if ((attr === "for" || attr === "des") && has("cego")) penalty += -5;
  if (skillId === "per") penalty += (has("ofuscado") ? -2 : 0) + (has("fascinado") ? -5 : 0);
  return penalty;
}

/** Deslocamento em metros depois das condições (Imóvel, Lento, Caído, Sobrecarregado). */
export function adjustedSpeedM(names: readonly string[] | undefined, baseM: number): number {
  const set = activeConditions(names);
  if (set.has("imovel")) return 0;
  let speed = baseM;
  if (set.has("lento")) speed = Math.floor(speed / 2 / 1.5) * 1.5; // metade, arredondando para baixo em incrementos de 1,5 m
  if (set.has("caido")) speed = Math.min(speed, 1.5);
  if (set.has("sobrecarregado")) speed = Math.max(0, speed - 3);
  return speed;
}

/** Efeitos que disparam no início do turno do personagem. */
export function turnStartEffects(names: readonly string[] | undefined): Array<"fire" | "bleed" | "confused"> {
  const set = activeConditions(names);
  const out: Array<"fire" | "bleed" | "confused"> = [];
  if (set.has("emchamas")) out.push("fire");
  if (set.has("sangrando")) out.push("bleed");
  if (set.has("confuso")) out.push("confused");
  return out;
}

/** Resultado do 1d6 de Confuso no início do turno. */
export function confusedBehavior(roll: number): string {
  if (roll === 1) return "movimenta-se em uma direção aleatória (1d8)";
  if (roll <= 3) return "não pode fazer ações e balbucia incoerentemente";
  if (roll <= 5) return "ataca a criatura mais próxima (ou a si mesmo, se estiver sozinho)";
  return "a condição termina e ele age normalmente";
}
