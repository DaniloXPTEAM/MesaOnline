import {
  Backpack, ChevronLeft, ChevronRight, Crosshair, Footprints, Hourglass, Info,
  Shield, Sparkles, Swords, WandSparkles, X, Zap,
} from "lucide-react";
import { unitActions } from "../game/actions";
import type { GameAction, TacticalUnitView, TurnResources } from "../game/types";

export type CommandPage = "root" | "attack" | "power" | "spell" | "item" | "special" | "targeting" | "confirm-action" | "confirm-move";

interface Props {
  unit: TacticalUnitView;
  target?: TacticalUnitView;
  page: CommandPage;
  canAct: boolean;
  canControl: boolean;
  canRunAi: boolean;
  resources?: TurnResources;
  selectedAction: GameAction | null;
  pendingMoveDistance: number | null;
  affectedUnits: TacticalUnitView[];
  onPage: (page: CommandPage) => void;
  onMove: () => void;
  moveMode?: "walk" | "fly" | "burrow";
  onMoveMode?: (mode: "walk" | "fly" | "burrow") => void;
  onChooseAction: (action: GameAction) => void;
  onConfirmAction: () => void;
  onConfirmMove: () => void;
  onCancel: () => void;
  onWait: () => void;
  onRunAi: () => void;
  onOpenSheet?: () => void;
  onClose: () => void;
}

function moveSubtitle(unit: { movementM: number; flyM?: number; burrowM?: number }, mode?: "walk" | "fly" | "burrow") {
  if (mode === "fly" && unit.flyM) return `voo ${unit.flyM} m`;
  if (mode === "burrow" && unit.burrowM) return `escavação ${unit.burrowM} m`;
  return `${unit.movementM} m${unit.flyM ? ` · voo ${unit.flyM} m` : ""}${unit.burrowM ? ` · escava ${unit.burrowM} m` : ""}`;
}

