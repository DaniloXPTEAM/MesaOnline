/**
 * CAMADA ÚNICA DE FERRAMENTAS DE MAPA.
 *
 * Exploração (`ArmadaNextTable`) e combate (`TacticsWorkspace`) compartilham
 * ESTE módulo: mesma lista de ferramentas, mesmos handlers, mesmo estado.
 *
 * Antes, as ferramentas viviam dentro do `ArmadaNextTable`. Ao entrar em
 * combate, 11 das 16 desapareciam — régua, ping, luz, paredes, portas, áreas,
 * gatilhos, objetos, mover token, mover câmera e enquadrar. Nem o VTT antigo
 * nem o V3 perdem capacidade durante o combate: lá o tabuleiro é um só.
 *
 * Regra: NÃO criar `measureExploration`/`measureCombat`, NÃO duplicar a
 * toolbar, NÃO manter dois tool systems. O combate é um ESTADO da mesma Mesa.
 */
import { Move,
  BrickWall, CloudFog, DoorOpen, Footprints, Hand, Lightbulb,
  MousePointer2, Mountain, PackageOpen, Ruler, Shapes, Sparkles, Target, type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BoardLight, BoardObject, BoardState, TerrainType } from "./types";
import { removeWall, setFog, setObjects, setShapes, setTerrain, upsertLight } from "./vttBridge";
import { createBoardBarrier, toggleBarrier } from "../tactics/engine/boardTools";
import type { Cell } from "./distance";
import { type ShapeKind, shapeCells } from "./shapes";
import { metersToCells } from "./distance";
import { TRIGGER_CONDITIONS, type TriggerConfig } from "./triggers";
import { activeFloor, floorOf } from "./floors";

export type MapToolId =
  | "select" | "move" | "pan" | "measure" | "fog" | "light"
  | "wall" | "door" | "shape" | "trigger" | "ping" | "object" | "terrain" | "align";

export type BrushMode = "add" | "erase";

export interface MapToolDef {
  id: MapToolId;
  label: string;
  icon: LucideIcon;
}

/** Fonte única da lista de ferramentas — as duas telas leem daqui. */
export const MAP_TOOLS: MapToolDef[] = [
  { id: "select", label: "Selecionar", icon: MousePointer2 },
  { id: "move", label: "Mover token", icon: Footprints },
  { id: "pan", label: "Mover câmera", icon: Hand },
  { id: "measure", label: "Régua / medir", icon: Ruler },
  { id: "fog", label: "Fog / visão", icon: CloudFog },
  { id: "light", label: "Luz", icon: Lightbulb },
  { id: "wall", label: "Paredes", icon: BrickWall },
  { id: "door", label: "Portas", icon: DoorOpen },
  { id: "shape", label: "Áreas", icon: Shapes },
  { id: "trigger", label: "Gatilhos", icon: Sparkles },
  { id: "ping", label: "Sinalizar", icon: Target },
  { id: "object", label: "Objetos", icon: PackageOpen },
  { id: "terrain", label: "Terreno e elevação", icon: Mountain },
  { id: "align", label: "Alinhar mapa", icon: Move },
];

/** Ferramentas cujo pincel aceita adicionar/apagar. */
export const BRUSH_TOOLS: MapToolId[] = ["fog", "wall", "door", "shape", "trigger", "terrain"];

/** Ferramentas liberadas para jogador (não-Mestre). */
export const PLAYER_TOOLS: MapToolId[] = ["select", "move", "pan", "measure", "ping"];

/** Ferramentas que fazem sentido durante o combate tático. */
export const COMBAT_TOOLS: MapToolId[] = [
  "select", "measure", "fog", "light", "wall", "door", "shape", "trigger", "ping", "object", "terrain",
];

