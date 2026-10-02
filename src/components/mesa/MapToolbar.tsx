import type { LucideIcon } from "lucide-react";
import { Grid3X3, Maximize2, Redo2, SlidersHorizontal, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { TERRAIN_LABEL, type TerrainBrush } from "../../game/mapTools";
import { TRIGGER_CONDITIONS } from "../../game/triggers";
import { SHAPE_LABEL, type ShapeKind } from "../../game/shapes";

export interface MapToolItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface Props<T extends string> {
  tools: Array<MapToolItem<T>>;
  activeTool: T;
  onSelectTool: (id: T) => void;
  /** O catálogo de ferramentas é revelado sob demanda para não cobrir a cena. */
  toolsOpen: boolean;
  onToggleTools: () => void;
  hint: string;
  showGrid: boolean;
  onToggleGrid: () => void;
  brush?: { mode: "add" | "erase"; onChange: (mode: "add" | "erase") => void };
  terrain?: { value: TerrainBrush; onChange: (brush: TerrainBrush) => void };
  trigger?: { condition: string; mode: "once" | "continuous"; onChange: (next: { condition: string; mode: "once" | "continuous" }) => void };
  shape?: { kind: ShapeKind; onChange: (kind: ShapeKind) => void; armed: boolean };
  history?: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void };
  door?: { name: string; open: boolean; locked: boolean; onAction: (action: "open" | "close" | "lock" | "unlock" | "dismiss") => void };
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/**
 * Barra horizontal de ferramentas sobre o mapa.
 *
 * Antes estas 12 ferramentas dividiam a coluna da esquerda com os 9 painéis
 * globais: 21 itens em uma coluna de ~640px, o que cortava os últimos. As
 * referências colocam os controles de tabuleiro em cima do mapa — é o que
 * fazemos aqui, mantendo exatamente as mesmas ações de antes.
 */
export default function MapToolbar<T extends string>({
  tools, activeTool, onSelectTool, toolsOpen, onToggleTools, hint, showGrid, onToggleGrid, brush, terrain, trigger, shape, door, history, zoom, onZoomIn, onZoomOut, onFit,
}: Props<T>) {
  return (
    <div className="mesa-map-toolbar">



      <div className="mesa-toolbar-group mesa-toolbar-launcher" role="toolbar" aria-label="Ferramentas do mapa">
        <button
          className={`mesa-tools-trigger ${toolsOpen ? "active" : ""}`}
          onClick={onToggleTools}
          title="Ferramentas do mapa"
          aria-label="Ferramentas do mapa"
          aria-expanded={toolsOpen}
          aria-controls="mesa-tool-menu"
        ><SlidersHorizontal/></button>
        {toolsOpen && <div id="mesa-tool-menu" className="mesa-tool-menu" role="menu" aria-label="Escolher ferramenta">
          <p><strong>Ferramentas da cena</strong><small>{hint}</small></p>
          <div>
            {tools.map((tool) => {
              const Icon = tool.icon;
              return <button
                key={tool.id}
                className={activeTool === tool.id ? "active" : ""}
                disabled={tool.disabled}
                onClick={() => onSelectTool(tool.id)}
                title={tool.disabled ? `${tool.label} — somente Mestre` : tool.label}
                aria-label={tool.label}
                aria-pressed={activeTool === tool.id}
                role="menuitem"
              ><Icon/><span>{tool.label}</span>{tool.disabled && <em>Mestre</em>}</button>;
            })}
          </div>
        </div>}
        <button className={showGrid ? "active" : ""} onClick={onToggleGrid} title="Mostrar / ocultar grade" aria-label="Mostrar / ocultar grade" aria-pressed={showGrid}><Grid3X3/></button>
        {history && <>
          <button onClick={history.onUndo} disabled={!history.canUndo} title="Desfazer (Ctrl+Z)" aria-label="Desfazer"><Undo2/></button>
          <button onClick={history.onRedo} disabled={!history.canRedo} title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer"><Redo2/></button>
        </>}
      </div>

      {/* Estado da ferramenta só aparece enquanto o submenu está aberto ou há
          uma configuração secundária a fazer. A cena não começa coberta por
          uma faixa de instruções. */}
      {(toolsOpen || shape || trigger || terrain || brush || door) && <p className="mesa-toolbar-hint">
        <strong>{tools.find((t) => t.id === activeTool)?.label ?? "Selecionar"}</strong>
        <small>{hint}</small>
      </p>}

      {/* LINHA DE CONTEXTO — contrato §1/§9/§11: a ferramenta abre apenas o que
          ela precisa, em linha propria, e recolhe ao sair. Nunca 15 controles
          permanentes disputando espaco com os icones. */}
      {(shape || trigger || terrain || brush || door) && <div className="mesa-toolbar-context">
        {shape && <div className="mesa-shape-palette" role="group" aria-label="Forma da área">
        {(Object.keys(SHAPE_LABEL) as ShapeKind[]).map((kind) => (
          <button key={kind} className={shape.kind === kind ? "active" : ""} onClick={() => shape.onChange(kind)}>{SHAPE_LABEL[kind]}</button>
        ))}
        {shape.armed && <em className="mesa-shape-hint">clique no 2º ponto</em>}
      </div>}
        {trigger && <div className="mesa-trigger-config" role="group" aria-label="Configuração do gatilho">
        <select value={trigger.condition} onChange={(event) => trigger.onChange({ ...trigger, condition: event.target.value })} aria-label="Condição do gatilho">
          {TRIGGER_CONDITIONS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
        </select>
        <button className={trigger.mode === "once" ? "active" : ""} onClick={() => trigger.onChange({ ...trigger, mode: "once" })} title="Dispara uma vez (armadilha)">Uma vez</button>
        <button className={trigger.mode === "continuous" ? "active" : ""} onClick={() => trigger.onChange({ ...trigger, mode: "continuous" })} title="Aplica enquanto estiver dentro">Contínuo</button>
      </div>}
        {terrain && <div className="mesa-terrain-palette" role="group" aria-label="Tipo de terreno">
        {(Object.keys(TERRAIN_LABEL) as Array<keyof typeof TERRAIN_LABEL>).filter((key) => key !== "normal").map((key) => (
          <button key={key} className={`terrain-${key} ${terrain.value.type === key ? "active" : ""}`}
            onClick={() => terrain.onChange({ ...terrain.value, type: key })}>{TERRAIN_LABEL[key]}</button>
        ))}
        <label className="mesa-terrain-elev">Altura
          <input type="number" min={0} max={9} value={terrain.value.elevation}
            onChange={(event) => terrain.onChange({ ...terrain.value, elevation: Number(event.target.value) })}/>
        </label>
      </div>}
        {brush && <div className="mesa-brush-toggle">
          <button className={brush.mode === "add" ? "active" : ""} onClick={() => brush.onChange("add")}>Adicionar</button>
          <button className={brush.mode === "erase" ? "active" : ""} onClick={() => brush.onChange("erase")}>Apagar</button>
        </div>}
        {door && <div className="mesa-door-actions" role="group" aria-label="Estado da porta">
          <span className="mesa-context-tag">{door.name}</span>
          <button onClick={() => door.onAction("open")} disabled={door.open || door.locked}>Abrir</button>
          <button onClick={() => door.onAction("close")} disabled={!door.open}>Fechar</button>
          <button onClick={() => door.onAction("lock")} disabled={door.locked}>Trancar</button>
          <button onClick={() => door.onAction("unlock")} disabled={!door.locked}>Destrancar</button>
          <button className="dismiss" onClick={() => door.onAction("dismiss")} aria-label="Fechar submenu">×</button>
        </div>}
      </div>}




      <div className="mesa-toolbar-group mesa-toolbar-zoom">
        <button onClick={onZoomOut} title="Diminuir zoom" aria-label="Diminuir zoom"><ZoomOut/></button>
        <b>{Math.round(zoom * 100)}%</b>
        <button onClick={onZoomIn} title="Aumentar zoom" aria-label="Aumentar zoom"><ZoomIn/></button>
        <button onClick={onFit} title="Ajustar mapa à tela" aria-label="Ajustar mapa à tela"><Maximize2/></button>
      </div>
    </div>
  );
}
