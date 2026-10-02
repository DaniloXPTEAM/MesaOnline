import { motion } from "framer-motion";
import {
  Backpack, ChevronRight, Coins, Crosshair, Dices, Eye, FlaskConical, Footprints, KeyRound, Lock, LockOpen,
  Package, Plus, ScrollText, Shield, Sparkles, Swords, X,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import type { TacticalUnitView } from "../../game/types";
import { appendChat, appendRoll } from "../../game/vttBridge";
import { rollFormula } from "../../game/macros";
import { getModernRpgCharacter, sheetSkillTotal } from "../../integration/modernRpgCharacterBridge";
import { upsertCharacterSheet } from "../../../ficha-modernrpg/characterRoute";
import type { EquipmentItem } from "../../../ficha-modernrpg/sheet";
import { T20_SKILLS } from "../../../ficha-modernrpg/t20/compendium";

interface Props {
  locked?: boolean;
  onToggleLock?: () => void;
  unit: TacticalUnitView;
  canControl: boolean;
  onClose: () => void;
  onMove: () => void;
  onOpenSheet?: () => void;
  onRemoveCondition?: (condition: string) => void;
  /** Só é fornecido a quem controla o token: ajusta PV/PM dentro dos limites. */
  onEditVitals?: (patch: { hp?: number; pm?: number }) => void;
  onAddCondition?: (condition: string) => void;
  /** Na exploração do Jogador a ficha é a âncora da coluna direita. */
  persistent?: boolean;
}

/** Sugestões do Tormenta 20 para o campo de condição; o valor continua livre. */
const CONDITION_SUGGESTIONS = [
  "Abalado", "Agarrado", "Atordoado", "Caído", "Cego", "Confuso", "Desprevenido",
  "Enjoado", "Enredado", "Exausto", "Fascinado", "Fatigado", "Frustrado", "Imóvel",
  "Indefeso", "Lento", "Ofuscado", "Paralisado", "Pasmo", "Surdo", "Vulnerável",
];

type ContextTab = "actions" | "inventory" | "sheet" | "effects";

/**
 * Painel contextual do token.
 *
 * REGRA QUE NÃO PODE SER QUEBRADA: o essencial do combate — retrato, nome,
 * nível, PV, PM e condições (ver, adicionar, remover) — fica SEMPRE visível,
 * acima de qualquer navegação. Uma versão antiga escondia o formulário de
 * condição atrás de uma aba e isso quebrou tanto a UX quanto o E2E.
 *
 * As abas abaixo carregam apenas conteúdo SECUNDÁRIO (ações disponíveis,
 * números da ficha e inventário), exatamente como o contrato permite.
 */
export default function TokenContextPanel({ unit, canControl, locked, onToggleLock, onClose, onMove, onOpenSheet, onRemoveCondition, onEditVitals, onAddCondition, persistent = false }: Props) {
  const conditions = unit.conditions || [];
  const [tab, setTab] = useState<ContextTab>(persistent ? "sheet" : "actions");

  // Inventário e dinheiro vêm da ficha oficial vinculada — nunca inventados.
  const sheet = useMemo(
    () => (unit.modernRpgCharacterId ? getModernRpgCharacter(unit.modernRpgCharacterId) : null),
    [unit.modernRpgCharacterId],
  );
  const equipment = sheet?.equipment || [];

  function addCondition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("condition") as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    onAddCondition?.(value);
    input.value = "";
  }

  return (
    <motion.aside
      className="mesa-token-context exploration-context"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 30, opacity: 0 }}
      transition={{ duration: .21, ease: "easeOut" }}
    >
      {!persistent && <button className="mesa-context-close" onClick={onClose} title="Fechar painel" aria-label="Fechar painel"><X/></button>}

      <header className={`mesa-context-head ${unit.side} ${persistent ? "is-persistent" : ""}`}>
        <span className="mesa-context-portrait" style={{ "--token-accent": unit.accent } as CSSProperties}>
          {unit.portrait ? <img src={unit.portrait} alt=""/> : <b>{unit.symbol}</b>}
        </span>
        <div className="mesa-context-identity">
          <small>{persistent ? "Ficha do jogador" : unit.side === "heroes" ? "Aventureiro" : "Ameaça"}</small>
          <strong>{unit.name}</strong>
          <em>{unit.title}</em>
        </div>
        <span className="mesa-context-level" title={`Nível ${unit.level}`}><small>Nível</small><b>{unit.level}</b></span>
      </header>

      {/* Essencial 1: PV e PM, sempre visíveis, com steppers para quem controla. */}
      <div className="mesa-context-vitals">
        <Resource label="PV" value={unit.pv} max={unit.pvMax} tone="hp" onChange={onEditVitals ? (hp) => onEditVitals({ hp }) : undefined}/>
        <Resource label="PM" value={unit.pm} max={unit.pmMax} tone="mp" onChange={onEditVitals ? (pm) => onEditVitals({ pm }) : undefined}/>
      </div>

      {/* Na ficha persistente da exploração, condição detalhada é demanda —
          não ocupa o mapa nem empurra as ações úteis. No contexto eventual
          (Mestre/inspeção), ela continua sempre exposta como antes. */}
      {persistent
        ? <button className="mesa-context-condition-summary" onClick={() => setTab((current) => current === "effects" ? "sheet" : "effects")} aria-label="Ver condições e efeitos">
            <Sparkles/><span><small>Condições</small><strong>{conditions.length ? `${conditions.length} ativa${conditions.length === 1 ? "" : "s"}` : "Nenhuma condição"}</strong></span><ChevronRight/>
          </button>
        : <section className="mesa-context-conditions">
            <label><Sparkles/>Condições ativas{conditions.length > 0 && <em>{conditions.length}</em>}</label>
            {conditions.length
              ? <div className="mesa-condition-chips">{conditions.map((condition) => (
                  <button key={condition} onClick={() => onRemoveCondition?.(condition)} disabled={!onRemoveCondition} title={onRemoveCondition ? `Remover ${condition}` : condition}>{condition}</button>
                ))}</div>
              : <p>Nenhuma condição ativa.</p>}
            {onAddCondition && <ConditionForm onSubmit={addCondition}/>}
          </section>}

      {/* Navegação secundária: só conteúdo de consulta. */}
      {!persistent && <nav className="mesa-context-tabs" role="tablist" aria-label="Detalhes do token">
        <button role="tab" aria-selected={tab === "actions"} className={tab === "actions" ? "active" : ""} onClick={() => setTab("actions")}>Ações</button>
        <button role="tab" aria-selected={tab === "inventory"} className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>Inventário</button>
        <button role="tab" aria-selected={tab === "sheet"} className={tab === "sheet" ? "active" : ""} onClick={() => setTab("sheet")}>Ficha</button>
        <button role="tab" aria-selected={tab === "effects"} className={tab === "effects" ? "active" : ""} onClick={() => setTab("effects")}>Efeitos{conditions.length > 0 && <i>{conditions.length}</i>}</button>
      </nav>}

      <div className="mesa-context-body">
        {tab === "actions" && <div className="mesa-action-list">
          {canControl
            ? <button className="mesa-action-row" onClick={onMove}>
                <span className="mesa-action-icon move"><Footprints/></span>
                <span className="mesa-action-copy"><strong>Mover</strong><small>Deslocamento de {unit.movementM} m</small></span>
                <ChevronRight/>
              </button>
            : <div className="mesa-inspection-note">
                <Eye/><span><strong>Somente inspeção</strong><small>Este token não está sob seu controle.</small></span>
              </div>}
          {onToggleLock && <button className={`mesa-action-row ${locked ? "is-locked" : ""}`} onClick={onToggleLock}>
            <span className="mesa-action-icon lock">{locked ? <Lock/> : <LockOpen/>}</span>
            <span className="mesa-action-copy"><strong>{locked ? "Destravar token" : "Travar token"}</strong><small>{locked ? "Travado: não se move pelo mapa" : "Impede o token de ser movido"}</small></span>
            <ChevronRight/>
          </button>}
          {onOpenSheet && <button className="mesa-action-row" onClick={onOpenSheet}>
            <span className="mesa-action-icon sheet"><ScrollText/></span>
            <span className="mesa-action-copy"><strong>Abrir ficha</strong><small>Ficha oficial no Portal</small></span>
            <ChevronRight/>
          </button>}
          {unit.attackType && <div className="mesa-action-summary">
            <span><small>Ataque</small><b>{signed(unit.attackType === "ranged" ? unit.pontaria : unit.luta)}</b></span>
            <span><small>Dano</small><b>{unit.damage || "—"}</b></span>
            <span><small>Alcance</small><b>{unit.rangeM} m</b></span>
          </div>}
        </div>}

        {tab === "effects" && <section className="mesa-context-effects">
          <h5>Condições em vigor</h5>
          {conditions.length
            ? <ul className="mesa-effect-list">{conditions.map((condition) => (
                <li key={condition}>
                  <i aria-hidden="true"/>
                  <strong>{condition}</strong>
                  {onRemoveCondition && <button onClick={() => onRemoveCondition(condition)} title={`Remover ${condition}`} aria-label={`Remover ${condition}`}><X/></button>}
                </li>
              ))}</ul>
            : <p className="mesa-effect-empty">Nenhuma condição em vigor sobre {unit.name}.</p>}
          {onAddCondition && <>
            <h5>Aplicar rapidamente</h5>
            <div className="mesa-effect-suggestions">
              {CONDITION_SUGGESTIONS.filter((condition) => !conditions.includes(condition)).map((condition) => (
                <button key={condition} onClick={() => onAddCondition(condition)}>{condition}</button>
              ))}
            </div>
            <ConditionForm onSubmit={addCondition}/>
          </>}
        </section>}

        {tab === "sheet" && (persistent
          ? <PlayerReferenceSheet unit={unit} sheet={sheet} equipment={equipment}/>
          : <section className="mesa-context-sheet">
              <div className="mesa-stat-grid">
                <Stat icon={<Swords/>} label={unit.attackType === "ranged" ? "Pontaria" : "Luta"} value={signed(unit.attackType === "ranged" ? unit.pontaria : unit.luta)}/>
                <Stat icon={<Crosshair/>} label="Dano" value={unit.damage || "—"}/>
                <Stat icon={<Crosshair/>} label="Alcance" value={`${unit.rangeM} m`}/>
                <Stat icon={<Sparkles/>} label="CD de magia" value={String(unit.spellDC)}/>
              </div>
              {sheet
                ? <div className="mesa-sheet-extra">
                    <span><small>Raça</small><b>{sheet.race || "—"}</b></span>
                    <span><small>Classe</small><b>{sheet.class || "—"}</b></span>
                    <span><small>Nível</small><b>{sheet.level}</b></span>
                    <span><small>Tibares</small><b>{sheet.money ?? 0} T$</b></span>
                  </div>
                : <p className="mesa-context-note">Sem ficha oficial vinculada — os números acima vêm do token.</p>}
              {sheet && sheet.attacks?.length > 0 && <div className="mesa-attack-list">
                <label><Swords/>Ataques da ficha</label>
                {sheet.attacks.map((attack) => <span key={attack.id}>
                  <strong>{attack.name}</strong>
                  <em>{attack.skill} {signed(attack.bonus || 0)}</em>
                  <b>{attack.damage}</b>
                  <small>{attack.critical}</small>
                </span>)}
              </div>}
            </section>)}

        {tab === "inventory" && <section className="mesa-context-inventory">
          {sheet
            ? <>
                <div className="mesa-inventory-head">
                  <span><Coins/><b>{sheet.money ?? 0}</b><small>T$</small></span>
                  <span><Package/><b>{equipment.length}</b><small>itens</small></span>
                </div>
                {equipment.length
                  ? <ul className="mesa-inventory-list">{equipment.map((item) => (
                      <li key={item.id} className={item.equipped ? "is-equipped" : ""}>
                        <i aria-hidden="true"><Package/></i>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.category}{item.quantity > 1 ? ` · ×${item.quantity}` : ""}{item.slots ? ` · ${item.slots} esp.` : ""}</small>
                        </span>
                        {item.equipped && <em>equipado</em>}
                      </li>
                    ))}</ul>
                  : <p className="mesa-context-note">A ficha vinculada não tem itens registrados.</p>}
              </>
            : <p className="mesa-context-note">
                Este token não tem ficha oficial vinculada. Inventário existe apenas para personagens vindos de <b>CharacterSheet</b>; ameaças do bestiário não têm lista de itens no runtime.
              </p>}
        </section>}
      </div>

      {/* Faixa fixa: números que o Mestre consulta o tempo todo ficam fora das
          abas, no mesmo lugar em que o painel de combate os mostra. */}
      {!persistent && <footer className="mesa-context-foot">
        <span><small>DEF</small><b>{unit.defense}</b></span>
        <span><small>Desl.</small><b>{unit.movementM}m</b></span>
        <span><small>Fort</small><b>{signed(unit.fortitude)}</b></span>
        <span><small>Ref</small><b>{signed(unit.reflexes)}</b></span>
        <span><small>Von</small><b>{signed(unit.will)}</b></span>
      </footer>}
    </motion.aside>
  );
}