export function toolHint(tool: MapToolId): string {
  return ({
    select: "Clique em um token para abrir seu contexto.",
    move: "Selecione uma célula alcançável.",
    pan: "Arraste para mover a câmera.",
    measure: "Marque dois pontos no mapa.",
    fog: "Pinte ou revele o fog da cena.",
    trigger: "Posicione gatilhos de cena.",
    wall: "Crie segmentos em BOARD.walls.",
    door: "Crie, abra ou feche portas.",
    light: "Acenda fontes de luz.",
    shape: "Marque áreas de efeito.",
    ping: "Sinalize uma posição para a mesa.",
    object: "Posicione um objeto na cena.",
    terrain: "Pinte o tipo de terreno; o movimento recalcula o custo.",
    align: "Arraste a imagem até a grade coincidir e solte; a posição fica fixa para todos.",
  } as Record<MapToolId, string>)[tool];
}

/** Barreira ancorada na celula (mesma regra usada pela exploracao). */
export function barrierAt(board: BoardState, x: number, y: number) {
  const floor = activeFloor(board);
  return board.walls.find((wall) => floorOf(wall) === floor && Math.round(wall.x1) === x && Math.round(wall.y1) === y);
}

/** Luzes prontas para colocar no mapa (raio em metros). Tocha, lanterna e fogueira vêm do legado (`contextLuz`: 6, 9 e 12 m). */
export const LIGHT_PRESETS = {
  torch: { name: "Tocha", radius: 6, color: "#ffb765", intensity: 0.65 },
  lantern: { name: "Lanterna", radius: 9, color: "#ffe2a8", intensity: 0.7 },
  campfire: { name: "Fogueira", radius: 12, color: "#ff8a3d", intensity: 0.8 },
  magic: { name: "Luz mágica", radius: 9, color: "#8fd4ff", intensity: 0.7 },
} as const;
export type LightPreset = keyof typeof LIGHT_PRESETS;

export function defaultLight(x: number, y: number, floor = 0, preset: LightPreset = "torch"): BoardLight {
  const base = LIGHT_PRESETS[preset];
  return {
    id: `light-${crypto.randomUUID()}`, x, y, floor, radius: base.radius, intensity: base.intensity,
    color: base.color, type: preset, name: base.name, enabled: true,
  };
}

export interface ApplyToolContext {
  board: BoardState;
  tool: MapToolId;
  brushMode: BrushMode;
  x: number;
  y: number;
  /** callback opcional para quem quiser reagir à criação de um objeto */
  onObjectCreated?: (id: string) => void;
  /** callback opcional para devolver a ferramenta a "select" */
  onDone?: () => void;
  terrainBrush?: TerrainBrush;
  /** tipo de luz que a ferramenta Luz coloca (tocha, lanterna, fogueira, mágica) */
  lightPreset?: LightPreset;
  triggerConfig?: TriggerConfig;
  shapeKind?: ShapeKind;
  shapeAnchor?: Cell | null;
  /** tamanho da área em metros (círculo: raio; cone e linha: comprimento). Ausente = pelo segundo clique */
  shapeSizeM?: number;
  onShapeAnchor?: (cell: Cell | null) => void;
}

/**
 * Geometria de uma área de efeito (círculo, cone, linha, retângulo) a partir do ponto de origem e do ponto apontado.
 * Com tamanho em metros, o círculo vale já no primeiro clique e cone/linha usam só a direção do segundo.
 */
export function areaGeometry(kind: ShapeKind, origin: Cell, pointed: Cell, sizeM?: number): { kind: ShapeKind; origin: Cell; to?: Cell; sizeM?: number } {
  if (kind === "circle" && sizeM) return { kind, origin, sizeM };
  if ((kind === "cone" || kind === "line") && sizeM) {
    const length = Math.max(1, Math.round(metersToCells(sizeM)));
    const dx = pointed.x - origin.x, dy = pointed.y - origin.y;
    const norm = Math.hypot(dx, dy) || 1;
    const to = { x: Math.max(0, Math.round(origin.x + (dx / norm) * length)), y: Math.max(0, Math.round(origin.y + (dy / norm) * length)) };
    return { kind, origin, to, sizeM };
  }
  return { kind, origin, to: pointed };
}

