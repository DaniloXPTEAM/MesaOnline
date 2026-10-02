import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { isoLayout } from "../tactics/iso-layout";
import { cellKey, getCell } from "../game/rules";
import type { ActionMode, BattleMap, TerrainType, TacticalUnitView, ViewMode } from "../game/types";
import IsometricMapCanvas from "./IsometricMapCanvas";

export interface BoardEffect {
  id: string;
  x: number;
  y: number;
  type: "slash" | "fire" | "arcane" | "heal" | "impact";
  label: string;
}

interface BattleBoardProps {
  /** regua compartilhada (game/mapTools.ts) — origem, ponta e rotulo */
  measureStart?: { x: number; y: number } | null;
  measureTip?: { x: number; y: number } | null;
  measureLabel?: string;
  onCellHover?: (x: number, y: number) => void;
  /** regra unica de visibilidade (game/vision.ts tokenVisible) */
  isUnitHidden?: (unit: { x: number; y: number; side?: string }) => boolean;
  /** caminho previsto ate o destino (tactics/engine/movement.pathTo) */
  pathCells?: Set<string>;
  map: BattleMap;
  units: TacticalUnitView[];
  view: ViewMode;
  rotation: number;
  zoom: number;
  showGrid: boolean;
  mode: ActionMode;
  selectedUnitId: string;
  activeUnitId: string;
  reachable: Set<string>;
  targetable: Set<string>;
  areaCells: Set<string>;
  pendingMove: string | null;
  fog: Set<string>;
  effect: BoardEffect | null;
  onCellClick: (x: number, y: number) => void;
  onUnitClick: (unit: TacticalUnitView) => void;
}

const terrainColor: Record<TerrainType, string> = {
  normal: "transparent",
  difficult: "rgba(219, 149, 48, .22)",
  blocked: "rgba(155, 35, 42, .24)",
  elevated: "rgba(129, 90, 194, .2)",
  cover: "rgba(45, 139, 89, .22)",
};

export default function BattleBoard(props: BattleBoardProps) {
  return props.view === "2d" ? <TopDownBoard {...props} /> : <IsometricBoard {...props} />;
}

function TopDownBoard({
  map,
  units,
  showGrid,
  mode,
  selectedUnitId,
  activeUnitId,
  reachable,
  targetable,
  areaCells,
  pendingMove,
  fog,
  effect,
  onCellClick,
  onCellHover,
  onUnitClick,
  zoom,
  measureStart,
  measureTip,
  measureLabel,
  isUnitHidden,
  pathCells,
}: BattleBoardProps) {
  const cells = Array.from({ length: map.cols * map.rows }, (_, index) => ({
    x: index % map.cols,
    y: Math.floor(index / map.cols),
  }));

  return (
    <motion.div
      className="board-2d"
      animate={{ scale: zoom }}
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
      style={{ aspectRatio: `${map.cols}/${map.rows}` }}
    >
      <img src={map.image} alt={map.name} draggable={false} />
      <div
        className={`board-square-grid ${showGrid || mode !== "select" ? "visible" : ""}`}
        style={{ gridTemplateColumns: `repeat(${map.cols}, 1fr)`, gridTemplateRows: `repeat(${map.rows}, 1fr)` }}
      >
        {cells.map(({ x, y }) => {
          const key = cellKey(x, y);
          const terrain = getCell(map, x, y);
          return (
            <button
              key={key}
              className={`${cellClasses(key, mode, reachable, targetable, areaCells, pendingMove, fog)}${pathCells?.has(key) ? " on-path" : ""}`}
              style={mode === "terrain" ? { background: terrainColor[terrain.type] } : undefined}
              onMouseEnter={() => onCellHover?.(x, y)}
              onClick={() => onCellClick(x, y)}
            />
          );
        })}
      </div>

      {measureStart && measureTip && <>
        <svg className="mesa-measure-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1={((measureStart.x + .5) / map.cols) * 100} y1={((measureStart.y + .5) / map.rows) * 100} x2={((measureTip.x + .5) / map.cols) * 100} y2={((measureTip.y + .5) / map.rows) * 100} vectorEffect="non-scaling-stroke"/>
          <circle cx={((measureStart.x + .5) / map.cols) * 100} cy={((measureStart.y + .5) / map.rows) * 100} r=".7" vectorEffect="non-scaling-stroke"/>
          <circle cx={((measureTip.x + .5) / map.cols) * 100} cy={((measureTip.y + .5) / map.rows) * 100} r=".7" vectorEffect="non-scaling-stroke"/>
        </svg>
        <div className="mesa-measure-tag" style={{ left: `${((measureTip.x + .5) / map.cols) * 100}%`, top: `${((measureTip.y + .5) / map.rows) * 100}%` }}>{measureLabel}</div>
      </>}

      <AnimatePresence>
        {units.map((unit) => {
          if (isUnitHidden?.(unit)) return null;
          return (
            <motion.button
              key={unit.id}
              className={`token-2d ${unit.side} ${selectedUnitId === unit.id ? "selected" : ""} ${unit.defeated ? "defeated" : ""}`}
              initial={{ opacity: 0, scale: .4 }}
              animate={{
                opacity: unit.defeated ? .45 : 1,
                scale: activeUnitId === unit.id ? [1, 1.08, 1] : 1,
                left: `${((unit.x + .5) / map.cols) * 100}%`,
                top: `${((unit.y + .5) / map.rows) * 100}%`,
              }}
              transition={activeUnitId === unit.id ? { scale: { repeat: Infinity, duration: 1.6 } } : undefined}
              onClick={(event) => { event.stopPropagation(); onUnitClick(unit); }}
            >
              <span className="token-ring" style={{ "--unit": unit.accent } as CSSProperties}>
                {unit.portrait ? <img src={unit.portrait} alt="" /> : <b>{unit.symbol}</b>}
              </span>
              {activeUnitId === unit.id && <i className="active-chevron" />}
              <small>{unit.name.split(" ")[0]}</small>
              <em><i style={{ width: `${Math.max(0, unit.pv / unit.pvMax) * 100}%` }} /></em>
            </motion.button>
          );
        })}
      </AnimatePresence>
      {effect && <EffectBurst effect={effect} map={map} view="2d" />}
    </motion.div>
  );
}