function PlayerReferenceSheet({
  unit,
  sheet,
  equipment,
}: {
  unit: TacticalUnitView;
  sheet: ReturnType<typeof getModernRpgCharacter>;
  equipment: NonNullable<ReturnType<typeof getModernRpgCharacter>>["equipment"];
}) {
  const [sheetRevision, setSheetRevision] = useState(0);
  // A ficha é a fonte dos dados; o contador só a relê depois que um consumível
  // é usado nesta mesma interface (a gravação ainda ocorre na ficha oficial).
  const currentSheet = useMemo(
    () =>
      unit.modernRpgCharacterId
        ? getModernRpgCharacter(unit.modernRpgCharacterId)
        : sheet,
    [unit.modernRpgCharacterId, sheet, sheetRevision],
  );
  const currentEquipment = currentSheet?.equipment || equipment;
  const storageKey = `armada-mesa-hotkeys-v1:${currentSheet?.id || unit.id}`;
  const [hotkeyIds, setHotkeyIds] = useState<string[]>(() =>
    loadHotkeys(storageKey),
  );

  useEffect(() => {
    setHotkeyIds(loadHotkeys(storageKey));
  }, [storageKey]);
  useEffect(() => {
    const available = new Set(currentEquipment.map((item) => item.id));
    setHotkeyIds((current) => {
      const next = current.map((id) => (available.has(id) ? id : ""));
      if (next.join("|") !== current.join("|")) saveHotkeys(storageKey, next);
      return next;
    });
  }, [currentEquipment, storageKey]);

  const fallbackSkills = [
    { label: "Luta", value: unit.luta },
    { label: "Pontaria", value: unit.pontaria },
    { label: "Fortitude", value: unit.fortitude },
    { label: "Reflexos", value: unit.reflexes },
    { label: "Vontade", value: unit.will },
  ];
  const trained = currentSheet
    ? T20_SKILLS.filter(
        (skill) => currentSheet.skills?.[skill.id]?.trained,
      ).map((skill) => ({
        label: skill.nome,
        value: sheetSkillTotal(currentSheet, skill.id, skill.atributo),
      }))
    : fallbackSkills;
  const quickSaves = [
    { label: "Reflexos", value: unit.reflexes, icon: <Sparkles /> },
    { label: "Fortitude", value: unit.fortitude, icon: <Shield /> },
    { label: "Vontade", value: unit.will, icon: <Dices /> },
  ];

  function rollCheck(
    label: string,
    modifier: number,
    kind: "save" | "system" = "system",
  ) {
    const natural = 1 + Math.floor(Math.random() * 20);
    appendRoll({
      id: `exploration-check-${crypto.randomUUID()}`,
      actor: unit.name,
      target: "—",
      action: label,
      kind,
      natural,
      modifier,
      total: natural + modifier,
      formula: `1d20${modifier >= 0 ? "+" : ""}${modifier}`,
      rolls: [natural],
      outcome:
        natural === 20
          ? "Crítico"
          : natural === 1
            ? "Falha crítica"
            : "Rolagem",
      success: natural !== 1 && (natural === 20 || natural + modifier >= 10),
      timestamp: Date.now(),
    });
  }

  function useEquipment(item: EquipmentItem) {
    // A descrição importada pode registrar uma fórmula (por exemplo, cura
    // 2d8+2). Quando há fórmula, ela é rolada; sem efeito mecânico importado,
    // a ação ainda é registrada sem fabricar dano ou cura inexistentes.
    const formula = item.description
      .match(/\b(?:\d*)d\d+(?:\s*[+-]\s*\d+)?\b/i)?.[0]
      ?.replace(/\s+/g, "");
    const result = formula ? rollFormula(formula) : null;
    if (result) {
      appendRoll({
        id: `item-${crypto.randomUUID()}`,
        actor: unit.name,
        target: "—",
        action: item.name,
        kind: "system",
        modifier: result.modifier,
        total: result.total,
        formula: result.formula,
        rolls: result.rolls,
        outcome: `Item usado: [${result.rolls.join(", ")}]`,
        success: true,
        timestamp: Date.now(),
      });
    } else {
      appendChat({
        author: unit.name,
        text: `Usou ${item.name}.${item.description ? ` ${item.description}` : ""}`,
        kind: "system",
      });
    }
    if (currentSheet && item.category === "Consumível" && item.quantity > 0) {
      upsertCharacterSheet({
        ...currentSheet,
        equipment: currentSheet.equipment.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: Math.max(0, entry.quantity - 1) }
            : entry,
        ),
      });
      setSheetRevision((value) => value + 1);
    }
  }

  function assignHotkey(slot: number, itemId: string) {
    setHotkeyIds((current) => {
      const next = Array.from({ length: 5 }, (_, index) =>
        index === slot ? itemId : current[index] || "",
      );
      saveHotkeys(storageKey, next);
      return next;
    });
  }

  return (
    <section
      className="mesa-player-reference-sheet"
      aria-label="Ficha resumida do jogador"
    >
      <div className="mesa-player-save-grid">
        {quickSaves.map((save) => (
          <button
            key={save.label}
            type="button"
            title={`Rolar teste de ${save.label}`}
            aria-label={`Rolar teste de ${save.label}`}
            onClick={() => rollCheck(save.label, save.value, "save")}
          >
            <i>{save.icon}</i>
            <strong>{save.label}</strong>
            <b>{signed(save.value)}</b>
          </button>
        ))}
      </div>
      <section className="mesa-player-sheet-block">
        <h5>
          <Dices />
          Perícias
        </h5>
        {trained.length ? (
          <div className="mesa-player-skill-list">
            {trained.map((skill) => (
              <button
                type="button"
                key={skill.label}
                onClick={() => rollCheck(skill.label, skill.value)}
                title={`Rolar ${skill.label}`}
              >
                <strong>{skill.label}</strong>
                <b>{signed(skill.value)}</b>
              </button>
            ))}
          </div>
        ) : (
          <p>Nenhuma perícia treinada identificada na ficha.</p>
        )}
      </section>
      <section className="mesa-player-sheet-block">
        <h5>
          <Backpack />
          Equipamentos / Mochila
        </h5>
        {currentEquipment.length ? (
          <ul className="mesa-player-equipment-list">
            {currentEquipment.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "text/armada-equipment",
                      item.id,
                    );
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => useEquipment(item)}
                  title={`Usar ${item.name}. Arraste para uma hotkey.`}
                >
                  {equipmentIcon(item)}
                  <span>
                    {item.name}
                    {item.quantity > 1 ? ` (${item.quantity})` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem equipamentos vinculados à ficha.</p>
        )}
      </section>
      <section className="mesa-player-hotkeys">
        <h5>Hotkeys</h5>
        <div>
          {Array.from({ length: 5 }, (_, index) => {
            const item = currentEquipment.find(
              (entry) => entry.id === hotkeyIds[index],
            );
            return (
              <button
                type="button"
                key={index}
                className={item ? "is-assigned" : ""}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const itemId = event.dataTransfer.getData(
                    "text/armada-equipment",
                  );
                  if (currentEquipment.some((entry) => entry.id === itemId))
                    assignHotkey(index, itemId);
                }}
                onClick={() => item && useEquipment(item)}
                title={
                  item
                    ? `Usar ${item.name}`
                    : "Arraste um item da mochila para esta hotkey"
                }
                aria-label={
                  item
                    ? `Hotkey ${index + 1}: usar ${item.name}`
                    : `Hotkey ${index + 1} vazia`
                }
              >
                <small>{index + 1}</small>
                {equipmentIcon(item)}
                {item && <b>{item.quantity || 1}</b>}
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}

/** Ícone semântico da ficha importada: mantém os slots legíveis como os
 * frascos, pergaminhos, chave e mochila da referência, sem inventar itens. */
function equipmentIcon(item?: EquipmentItem) {
  if (!item) return <Package />;
  const text = `${item.name} ${item.category}`.toLocaleLowerCase("pt-BR");
  if (/po[çc][aã]o|elixir|frasc/.test(text)) return <FlaskConical />;
  if (/pergaminho|scroll|mapa/.test(text)) return <ScrollText />;
  if (/chave|key/.test(text)) return <KeyRound />;
  if (/mochila|kit|bolsa/.test(text)) return <Backpack />;
  return <Package />;
}

function loadHotkeys(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.map(String).slice(0, 5) : [];
  } catch {
    return [];
  }
}
function saveHotkeys(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* armazenamento indisponível */
  }
}

function ConditionForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="mesa-condition-add" onSubmit={onSubmit}>
    <input name="condition" list="mesa-condition-suggestions" placeholder="Adicionar condição" maxLength={80} autoComplete="off"/>
    <button type="submit" title="Adicionar condição" aria-label="Adicionar condição"><Plus/></button>
    <datalist id="mesa-condition-suggestions">{CONDITION_SUGGESTIONS.map((condition) => <option key={condition} value={condition}/>)}</datalist>
  </form>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <span className="mesa-stat"><i>{icon}</i><small>{label}</small><b>{value}</b></span>;
}

function Resource({ label, value, max, tone, onChange }: { label: string; value: number; max: number; tone: string; onChange?: (value: number) => void }) {
  const limit = Math.max(0, max);
  return <div className={`mesa-vital ${tone} ${onChange ? "editable" : ""}`}>
    <span>{label}</span>
    <i><b style={{ width: `${Math.max(0, Math.min(100, value / Math.max(1, max) * 100))}%` }}/></i>
    {onChange
      ? <div className="mesa-vital-steppers">
          <button type="button" title={`Reduzir ${label}`} aria-label={`Reduzir ${label}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
          <strong>{value}<small> / {max}</small></strong>
          <button type="button" title={`Aumentar ${label}`} aria-label={`Aumentar ${label}`} disabled={value >= limit} onClick={() => onChange(Math.min(limit, value + 1))}>+</button>
        </div>
      : <strong>{value}<small> / {max}</small></strong>}
  </div>;
}
function signed(value: number) { return value >= 0 ? `+${value}` : String(value); }