export default function CommandMenu(props: Props) {
  const { unit, page, canAct, canControl, selectedAction } = props;
  const groups = {
    attack: unitActions(unit, "weapon"),
    power: unitActions(unit, "power"),
    spell: unitActions(unit, "spell"),
    item: unitActions(unit, "item"),
    special: unitActions(unit, "special"),
  };
  const actionPage = ["attack", "power", "spell", "item", "special"].includes(page) ? page as keyof typeof groups : null;

  return (
    <aside className="fft-command-shell">
      <button className="mesa-context-close" onClick={props.onClose} title="Fechar painel" aria-label="Fechar painel"><X/></button>
      <UnitHeader unit={unit} onOpenSheet={props.onOpenSheet}/>
      <ActionEconomy resources={props.resources} active={canAct}/>
      {unit.side === "threats" && canAct && canControl && props.canRunAi && page === "root" && <button className="enemy-ai-button" onClick={props.onRunAi}><Crosshair size={18}/><span><strong>Executar turno da IA</strong><small>Busca alvo, move e escolhe ação real</small></span><ChevronRight size={16}/></button>}
      {!canControl ? <div className="command-inspection-only"><Shield/><span><strong>{unit.side === "threats" ? "Inspeção de ameaça" : "Personagem de outro jogador"}</strong><small>Você pode consultar vitais e condições, mas não comandar este token.</small></span></div> : <div className="command-window">
        <div className="command-window-title">{page !== "root" && <button onClick={() => { props.onCancel(); props.onPage("root"); }}><ChevronLeft size={16}/></button>}<span>{pageTitle(page)}</span><small>{canAct ? "SEU TURNO" : "AGUARDANDO"}</small></div>
        {page === "root" && <div className="root-commands">
          <CommandButton icon={<Footprints/>} title="Mover" subtitle={moveSubtitle(unit, props.moveMode)} disabled={!canAct} onClick={props.onMove} tone="move"/>
          {canAct && (unit.flyM || unit.burrowM) ? <div className="mesa-move-modes" role="group" aria-label="Modo de deslocamento">
            {(["walk", "fly", "burrow"] as const).filter((mode) => mode === "walk" || (mode === "fly" ? unit.flyM : unit.burrowM)).map((mode) => (
              <button key={mode} className={props.moveMode === mode ? "active" : ""} onClick={() => props.onMoveMode?.(mode)}>
                {mode === "walk" ? "Terrestre" : mode === "fly" ? "Voo" : "Escavação"}
                <b>{mode === "walk" ? unit.movementM : mode === "fly" ? unit.flyM : unit.burrowM} m</b>
              </button>
            ))}
          </div> : null}
          <CommandButton icon={<Swords/>} title="Agir / Atacar" subtitle={`${groups.attack.length} disponíveis`} disabled={!canAct || !groups.attack.length} onClick={() => props.onPage("attack")} tone="attack"/>
          <CommandButton icon={<Sparkles/>} title="Poder" subtitle={`${groups.power.length} utilizáveis`} disabled={!canAct || !groups.power.length} onClick={() => props.onPage("power")} tone="attack"/>
          <CommandButton icon={<WandSparkles/>} title="Magia" subtitle={`${groups.spell.length} conhecidas`} disabled={!canAct || !groups.spell.length} onClick={() => props.onPage("spell")} tone="spell"/>
          <CommandButton icon={<Backpack/>} title="Itens" subtitle={`${groups.item.length} de combate`} disabled={!canAct || !groups.item.length} onClick={() => props.onPage("item")} tone="item"/>
          {groups.special.length > 0 && <CommandButton icon={<Zap/>} title="Ação especial" subtitle={`${groups.special.length} opções`} disabled={!canAct} onClick={() => props.onPage("special")} tone="spell"/>}
          <CommandButton icon={<Hourglass/>} title="Esperar" subtitle="Encerra o turno" disabled={!canAct} onClick={props.onWait} tone="wait"/>
        </div>}
        {actionPage && <ActionList actions={groups[actionPage]} currentPm={unit.pm} onChoose={props.onChooseAction}/>}
        {page === "targeting" && selectedAction && <div className="targeting-window"><ActionIcon action={selectedAction} large/><span><small>SELECIONE O ALVO</small><strong>{selectedAction.name}</strong><p>{selectedAction.target === "area" ? "Escolha o centro da área." : "Escolha uma unidade destacada dentro do alcance."}</p></span><button onClick={props.onCancel}>Cancelar</button></div>}
        {page === "confirm-action" && selectedAction && <div className="confirm-window"><ActionIcon action={selectedAction} large/><div className="confirm-copy"><span>{categoryLabel(selectedAction.category)}</span><h3>{selectedAction.name}</h3><p>{selectedAction.description}</p></div><div className="prediction-grid"><div><small>ALVO</small><strong>{props.target?.name || (selectedAction.target === "area" ? "Área escolhida" : unit.name)}</strong></div><div><small>ALCANCE</small><strong>{selectedAction.rangeM} m</strong></div><div><small>CUSTO</small><strong>{selectedAction.pmCost} PM</strong></div><div><small>EFEITO</small><strong>{selectedAction.damage || selectedAction.healing || selectedAction.condition || "Especial"}</strong></div></div>{props.affectedUnits.length > 1 && <div className="affected-line"><Info size={14}/>{props.affectedUnits.length} unidades: {props.affectedUnits.map((entry) => entry.name.split(" ")[0]).join(", ")}</div>}<div className="confirm-actions"><button onClick={props.onCancel}>Cancelar</button><button className="confirm" onClick={props.onConfirmAction}>Confirmar ação</button></div></div>}
        {page === "confirm-move" && <div className="confirm-window move-confirm"><div className="move-emblem"><Footprints size={30}/></div><div className="confirm-copy"><span>ROTA SELECIONADA</span><h3>Confirmar movimento</h3><p>A posição lógica será atualizada no token real.</p></div><div className="prediction-grid two"><div><small>DISTÂNCIA</small><strong>{((props.pendingMoveDistance || 0) * 1.5).toLocaleString("pt-BR")} m</strong></div><div><small>CUSTO</small><strong>Ação de movimento</strong></div></div><div className="confirm-actions"><button onClick={props.onCancel}>Cancelar</button><button className="confirm blue" onClick={props.onConfirmMove}>Mover unidade</button></div></div>}
      </div>}
      <div className="unit-resistances"><span><Shield size={13}/> DEF <b>{unit.defense}</b></span><span>FORT <b>{signed(unit.fortitude)}</b></span><span>REF <b>{signed(unit.reflexes)}</b></span><span>VON <b>{signed(unit.will)}</b></span></div>
      {unit.conditions?.length ? <div className="mini-conditions">{unit.conditions.map((condition) => <span key={condition}>{condition}</span>)}</div> : <div className="mini-conditions empty">Sem condições ativas</div>}
    </aside>
  );
}

