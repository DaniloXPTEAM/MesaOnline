import type { CharacterSheet } from "../ficha-modernrpg/sheet";
import type { BattleMap, BoardState, BoardToken, GameAction } from "../src/game/types";

export function makeSheet(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  const attribute = (key: "for" | "des" | "con" | "int" | "sab" | "car", value: number) => ({ key, short: key.toUpperCase(), name: key.toUpperCase(), value });
  return {
    id: "character-1",
    name: "Alyssa",
    race: "Humana",
    class: "Arcanista",
    level: 5,
    campaign: "Teste",
    attributes: {
      for: attribute("for", 1), des: attribute("des", 2), con: attribute("con", 3),
      int: attribute("int", 4), sab: attribute("sab", 2), car: attribute("car", 3),
    },
    hp: { current: 30, max: 40 },
    mp: { current: 15, max: 20 },
    defenseOther: 0,
    speed: 9,
    skills: {},
    attacks: [{ id: "attack-1", name: "Cajado", skill: "Luta", bonus: 2, damage: "1d6", critical: "20/x2", damageType: "Impacto" }],
    racialAbilities: [],
    classAbilities: [],
    powers: [],
    spells: [],
    money: 0,
    equipment: [],
    conditions: [],
    languages: "Comum",
    xp: 0,
    notes: "",
    ...overrides,
  };
}

export function makeToken(overrides: Partial<BoardToken> = {}): BoardToken {
  return {
    id: "token-1", name: "Alyssa", title: "Arcanista", side: "heroes", gx: 1, gy: 1,
    symbol: "AL", accent: "#fff", hp: 30, hpMax: 40, pm: 15, pmMax: 20,
    defense: 15, initiative: 5, initiativeRoll: 0, luta: 5, pontaria: 4,
    damage: "1d6", crit: 20, critMultiplier: 2, attackType: "melee", rangeM: 1.5,
    movementM: 9, level: 5, spellDC: 16, actionIds: [], tacticalActions: [],
    fortitude: 6, reflexes: 5, will: 7, conditions: [],
    ...overrides,
  };
}

export function makeMap(overrides: Partial<BattleMap> = {}): BattleMap {
  return { id: "map-test", name: "Mapa", location: "Teste", image: "", cols: 12, rows: 12, terrain: {}, ...overrides };
}

export function makeBoard(tokens: BoardToken[] = [], overrides: Partial<BoardState> = {}): BoardState {
  return {
    id: "board-test", map: makeMap(), tokens, walls: [], lights: [], shapes: [], objects: [],
    fog: [], explored: [], weather: "clear", chat: [], selectedTokenIds: [], targetedTokenIds: [], revision: 1,
    ...overrides,
  };
}

export function makeAction(overrides: Partial<GameAction> = {}): GameAction {
  return {
    id: "action-1", name: "Ataque", category: "weapon", kind: "standard", effect: "damage",
    target: "enemy", description: "Ataque de teste", pmCost: 0, rangeM: 1.5,
    attackSkill: "luta", damage: "1d6", crit: 20, critMultiplier: 2, color: "steel",
    ...overrides,
  };
}