/** Pré-visualização: células da área enquanto o mouse passa pelo mapa. */
export function previewAreaCells(kind: ShapeKind, anchor: Cell | null, hover: Cell, sizeM?: number): string[] {
  if (kind === "cells") return [];
  if (kind === "circle" && sizeM) return shapeCells(areaGeometry(kind, hover, hover, sizeM));
  if (!anchor) return [];
  return shapeCells(areaGeometry(kind, anchor, hover, sizeM));
}

/**
 * Executa a ferramenta sobre o BOARD oficial.
 * Devolve `true` se a ferramenta consumiu o clique.
 *
 * NÃO trata `measure`, `move`, `select` nem `pan`: esses dependem de estado de
 * UI (ver `useMapTools`) ou de regras específicas de cada tela.
 */
export function applyMapTool(context: ApplyToolContext): boolean {
  const { board, tool, brushMode, x, y } = context;
  const key = `${x},${y}`;

  if (tool === "fog") {
    const next = new Set(board.fog);
    if (brushMode === "add") next.add(key); else next.delete(key);
    setFog(next);
    return true;
  }

  if (tool === "wall" || tool === "door") {
    const existing = barrierAt(board, x, y);
    if (existing) {
      if (existing.type === "door" && brushMode === "add") toggleBarrier(existing.id);
      else removeWall(existing.id);
    } else if (brushMode === "add") {
      createBoardBarrier(tool, { x, y }, { x: x + 1, y });
    }
    return true;
  }

  if (tool === "light") {
    const existing = board.lights.find((light) => light.x === x && light.y === y);
    if (existing) upsertLight({ ...existing, enabled: !existing.enabled });
    else upsertLight(defaultLight(x, y, activeFloor(board), context.lightPreset));
    return true;
  }

  if (tool === "shape" && context.shapeKind && context.shapeKind !== "cells") {
    // formas geometricas: 1o clique ancora, 2o fecha
    const sized = context.shapeKind === "circle" && Boolean(context.shapeSizeM);
    if (!sized && !context.shapeAnchor) { context.onShapeAnchor?.({ x, y }); return true; }
    const geometry = areaGeometry(context.shapeKind, sized ? { x, y } : context.shapeAnchor as Cell, { x, y }, context.shapeSizeM);
    const cells = shapeCells(geometry);
    setShapes([...board.shapes, {
      id: `area-${crypto.randomUUID()}`, floor: activeFloor(board), kind: "area", cells, geometry, color: "#d69242",
    }]);
    context.onShapeAnchor?.(null);
    return true;
  }

  if (tool === "shape" || tool === "trigger") {
    const kind = tool === "shape" ? "area" : "trigger";
    const current = board.shapes.find((shape) => floorOf(shape) === activeFloor(board) && shape.kind === kind && shape.cells.includes(key));
    if (current) setShapes(board.shapes.filter((shape) => shape.id !== current.id));
    else setShapes([...board.shapes, {
      id: `${kind}-${crypto.randomUUID()}`, floor: activeFloor(board), kind, cells: [key],
      color: kind === "area" ? "#d69242" : "#9a4c77",
      ...(kind === "trigger" && context.triggerConfig
        ? { trigger: { mode: context.triggerConfig.mode, condition: context.triggerConfig.effect ? "" : context.triggerConfig.condition, ...(context.triggerConfig.effect ? { effect: context.triggerConfig.effect } : {}) } }
        : {}),
    }]);
    return true;
  }

  if (tool === "terrain") {
    const brush = context.terrainBrush || { type: "difficult" as TerrainType, elevation: 0 };
    const atual = board.map.terrain[key];
    const apagar = brushMode === "erase" || (atual?.type === brush.type && (atual?.elevation || 0) === brush.elevation);
    setTerrain([key], apagar ? "normal" : brush.type, apagar ? 0 : brush.elevation);
    return true;
  }

  if (tool === "object") {
    const object: BoardObject = {
      id: `object-${crypto.randomUUID()}`, floor: activeFloor(board), kind: "chest", name: "Baú",
      x, y, opened: false, locked: false, contents: [],
    };
    setObjects([...board.objects, object]);
    context.onObjectCreated?.(object.id);
    context.onDone?.();
    return true;
  }

  return false;
}