function ActionEconomy({ resources, active }: { resources?: TurnResources; active: boolean }) {
  // Os cinco recursos que o motor realmente controla. Completa e Livre ficavam
  // invisíveis, então o HUD contradizia o turnPlan que bloqueava o botão.
  const items: Array<[string, number | undefined]> = [
    ["Padrão", resources?.standard],
    ["Movimento", resources?.movement],
    ["Completa", resources?.full],
    ["Livre", resources?.free],
    ["Reação", resources?.reaction],
  ];
  return <div className="command-economy"><span className={active ? "turn-active" : ""}><i/>{active ? "Turno atual" : "Fora do turno"}</span>{items.map(([label, value]) => <span key={label} className={value === 0 ? "spent" : "available"}><i/>{label}<b>{value === 0 ? "gasta" : "livre"}</b></span>)}</div>;
}
function UnitHeader({ unit, onOpenSheet }: { unit: TacticalUnitView; onOpenSheet?: () => void }) {
  return <div className={`fft-unit-header ${unit.side}`}><button className="fft-portrait" style={{ "--accent": unit.accent } as React.CSSProperties} onClick={onOpenSheet} disabled={!onOpenSheet}>{unit.portrait ? <img src={unit.portrait} alt=""/> : <b>{unit.symbol}</b>}</button><div className="fft-unit-identity"><span>{unit.side === "heroes" ? "PERSONAGEM" : "AMEAÇA"}</span><strong>{unit.name}</strong><small>{unit.title} · Desl. {unit.movementM}m</small></div><div className="fft-level"><small>NV.</small><b>{unit.level}</b></div><div className="fft-bars"><Resource label="PV" value={unit.pv} maximum={unit.pvMax} tone="hp"/><Resource label="PM" value={unit.pm} maximum={unit.pmMax} tone="mp"/></div></div>;
}
function Resource({ label, value, maximum, tone }: { label: string; value: number; maximum: number; tone: string }) { return <div className={`fft-resource ${tone}`}><span>{label}</span><i><b style={{ width: `${Math.max(0, value / Math.max(1, maximum)) * 100}%` }}/></i><strong>{value}<small>/{maximum}</small></strong></div>; }
function CommandButton({ icon, title, subtitle, disabled, onClick, tone }: { icon: React.ReactNode; title: string; subtitle: string; disabled: boolean; onClick: () => void; tone: string }) { return <button className={`fft-command ${tone}`} disabled={disabled} onClick={onClick}><span className="command-icon">{icon}</span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight size={17}/></button>; }
function ActionList({ actions, currentPm, onChoose }: { actions: GameAction[]; currentPm: number; onChoose: (action: GameAction) => void }) { return <div className="action-list">{actions.map((action) => <button key={action.id} disabled={action.pmCost > currentPm} onClick={() => onChoose(action)}><ActionIcon action={action}/><span><strong>{action.name}</strong><small>{action.description}</small><i>{action.kind || "standard"} · {action.damage ? `Dano ${action.damage}` : action.healing ? `Cura ${action.healing}` : action.condition || "Efeito especial"} · {action.rangeM} m</i></span><em>{action.pmCost ? `${action.pmCost} PM` : "0 PM"}</em><ChevronRight size={16}/></button>)}{!actions.length && <div className="empty-actions">Nenhuma ação desta categoria.</div>}</div>; }
function ActionIcon({ action, large = false }: { action: GameAction; large?: boolean }) { const Icon = action.category === "spell" ? WandSparkles : action.category === "item" ? Backpack : action.category === "power" ? Sparkles : action.category === "special" ? Zap : Swords; return <span className={`action-icon ${action.color} ${large ? "large" : ""}`}><Icon/></span>; }
function categoryLabel(category: GameAction["category"]) { return ({ weapon: "ATAQUE PREPARADO", spell: "MAGIA PREPARADA", power: "PODER PREPARADO", item: "ITEM PREPARADO", special: "AÇÃO ESPECIAL" })[category]; }
function pageTitle(page: CommandPage) { return ({ root: "COMANDOS", attack: "ATAQUES", power: "PODERES", spell: "GRIMÓRIO", item: "ITENS", special: "AÇÕES ESPECIAIS", targeting: "SELECIONAR ALVO", "confirm-action": "CONFIRMAÇÃO", "confirm-move": "CONFIRMAÇÃO" })[page]; }
function signed(value: number) { return value >= 0 ? `+${value}` : String(value); }
