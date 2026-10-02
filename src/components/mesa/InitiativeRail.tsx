import { Crown, ListOrdered, Shield } from "lucide-react";
import type { RuntimeSnapshot, TacticalUnitView } from "../../game/types";

interface Props {
  snapshot: RuntimeSnapshot;
  units: TacticalUnitView[];
  selectedUnitId?: string;
  onSelect: (unitId: string) => void;
}

/**
 * Ordem de iniciativa sempre à vista, como na referência V3.
 *
 * Não cria uma segunda fonte de verdade: quando o combate está ativo usa
 * `combat.order`; fora dele exibe os tokens presentes na cena ordenados pela
 * iniciativa. Assim a coluna continua útil na exploração sem fingir que há
 * um turno em execução.
 */
export default function InitiativeRail({ snapshot, units, selectedUnitId, onSelect }: Props) {
  const combatOrder = snapshot.combat.order
    .map((id) => units.find((unit) => unit.id === id))
    .filter((unit): unit is TacticalUnitView => Boolean(unit));
  const entries = (combatOrder.length ? combatOrder : units.filter((unit) => !unit.defeated).slice().sort((a, b) => {
    const aInitiative = a.initiativeRoll || a.initiative;
    const bInitiative = b.initiativeRoll || b.initiative;
    return bInitiative - aInitiative || a.name.localeCompare(b.name, "pt-BR");
  }));
  const activeId = snapshot.combat.active ? snapshot.combat.activeTokenId : "";

  return (
    <aside className="mesa-initiative-rail" aria-label="Ordem de iniciativa">
      <header>
        <span><ListOrdered/></span>
        <div>
          <small>{snapshot.combat.active ? `RODADA ${snapshot.combat.round}` : "CENA ATUAL"}</small>
          <strong>Ordem de iniciativa</strong>
        </div>
      </header>
      <div className="mesa-initiative-list-v3">
        {entries.length
          ? entries.map((unit, index) => {
              const current = unit.id === activeId;
              const selected = unit.id === selectedUnitId;
              const initiative = unit.initiativeRoll || unit.initiative;
              return (
                <button
                  key={unit.id}
                  className={`${unit.side} ${current ? "is-active" : ""} ${selected ? "is-selected" : ""} ${unit.defeated ? "is-defeated" : ""}`}
                  onClick={() => onSelect(unit.id)}
                  aria-current={current ? "step" : undefined}
                  title={`${unit.name} · iniciativa ${initiative}`}
                >
                  <b className="mesa-initiative-position">{index + 1}</b>
                  <span className="mesa-initiative-portrait">
                    {unit.portrait ? <img src={unit.portrait} alt=""/> : <i>{unit.symbol}</i>}
                    {current && <Crown/>}
                  </span>
                  <span className="mesa-initiative-copy">
                    <strong>{unit.name}</strong>
                    <small>{current ? "Turno atual" : unit.defeated ? "Derrotado" : `${initiative >= 0 ? "+" : ""}${initiative} iniciativa`}</small>
                    <em><i style={{ width: `${Math.max(0, Math.min(100, unit.pv / Math.max(1, unit.pvMax) * 100))}%` }}/></em>
                  </span>
                </button>
              );
            })
          : <div className="mesa-initiative-empty">
              <Shield/>
              <strong>Nenhuma unidade</strong>
              <span>Adicione personagens ou ameaças à cena para formar a ordem.</span>
            </div>}
      </div>
    </aside>
  );
}