export interface TerrainBrush {
  type: TerrainType;
  elevation: number;
}

export const TERRAIN_LABEL: Record<TerrainType, string> = {
  normal: "Normal",
  difficult: "Difícil",
  blocked: "Bloqueado",
  elevated: "Elevado",
  cover: "Cobertura",
};

export interface MapToolsState {
  tool: MapToolId;
  setTool: (tool: MapToolId) => void;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  measureStart: Cell | null;
  measureEnd: Cell | null;
  measureTip: Cell | null;
  setMeasureHover: (cell: Cell | null) => void;
  /** trata o clique de régua; devolve true se consumiu */
  handleMeasureClick: (x: number, y: number) => boolean;
  clearMeasure: () => void;
  ping: { x: number; y: number; id: string } | null;
  firePing: (x: number, y: number) => void;
  terrainBrush: TerrainBrush;
  setTerrainBrush: (brush: TerrainBrush) => void;
  triggerConfig: TriggerConfig;
  setTriggerConfig: (next: TriggerConfig) => void;
  shapeKind: ShapeKind;
  setShapeKind: (kind: ShapeKind) => void;
  shapeAnchor: Cell | null;
  setShapeAnchor: (cell: Cell | null) => void;
}

/**
 * Estado compartilhado das ferramentas. Cada tela instancia o hook, mas o
 * comportamento (régua, pincel, ping, ESC) vem daqui — não é reimplementado.
 */
export function useMapTools(initial: MapToolId = "select"): MapToolsState {
  const [tool, setToolState] = useState<MapToolId>(initial);
  const [brushMode, setBrushMode] = useState<BrushMode>("add");
  const [measureStart, setMeasureStart] = useState<Cell | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Cell | null>(null);
  const [measureHover, setMeasureHover] = useState<Cell | null>(null);
  const [ping, setPing] = useState<{ x: number; y: number; id: string } | null>(null);
  const [terrainBrush, setTerrainBrush] = useState<TerrainBrush>({ type: "difficult", elevation: 0 });
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({ condition: TRIGGER_CONDITIONS[0], mode: "once" });
  const [shapeKind, setShapeKind] = useState<ShapeKind>("cells");
  const [shapeAnchor, setShapeAnchor] = useState<Cell | null>(null);

  const clearMeasure = useCallback(() => {
    setMeasureStart(null); setMeasureEnd(null); setMeasureHover(null);
  }, []);

  const setTool = useCallback((next: MapToolId) => {
    setToolState(next);
    if (next !== "measure") clearMeasure();
  }, [clearMeasure]);

  const handleMeasureClick = useCallback((x: number, y: number) => {
    if (!measureStart || measureEnd) { setMeasureStart({ x, y }); setMeasureEnd(null); }
    else setMeasureEnd({ x, y });
    return true;
  }, [measureStart, measureEnd]);

  const firePing = useCallback((x: number, y: number) => {
    setPing({ x, y, id: crypto.randomUUID() });
    window.setTimeout(() => setPing(null), 1600);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (tool === "measure" && (measureStart || measureEnd)) { clearMeasure(); return; }
      if (tool !== "select") setTool("select");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, measureStart, measureEnd, clearMeasure, setTool]);

  const measureTip = useMemo(
    () => measureEnd || (tool === "measure" ? measureHover : null),
    [measureEnd, measureHover, tool],
  );

  return {
    tool, setTool, brushMode, setBrushMode,
    measureStart, measureEnd, measureTip, setMeasureHover,
    handleMeasureClick, clearMeasure, ping, firePing, terrainBrush, setTerrainBrush, triggerConfig, setTriggerConfig,
    shapeKind, setShapeKind, shapeAnchor, setShapeAnchor,
  };
}
