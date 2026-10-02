import { DAMAGE_TYPES } from "../../tactics/interpretation/spellClassification";
import type { ObjectTrap, SaveType } from "../../game/types";

/**
 * Campos da armadilha (baú e porta): nome, armada, CD de Percepção para achar, CD de Ladinagem para
 * desarmar, dano, tipo de dano, resistência e condição. Todas as CDs são definidas pelo Mestre.
 */
const EMPTY_TRAP: ObjectTrap = { name: "Armadilha", armed: true, detectDc: 15, disarmDc: 15 };
const ALL_DAMAGE_TYPES = [...DAMAGE_TYPES.fisico, ...DAMAGE_TYPES.elemental, ...DAMAGE_TYPES.outro];
const num = (value: string, fallback: number) => Math.max(1, Math.min(60, Math.round(Number(value)) || fallback));

export default function TrapEditor({ trap, onChange }: { trap?: ObjectTrap; onChange: (trap: ObjectTrap | undefined) => void }) {
  const setTrap = (patch: Partial<ObjectTrap>) => onChange({ ...(trap || EMPTY_TRAP), ...patch });
  return <>
    <div className="mesa-grid-settings-row">
      <label>Armadilha<input type="checkbox" checked={Boolean(trap)} onChange={(event) => onChange(event.target.checked ? { ...EMPTY_TRAP } : undefined)}/></label>
      {trap && <label>Armada<input type="checkbox" checked={trap.armed} onChange={(event) => setTrap({ armed: event.target.checked })}/></label>}
    </div>
    {trap && <>
      <label className="mesa-panel-field"><span>Nome da armadilha</span><div><input value={trap.name} maxLength={60} onChange={(event) => setTrap({ name: event.target.value })}/></div></label>
      <div className="mesa-grid-settings-row">
        <label>CD Percepção<input type="number" min={1} max={60} value={trap.detectDc} onChange={(event) => setTrap({ detectDc: num(event.target.value, 15) })}/></label>
        <label>CD Desarmar (Ladinagem)<input type="number" min={1} max={60} value={trap.disarmDc} onChange={(event) => setTrap({ disarmDc: num(event.target.value, 15) })}/></label>
      </div>
      <div className="mesa-grid-settings-row">
        <label>Dano<input value={trap.damage || ""} placeholder="2d6" maxLength={20} onChange={(event) => setTrap({ damage: event.target.value.trim() || undefined })}/></label>
        <label>Tipo<select value={trap.damageType || ""} onChange={(event) => setTrap({ damageType: event.target.value || undefined })}><option value="">Sem tipo</option>{ALL_DAMAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      </div>
      <div className="mesa-grid-settings-row">
        <label>Resistência<select value={trap.save || ""} onChange={(event) => setTrap({ save: (event.target.value || undefined) as SaveType | undefined })}><option value="">Nenhuma</option><option value="reflexes">Reflexos</option><option value="fortitude">Fortitude</option><option value="will">Vontade</option></select></label>
        <label>CD resistência<input type="number" min={1} max={60} value={trap.saveDc ?? 15} onChange={(event) => setTrap({ saveDc: num(event.target.value, 15) })}/></label>
        <label>Condição<input value={trap.condition || ""} placeholder="Enjoado" maxLength={40} onChange={(event) => setTrap({ condition: event.target.value.trim() || undefined })}/></label>
      </div>
    </>}
  </>;
}
