import { DEFAULT_DOOR_LOCK_DC, LOCK_PRESETS } from "../../game/chest";
import type { BoardWall } from "../../game/types";
import { upsertWall } from "../../game/vttBridge";
import TrapEditor from "./TrapEditor";

/** Configuração da porta pelo Mestre: nome, trancada, CD da fechadura (20 simples, 25 média, 30 superior) e Tranca Arcana (mini-macro). */
const num = (value: string, fallback: number) => Math.max(1, Math.min(60, Math.round(Number(value)) || fallback));

export default function DoorEditor({ door }: { door: BoardWall }) {
  const set = (patch: Partial<BoardWall>) => upsertWall({ ...door, ...patch, ...(patch.locked || patch.magicLocked ? { open: false } : {}) });
  const lockDc = door.lockDc ?? DEFAULT_DOOR_LOCK_DC;
  return <div className="mesa-panel-section"><h4>CONFIGURAR: {(door.name || "Porta").toUpperCase()}</h4>
    <label className="mesa-panel-field"><span>Nome</span><div><input value={door.name || ""} maxLength={60} placeholder="Porta" onChange={(event) => set({ name: event.target.value })}/></div></label>
    <div className="mesa-grid-settings-row">
      <label>Trancado<input type="checkbox" checked={Boolean(door.locked)} onChange={(event) => set({ locked: event.target.checked, ...(event.target.checked ? {} : { magicLocked: false, magicBonus: 0 }) })}/></label>
      <label>Fechadura<select value={LOCK_PRESETS.some((preset) => preset.dc === lockDc) ? lockDc : "custom"} onChange={(event) => event.target.value !== "custom" && set({ lockDc: Number(event.target.value) })}>{LOCK_PRESETS.map((preset) => <option key={preset.dc} value={preset.dc}>{preset.label}</option>)}<option value="custom">Outra CD</option></select></label>
      <label>CD<input type="number" min={1} max={60} value={lockDc} onChange={(event) => set({ lockDc: num(event.target.value, DEFAULT_DOOR_LOCK_DC) })}/></label>
    </div>
    <div className="mesa-grid-settings-row">
      <label>Tranca Arcana (+10)<input type="checkbox" checked={Boolean(door.magicLocked)} onChange={(event) => set({ magicLocked: event.target.checked, ...(event.target.checked ? { locked: true } : { magicBonus: 0 }) })}/></label>
      {door.magicLocked && <label>CD Misticismo<input type="number" min={1} max={60} value={door.magicDc ?? 20} onChange={(event) => set({ magicDc: num(event.target.value, 20) })}/></label>}
      {door.magicLocked && <label>Aprimoramentos<select value={door.magicBonus ?? 0} onChange={(event) => set({ magicBonus: Number(event.target.value) })}><option value={0}>Nenhum</option><option value={5}>+5 CD</option><option value={10}>+10 CD</option></select></label>}
    </div>
    <TrapEditor trap={door.trap} onChange={(trap) => set({ trap })}/>
  </div>;
}
