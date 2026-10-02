import { ChevronDown, ChevronRight, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { loadMacros } from "../../game/macros";
import { loadPresets } from "../../game/jukeboxPresets";
import { SOUNDBOARD } from "../../game/jukebox";
import { TRIGGER_CONDITIONS, type ShapeTrigger, type TriggerEffect } from "../../game/triggers";
import type { BoardShape } from "../../game/types";
import { setShapes } from "../../game/vttBridge";

/**
 * Gatilhos da cena (gaveta Macros). Os gatilhos são marcados no mapa pela Ambientação; aqui o Mestre escolhe o que cada um
 * faz quando alguém pisa nele: aplicar uma condição, tocar música, tocar um efeito, escrever uma mensagem ou rolar uma macro.
 * As mudanças valem na hora.
 */
type Kind = "condition" | "track" | "sfx" | "message" | "macro";

const KIND_LABEL: Record<Kind, string> = {
  condition: "Aplicar condição", track: "Tocar música (Jukebox)", sfx: "Efeito sonoro", message: "Mensagem no chat", macro: "Rolar macro",
};

const kindOf = (trigger: ShapeTrigger): Kind => trigger.effect?.kind ?? "condition";

function summary(trigger: ShapeTrigger): string {
  const effect = trigger.effect;
  const what = !effect ? `aplica ${trigger.condition || "condição"}`
    : effect.kind === "track" ? `toca “${effect.title}”`
      : effect.kind === "sfx" ? `efeito ${effect.label || "sonoro"}`
        : effect.kind === "message" ? `mensagem: ${effect.text.slice(0, 40)}${effect.text.length > 40 ? "…" : ""}`
          : `rola ${effect.name}`;
  return `${what} · ${trigger.mode === "once" ? "uma vez" : "contínuo"}${trigger.triggered ? " · já disparou" : ""}`;
}

export default function TriggerList({ shapes, isPlayer }: { shapes: BoardShape[]; isPlayer: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const triggers = shapes.filter((shape) => shape.kind === "trigger" && shape.trigger);
  const macros = loadMacros();
  const presets = loadPresets().filter((preset) => preset.url);

  const update = (id: string, patch: Partial<ShapeTrigger>) => setShapes(shapes.map((shape) => (shape.id === id && shape.trigger ? { ...shape, trigger: { ...shape.trigger, ...patch } } : shape)));

  function changeKind(shape: BoardShape, kind: Kind) {
    const trigger = shape.trigger!;
    const effect: TriggerEffect | undefined = kind === "condition" ? undefined
      : kind === "track" ? { kind: "track", url: "", title: "Faixa" }
        : kind === "sfx" ? { kind: "sfx", url: SOUNDBOARD[0]?.url || "", label: SOUNDBOARD[0]?.label }
          : kind === "message" ? { kind: "message", text: "" }
            : { kind: "macro", name: macros[0]?.name || "", formula: macros[0]?.formula || "" };
    update(shape.id, { effect, condition: kind === "condition" ? (trigger.condition || TRIGGER_CONDITIONS[0]) : "" });
  }

  return <section className="mesa-block mesa-trigger-list">
    <h4><Sparkles/>Gatilhos da cena · {triggers.length}</h4>
    <p className="mesa-module-note">Marque as casas na gaveta Ambientação (botão Gatilhos). Aqui você escolhe o que cada gatilho faz.</p>
    {triggers.length === 0 && <p className="mesa-block-empty">Nenhum gatilho na cena.</p>}
    {triggers.map((shape, index) => {
      const trigger = shape.trigger!;
      const kind = kindOf(trigger);
      const effect = trigger.effect;
      const expanded = open === shape.id;
      return <div key={shape.id} className="mesa-trigger-item">
        <button className="mesa-trigger-head" onClick={() => setOpen(expanded ? null : shape.id)} aria-expanded={expanded}>
          {expanded ? <ChevronDown/> : <ChevronRight/>}
          <span><strong>Gatilho {index + 1} · {shape.cells.length} {shape.cells.length === 1 ? "casa" : "casas"}</strong><small>{summary(trigger)}</small></span>
        </button>
        {expanded && <div className="mesa-trigger-body">
          <label className="mesa-grid-select">Tipo de gatilho
            <select value={kind} disabled={isPlayer} onChange={(event) => changeKind(shape, event.target.value as Kind)}>
              {(Object.keys(KIND_LABEL) as Kind[]).map((entry) => <option key={entry} value={entry}>{KIND_LABEL[entry]}</option>)}
            </select>
          </label>
          {kind === "condition" && <label className="mesa-grid-select">Condição
            <select value={trigger.condition || TRIGGER_CONDITIONS[0]} disabled={isPlayer} onChange={(event) => update(shape.id, { condition: event.target.value })}>
              {TRIGGER_CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
            </select>
          </label>}
          {effect?.kind === "track" && <>
            {presets.length > 0 && <label className="mesa-grid-select">Faixa da lista do Jukebox
              <select value="" disabled={isPlayer} onChange={(event) => { const preset = presets[Number(event.target.value)]; if (preset) update(shape.id, { effect: { kind: "track", url: preset.url, title: preset.name || "Faixa" } }); }}>
                <option value="">Escolher…</option>
                {presets.map((preset, i) => <option key={`${preset.name}-${i}`} value={i}>{preset.name || preset.url}</option>)}
              </select>
            </label>}
            <label className="mesa-grid-select">Link da faixa (YouTube ou áudio)<input value={effect.url} disabled={isPlayer} placeholder="https://…" onChange={(event) => update(shape.id, { effect: { ...effect, url: event.target.value } })}/></label>
            <label className="mesa-grid-select">Nome do evento<input value={effect.title} disabled={isPlayer} maxLength={60} onChange={(event) => update(shape.id, { effect: { ...effect, title: event.target.value } })}/></label>
          </>}
          {effect?.kind === "sfx" && <label className="mesa-grid-select">Efeito
            <select value={effect.url} disabled={isPlayer} onChange={(event) => update(shape.id, { effect: { kind: "sfx", url: event.target.value, label: SOUNDBOARD.find((entry) => entry.url === event.target.value)?.label } })}>
              {SOUNDBOARD.map((entry) => <option key={entry.id} value={entry.url}>{entry.label}</option>)}
            </select>
          </label>}
          {effect?.kind === "message" && <label className="mesa-grid-select">Mensagem<input value={effect.text} disabled={isPlayer} maxLength={500} placeholder="Você ouve um rangido…" onChange={(event) => update(shape.id, { effect: { kind: "message", text: event.target.value } })}/></label>}
          {effect?.kind === "macro" && <label className="mesa-grid-select">Macro global
            <select value={effect.name} disabled={isPlayer} onChange={(event) => { const macro = macros.find((entry) => entry.name === event.target.value); if (macro) update(shape.id, { effect: { kind: "macro", name: macro.name, formula: macro.formula } }); }}>
              {macros.length === 0 && <option value="">Crie uma macro global primeiro</option>}
              {macros.map((macro) => <option key={macro.id} value={macro.name}>{macro.name} ({macro.formula})</option>)}
            </select>
          </label>}
          <div className="mesa-panel-actions">
            <button disabled={isPlayer} className={trigger.mode === "once" ? "active" : ""} onClick={() => update(shape.id, { mode: "once" })}>Uma vez</button>
            <button disabled={isPlayer} className={trigger.mode === "continuous" ? "active" : ""} onClick={() => update(shape.id, { mode: "continuous" })}>Contínuo</button>
          </div>
          <div className="mesa-panel-actions">
            <button disabled={isPlayer || !trigger.triggered} onClick={() => update(shape.id, { triggered: false, appliedTokens: [] })}><RotateCcw/>Rearmar</button>
            <button disabled={isPlayer} onClick={() => { setShapes(shapes.filter((entry) => entry.id !== shape.id)); setOpen(null); }}><Trash2/>Remover</button>
          </div>
        </div>}
      </div>;
    })}
  </section>;
}
