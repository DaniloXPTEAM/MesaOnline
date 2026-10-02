import { DoorOpen, Hand, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_DOOR_LOCK_DC, effectiveLockDc, withinReach } from "../../game/chest";
import { canControlToken } from "../../game/permissions";
import type { RuntimeSnapshot } from "../../game/types";
import { appendChat } from "../../game/vttBridge";
import { arcaneLockCost, type DoorAction, executeDoorAction, knowsArcaneLock } from "../../tactics/engine/objectCommands";
import { closeDoorDialog, useStageControl } from "./mapStageControl";

/**
 * Diálogo da porta: quem interage e o que tenta (abrir, fechar, arrombar, forçar, dissipar a tranca
 * mágica). Mesma arquitetura do baú (`ObjectDialog`); o Mestre rola e decide (`objectCommands.ts`).
 */
export default function DoorDialog({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { focusedDoorId } = useStageControl();
  const door = snapshot.board.walls.find((wall) => wall.id === focusedDoorId && (wall.type === "door" || wall.type === "window"));
  const isMaster = snapshot.multiplayer.role !== "player";
  const cell = door ? { x: Math.round(door.x1), y: Math.round(door.y1) } : null;
  const actors = door && cell
    ? snapshot.board.tokens.filter((token) => !token.hidden && !token.defeated && canControlToken(snapshot.multiplayer, token) && withinReach(token, cell))
    : [];
  const [actorId, setActorId] = useState<string>("");
  useEffect(() => {
    if (!actors.some((token) => token.id === actorId)) setActorId(actors[0]?.id || "");
  }, [focusedDoorId, actors.map((token) => token.id).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!door) return null;

  const label = door.name || (door.type === "window" ? "Janela" : "Porta");
  const run = (action: DoorAction, asMaster = false) => {
    try { executeDoorAction(asMaster ? null : actorId || null, door.id, action); }
    catch (error) { appendChat({ author: "Sistema", text: (error as Error).message, kind: "system" }); }
  };
  const state = door.open ? "Aberta" : door.locked ? "Trancada" : "Fechada";
  const noActor = !actorId;
  const actor = snapshot.board.tokens.find((token) => token.id === actorId);
  const arcane = Boolean(actor && knowsArcaneLock(actor));

  return (
    <div className="mesa-skin-action-backdrop" role="presentation" onMouseDown={closeDoorDialog}>
      <section className="mesa-skin-action-dialog scroll-tray" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <span><DoorOpen size={18}/></span>
          <div><small>{state.toUpperCase()}</small><strong>{label}</strong></div>
          <button type="button" onClick={closeDoorDialog} aria-label="Fechar"><X size={18}/></button>
        </header>

        {actors.length
          ? <>
            <label className="mesa-skin-dialog-note">Quem interage
              <select value={actorId} onChange={(event) => setActorId(event.target.value)}>{actors.map((token) => <option key={token.id} value={token.id}>{token.name}</option>)}</select>
            </label>
            {door.open
              ? <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("close")}><DoorOpen size={19}/><span><strong>Fechar</strong></span></button>
              : <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("open")}><DoorOpen size={19}/><span><strong>Abrir</strong><small>{door.locked ? "Está trancada" : "Destrancada"}</small></span></button>}
            {door.locked && <>
              <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("unlock")}><Hand size={19}/><span><strong>Arrombar</strong><small>Ladinagem · ação completa · sem gazua –5</small></span></button>
              <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("force")}><Hand size={19}/><span><strong>Forçar</strong><small>Teste de Força</small></span></button>
            </>}
            <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("search")}><Search size={19}/><span><strong>Procurar armadilha</strong><small>Teste de Percepção</small></span></button>
            {door.trap?.revealed && door.trap.armed && <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("disarm")}><ShieldAlert size={19}/><span><strong>Desarmar</strong><small>Teste de Ladinagem</small></span></button>}
            <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("recognize")}><Sparkles size={19}/><span><strong>Detectar magia</strong><small>Teste de Misticismo</small></span></button>
            {arcane && door.locked && <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("arcane-open")}><Sparkles size={19}/><span><strong>Abrir com Tranca Arcana</strong><small>{arcaneLockCost("open")} PM · ação padrão</small></span></button>}
            {arcane && !door.locked && !door.open && <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("arcane-lock")}><Sparkles size={19}/><span><strong>Trancar com Tranca Arcana</strong><small>{arcaneLockCost("lock")} PM · ação padrão</small></span></button>}
          </>
          : <p className="mesa-skin-dialog-note">Chegue perto (casa adjacente) com um personagem seu para interagir.</p>}

        {door.trap?.revealed && door.trap.armed && <p className="mesa-skin-dialog-note"><ShieldAlert size={14}/> Armadilha descoberta: <strong>{door.trap.name}</strong></p>}
        {door.magicRevealed && door.magicLocked && <p className="mesa-skin-dialog-note"><Sparkles size={14}/> Magia detectada: <strong>Tranca Arcana</strong></p>}
        {isMaster && <>
          <button type="button" className="mesa-skin-move-action" onClick={() => run(door.open ? "close" : "open", true)}><DoorOpen size={19}/><span><strong>{door.open ? "Fechar (Mestre)" : "Abrir como Mestre"}</strong><small>Sem teste</small></span></button>
          {(door.locked || door.trap) && <p className="mesa-skin-dialog-note">{door.locked ? `CD para abrir ${effectiveLockDc(door, DEFAULT_DOOR_LOCK_DC)}${door.magicLocked ? ` (com Tranca Arcana; Misticismo ${door.magicDc ?? 20} para detectar)` : ""}` : ""}{door.trap ? ` · Armadilha "${door.trap.name}" (${door.trap.armed ? "armada" : "desarmada"}): Percepção ${door.trap.detectDc}, Desarmar (Ladinagem) ${door.trap.disarmDc}` : ""}</p>}
        </>}
        <button type="button" className="mesa-skin-dialog-back" onClick={closeDoorDialog}>Fechar</button>
      </section>
    </div>
  );
}