function IsometricBoard({
  map,
  units,
  view,
  rotation,
  zoom,
  showGrid,
  mode,
  selectedUnitId,
  activeUnitId,
  reachable,
  targetable,
  areaCells,
  pendingMove,
  fog,
  effect,
  onCellClick,
  onUnitClick,
}: BattleBoardProps) {
  const step = ((rotation / 90) % 4 + 4) % 4;
  // Projecao isometrica vinda de tactics/iso-layout.ts (antes orfao): escala
  // pelo tamanho do mapa e respeita map.isoGrid / map.isoImage, em vez dos
  // valores fixos 52/27/500/112/15 que estavam aqui.
  const { tileW, tileH, originX, originY, elevationStep } = isoLayout(map, step);
  const cells = Array.from({ length: map.cols * map.rows }, (_, index) => ({
    x: index % map.cols,
    y: Math.floor(index / map.cols),
  })).sort((a, b) => {
    const ar = rotateCell(a.x, a.y, map.cols, map.rows, step);
    const br = rotateCell(b.x, b.y, map.cols, map.rows, step);
    return ar.x + ar.y - (br.x + br.y);
  });

  function project(x: number, y: number) {
    const rotated = rotateCell(x, y, map.cols, map.rows, step);
    const cell = getCell(map, x, y);
    return {
      x: originX + (rotated.x - rotated.y) * tileW / 2,
      y: originY + (rotated.x + rotated.y) * tileH / 2 - cell.elevation * elevationStep,
      elevation: cell.elevation,
    };
  }

  return (
    <motion.div
      className={`board-iso ${view}`}
      animate={{ scale: zoom }}
      transition={{ type: "spring", stiffness: 110, damping: 24 }}
    >
      <IsometricMapCanvas map={map} rotation={rotation} />
      <svg viewBox="0 0 1000 700" role="img" aria-label={`${map.name}, modo ${view}`}>
        <defs>
          <filter id="glow-blue"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-red"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {cells.map(({ x, y }) => {
          const key = cellKey(x, y);
          const p = project(x, y);
          const terrain = getCell(map, x, y);
          const top = diamondPoints(p.x, p.y, tileW, tileH);
          const className = cellClasses(key, mode, reachable, targetable, areaCells, pendingMove, fog);
          const highlighted = reachable.has(key) || targetable.has(key) || areaCells.has(key) || pendingMove === key;
          const topFill = fog.has(key)
            ? "rgba(3,4,5,.94)"
            : areaCells.has(key)
              ? "rgba(255,143,45,.62)"
              : pendingMove === key
                ? "rgba(255,222,105,.68)"
                : reachable.has(key)
                  ? "rgba(42,151,225,.56)"
                  : targetable.has(key)
                    ? "rgba(210,49,55,.46)"
                    : mode === "terrain"
                      ? terrainColor[terrain.type]
                      : "rgba(255,255,255,.015)";
          return (
            <g key={key} className={className} onClick={() => onCellClick(x, y)} style={{ cursor: mode === "select" ? "default" : "pointer" }}>
              <polygon
                points={top}
                fill={topFill}
                stroke={showGrid || mode !== "select" || highlighted ? highlightStroke(key, reachable, targetable, areaCells, pendingMove, fog) : "rgba(var(--mxr-218-202-170),.1)"}
                strokeWidth={highlighted ? 2 : 1}
                filter={reachable.has(key) ? "url(#glow-blue)" : targetable.has(key) ? "url(#glow-red)" : undefined}
              />
            </g>
          );
        })}

        {units
          .filter((unit) => !(fog.has(cellKey(unit.x, unit.y)) && unit.side === "threats"))
          .sort((a, b) => {
            const ar = rotateCell(a.x, a.y, map.cols, map.rows, step);
            const br = rotateCell(b.x, b.y, map.cols, map.rows, step);
            return ar.x + ar.y - (br.x + br.y);
          })
          .map((unit) => {
            const p = project(unit.x, unit.y);
            const active = activeUnitId === unit.id;
            const selected = selectedUnitId === unit.id;
            return (
              <g
                key={unit.id}
                className={`iso-unit ${unit.side} ${selected ? "selected" : ""} ${unit.defeated ? "defeated" : ""}`}
                onClick={(event) => { event.stopPropagation(); onUnitClick(unit); }}
                style={{ cursor: "pointer" }}
              >
                <ellipse cx={p.x} cy={p.y + 7} rx="17" ry="6" fill={unit.side === "heroes" ? "rgba(38,126,191,.38)" : "rgba(175,39,47,.4)"} stroke={selected ? "#ffe17b" : unit.side === "heroes" ? "#65c5ff" : "#ff7272"} strokeWidth={selected ? 2.5 : 1.2} />
                {active && <motion.path d={`M ${p.x - 9} ${p.y - 91} L ${p.x + 9} ${p.y - 91} L ${p.x} ${p.y - 78} Z`} fill="#ffe778" filter="url(#glow-blue)" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} />}
                <ArtworkSprite unit={unit} x={p.x} y={p.y} selected={selected} />
                <g transform={`translate(${p.x - 31} ${p.y + 14})`}>
                  <rect width="64" height="15" rx="3" fill="rgba(8,8,9,.9)" stroke={unit.side === "heroes" ? "#386d93" : "#8c3338"} />
                  <text x="32" y="9" fill="var(--mx-f5ecdd)" textAnchor="middle" fontSize="7" fontWeight="800">{unit.name.split(" ")[0]}</text>
                  <rect x="4" y="11" width="56" height="2" fill="#371316" />
                  <rect x="4" y="11" width={56 * Math.max(0, unit.pv / unit.pvMax)} height="2" fill="#d74345" />
                </g>
              </g>
            );
          })}

        {effect && <IsoEffect effect={effect} project={project} />}
      </svg>
    </motion.div>
  );
}

