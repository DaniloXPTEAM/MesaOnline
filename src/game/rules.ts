import type { BattleMap, TacticalUnitView, TerrainCell } from "./types";
import { metersToCells } from "./distance";

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getCell(map: BattleMap, x: number, y: number): TerrainCell {
  return map.terrain[cellKey(x, y)] || { type: "normal", elevation: 0 };
}

export function gridDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function targetDefense(map: BattleMap, target: TacticalUnitView): number {
  return target.defense + (getCell(map, target.x, target.y).type === "cover" ? 5 : 0);
}

export function isFlanking(attacker: TacticalUnitView, target: TacticalUnitView, units: TacticalUnitView[]): boolean {
  if (gridDistance(attacker, target) > 1) return false;
  return units.some((ally) => {
    if (ally.id === attacker.id || ally.side !== attacker.side || ally.defeated || gridDistance(ally, target) > 1) return false;
    return Math.sign(attacker.x - target.x) === -Math.sign(ally.x - target.x)
      && Math.sign(attacker.y - target.y) === -Math.sign(ally.y - target.y);
  });
}

/** Usado só por projeções/demonstrações; o jogo real usa tactics/engine/movement.ts. */
export function reachableCells(map: BattleMap, unit: TacticalUnitView, units: TacticalUnitView[]): Map<string, number> {
  const budget = Math.max(0, Math.floor(metersToCells(unit.movementM)));
  const reached = new Map<string, number>([[cellKey(unit.x, unit.y), 0]]);
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
      if (!dx && !dy) continue;
      const x = current.x + dx;
      const y = current.y + dy;
      const key = cellKey(x, y);
      if (x < 0 || y < 0 || x >= map.cols || y >= map.rows || getCell(map, x, y).type === "blocked") continue;
      if (units.some((entry) => entry.id !== unit.id && !entry.defeated && entry.x === x && entry.y === y)) continue;
      const diagonal = dx && dy ? 2 : 1;
      const cost = current.cost + diagonal * (getCell(map, x, y).type === "difficult" ? 2 : 1);
      if (cost > budget || cost >= (reached.get(key) ?? Infinity)) continue;
      reached.set(key, cost);
      queue.push({ x, y, cost });
    }
  }
  return reached;
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * Math.max(1, sides)) + 1;
}

export function rollFormula(formula: string, diceMultiplier = 1): { total: number; rolls: number[] } {
  const match = String(formula || "0").replace(/\s/g, "").match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) return { total: Number(formula) || 0, rolls: [] };
  const count = (Number(match[1]) || 1) * Math.max(1, diceMultiplier);
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  return { total: rolls.reduce((sum, value) => sum + value, modifier), rolls };
}
