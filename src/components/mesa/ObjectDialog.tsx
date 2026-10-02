import { Backpack, Box, Hand, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_CHEST_LOCK_DC, effectiveLockDc, withinReach } from "../../game/chest";
import { canControlToken } from "../../game/permissions";
import type { RuntimeSnapshot } from "../../game/types";
import { appendChat } from "../../game/vttBridge";
import { arcaneLockCost, executeObjectAction, knowsArcaneLock, type ObjectAction } from "../../tactics/engine/objectCommands";
import { closeObjectDialog, requestObjectEdit, useStageControl } from "./mapStageControl";

/**
 * Diálogo do baú: o jogador escolhe quem interage e o que tenta (abrir, arrombar, forçar,
 * procurar armadilha, desarmar). Quem rola e decide é o Mestre (objectCommands.ts). Reaproveita
 * as classes do diálogo de ações da máscara V5; a configuração do baú fica na gaveta do Mestre.
 */
export default function ObjectDialog({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { focusedObjectId } = useStageControl();
  const object = snapshot.board.objects.find((entry) => entry.id === focusedObjectId);
  const isMaster = snapshot.multiplayer.role !== "player";
  const actors = object
    ? snapshot.board.tokens.filter((token) => !token.hidden && !token.defeated && canControlToken(snapshot.multiplayer, token) && withinReach(token, object))
    : [];
  const [actorId, setActorId] = useState<string>("");
  useEffect(() => {
    if (!actors.some((token) => token.id === actorId)) setActorId(actors[0]?.id || "");
  }, [focusedObjectId, actors.map((token) => token.id).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  // Ao abrir o baú, o diálogo sai da frente para a animação do conteúdo aparecer para todos.
  // Itens marcados para pegar (índices do conteúdo).
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => { setPicked([]); }, [focusedObjectId, object?.contents.length]);
  const wasOpened = useRef(false);
  const openedNow = Boolean(object?.opened);
  useEffect(() => { wasOpened.current = openedNow; }, [focusedObjectId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (object && openedNow && !wasOpened.current) closeObjectDialog();
    wasOpened.current = openedNow;
  }, [openedNow]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!object) return null;

  const run = (action: ObjectAction, asMaster = false, indexes?: number[]) => {
    try { executeObjectAction(asMaster ? null : actorId || null, object.id, action, indexes); }
    catch (error) { appendChat({ author: "Sistema", text: (error as Error).message, kind: "system" }); }
  };
  const trap = object.trap;
  const actor = snapshot.board.tokens.find((token) => token.id === actorId);
  const arcane = Boolean(actor && knowsArcaneLock(actor));
  const noActor = !actorId;
  const state = object.opened ? "Aberto" : object.locked ? "Trancado" : "Fechado";

  return (
    <div className="mesa-skin-action-backdrop" role="presentation" onMouseDown={closeObjectDialog}>
      <section className="mesa-skin-action-dialog scroll-tray" role="dialog" aria-modal="true" aria-label={object.name} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <span><Box size={18}/></span>
          <div><small>{state.toUpperCase()}</small><strong>{object.name}</strong>{object.description && <em className="mesa-object-description">{object.description}</em>}</div>
          <button type="button" onClick={closeObjectDialog} aria-label="Fechar"><X size={18}/></button>
        </header>

        {object.opened && <div className="chest-contents">
          {object.contents.length
            ? object.contents.map((item, index) => actors.length
              ? <button type="button" key={`${item}-${index}`} className={picked.includes(index) ? "selected" : undefined} aria-pressed={picked.includes(index)} onClick={() => setPicked((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])}>{item}</button>
              : <span key={`${item}-${index}`}>{item}</span>)
            : <em>Vazio.</em>}
        </div>}
        {object.opened && object.contents.length > 0 && actors.length > 0 && <>
          <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("take", false, picked)}><Backpack size={19}/><span><strong>{picked.length ? "Pegar marcados" : "Pegar tudo"}</strong><small>Vai para a mochila da ficha</small></span></button>
        </>}
        {object.magicRevealed && object.magicLocked && <p className="mesa-skin-dialog-note"><Sparkles size={14}/> Magia detectada: <strong>Tranca Arcana</strong></p>}
        {trap?.revealed && trap.armed && <p className="mesa-skin-dialog-note"><ShieldAlert size={14}/> Armadilha descoberta: <strong>{trap.name}</strong></p>}

        {!object.opened && (actors.length
          ? <>
            <label className="mesa-skin-dialog-note">Quem interage
              <select value={actorId} onChange={(event) => setActorId(event.target.value)}>{actors.map((token) => <option key={token.id} value={token.id}>{token.name}</option>)}</select>
            </label>
            <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("open")}><Hand size={19}/><span><strong>Abrir</strong><small>{object.locked ? "Está trancado" : "Destrancado"}</small></span></button>
            {object.locked && <>
              <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("unlock")}><Hand size={19}/><span><strong>Arrombar</strong><small>Ladinagem · ação completa · sem gazua –5</small></span></button>
              <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("force")}><Hand size={19}/><span><strong>Forçar</strong><small>Teste de Força</small></span></button>
            </>}
            {arcane && object.locked && <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("arcane-open")}><Sparkles size={19}/><span><strong>Abrir com Tranca Arcana</strong><small>{arcaneLockCost("open")} PM · ação padrão</small></span></button>}
            {arcane && !object.locked && <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("arcane-lock")}><Sparkles size={19}/><span><strong>Trancar com Tranca Arcana</strong><small>{arcaneLockCost("lock")} PM · ação padrão</small></span></button>}
            <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("search")}><Search size={19}/><span><strong>Procurar armadilha</strong><small>Teste de Percepção</small></span></button>
            <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("recognize")}><Sparkles size={19}/><span><strong>Detectar magia</strong><small>Teste de Misticismo</small></span></button>
            {trap?.revealed && trap.armed && <button type="button" className="mesa-skin-move-action" disabled={noActor} onClick={() => run("disarm")}><ShieldAlert size={19}/><span><strong>Desarmar</strong><small>Teste de Ladinagem</small></span></button>}
          </>
          : <p className="mesa-skin-dialog-note">Chegue perto (casa adjacente) com um personagem seu para interagir.</p>)}

        {isMaster && <>
          <button type="button" className="mesa-skin-move-action" onClick={() => requestObjectEdit(object.id)}><Box size={19}/><span><strong>Configurar</strong><small>Nome, imagem, descrição, conteúdo, fechadura e armadilha</small></span></button>
          <button type="button" className="mesa-skin-move-action" onClick={() => run(object.opened ? "close" : "open", true)}><Box size={19}/><span><strong>{object.opened ? "Fechar (Mestre)" : "Abrir como Mestre"}</strong><small>Sem teste e sem armadilha</small></span></button>
          {(trap || object.locked || object.magicLocked) && <p className="mesa-skin-dialog-note">CD para abrir {effectiveLockDc(object, DEFAULT_CHEST_LOCK_DC)}{object.magicLocked ? ` (com Tranca Arcana; Misticismo ${object.magicDc ?? 20} para detectar)` : ""}{trap ? ` · Armadilha "${trap.name}" (${trap.armed ? "armada" : "desarmada"}): Percepção ${trap.detectDc}, Desarmar (Ladinagem) ${trap.disarmDc}` : ""}</p>}
        </>}
        <button type="button" className="mesa-skin-dialog-back" onClick={closeObjectDialog}>Fechar</button>
      </section>
    </div>
  );
}