function ArtworkSprite({ unit, x, y, selected }: { unit: TacticalUnitView; x: number; y: number; selected: boolean }) {
  const clipId = `sprite-clip-${unit.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const artwork = unit.sprite || unit.portrait;
  const stroke = selected ? "#ffe47d" : unit.side === "heroes" ? "#72bfe8" : "#df6468";

  if (!artwork) {
    return <g><circle cx={x} cy={y - 34} r="23" fill={unit.accent} stroke={stroke} strokeWidth="2"/><text x={x} y={y - 29} textAnchor="middle" fill="white" fontSize="12" fontWeight="900">{unit.symbol}</text></g>;
  }

  return (
    <g className={`artwork-sprite ${selected ? "selected" : ""}`}>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={`M ${x - 22} ${y - 78} Q ${x} ${y - 88} ${x + 22} ${y - 78} L ${x + 29} ${y - 40} Q ${x + 25} ${y - 7} ${x + 13} ${y + 3} L ${x - 13} ${y + 3} Q ${x - 25} ${y - 7} ${x - 29} ${y - 40} Z`} />
        </clipPath>
      </defs>
      <path d={`M ${x - 23} ${y - 79} Q ${x} ${y - 90} ${x + 23} ${y - 79} L ${x + 30} ${y - 40} Q ${x + 26} ${y - 6} ${x + 13} ${y + 4} L ${x - 13} ${y + 4} Q ${x - 26} ${y - 6} ${x - 30} ${y - 40} Z`} fill="#0d1014" stroke={stroke} strokeWidth={selected ? 2.5 : 1.4} opacity=".98" />
      <image className="sprite-art-image" href={artwork} x={x - 32} y={y - 84} width="64" height="88" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
      <path d={`M ${x - 13} ${y + 3} Q ${x} ${y + 8} ${x + 13} ${y + 3}`} fill="none" stroke={stroke} strokeWidth="1.5" opacity=".8" />
    </g>
  );
}

function rotateCell(x: number, y: number, cols: number, rows: number, step: number) {
  if (step === 1) return { x: rows - 1 - y, y: x };
  if (step === 2) return { x: cols - 1 - x, y: rows - 1 - y };
  if (step === 3) return { x: y, y: cols - 1 - x };
  return { x, y };
}

function diamondPoints(cx: number, cy: number, width: number, height: number) {
  return `${cx},${cy - height / 2} ${cx + width / 2},${cy} ${cx},${cy + height / 2} ${cx - width / 2},${cy}`;
}

function cellClasses(
  key: string,
  mode: ActionMode,
  reachable: Set<string>,
  targetable: Set<string>,
  areaCells: Set<string>,
  pendingMove: string | null,
  fog: Set<string>,
) {
  return [
    "board-cell",
    reachable.has(key) ? "reachable" : "",
    targetable.has(key) ? "targetable" : "",
    areaCells.has(key) ? "in-area" : "",
    pendingMove === key ? "pending" : "",
    fog.has(key) ? "fogged" : "",
    mode,
  ].filter(Boolean).join(" ");
}

function highlightStroke(key: string, reachable: Set<string>, targetable: Set<string>, areaCells: Set<string>, pendingMove: string | null, fog: Set<string>) {
  if (fog.has(key)) return "rgba(8,8,9,.95)";
  if (pendingMove === key) return "#fff3a0";
  if (areaCells.has(key)) return "#ffc663";
  if (reachable.has(key)) return "#75d1ff";
  if (targetable.has(key)) return "#ff7b7b";
  return "rgba(var(--mxr-224-207-172),.18)";
}

function EffectBurst({ effect, map }: { effect: BoardEffect; map: BattleMap; view: "2d" }) {
  return (
    <motion.div
      key={effect.id}
      className={`board-effect ${effect.type}`}
      style={{ left: `${((effect.x + .5) / map.cols) * 100}%`, top: `${((effect.y + .5) / map.rows) * 100}%` }}
      initial={{ scale: .2, opacity: 0 }}
      animate={{ scale: [0.2, 1.6, 1], opacity: [0, 1, 0] }}
      transition={{ duration: .85 }}
    ><span>{effect.label}</span></motion.div>
  );
}

function IsoEffect({ effect, project }: { effect: BoardEffect; project: (x: number, y: number) => { x: number; y: number } }) {
  const p = project(effect.x, effect.y);
  const color = effect.type === "heal" ? "#72f0a4" : effect.type === "arcane" ? "#86c7ff" : effect.type === "fire" ? "#ff733d" : "#ffe28a";
  return (
    <motion.g key={effect.id} initial={{ opacity: 0, scale: .2 }} animate={{ opacity: [0, 1, 0], scale: [0.2, 1.5, 1] }} transition={{ duration: .9 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
      <circle cx={p.x} cy={p.y - 20} r="34" fill={`${color}44`} stroke={color} strokeWidth="3" />
      <path d={`M ${p.x} ${p.y - 70} L ${p.x + 14} ${p.y - 34} L ${p.x - 16} ${p.y - 42} Z`} fill={color} opacity=".85" />
      <text x={p.x} y={p.y - 80} textAnchor="middle" fill={color} fontSize="15" fontWeight="900">{effect.label}</text>
    </motion.g>
  );
}