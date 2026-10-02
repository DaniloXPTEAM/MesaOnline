import { Shield, X } from "lucide-react";
import { canControlToken } from "../../game/permissions";
import type { RuntimeSnapshot } from "../../game/types";
import { appendChat } from "../../game/vttBridge";
import { executeAnswerReaction } from "../../tactics/engine/runtimeCommands";

/**
 * Prompt de reação: aparece para o dono do alvo (e para o Mestre) quando um ataque ou magia
 * hostil está pausado esperando a escolha de uma reação (tactics/engine/reactionWindow.ts).
 * Reaproveita as classes do diálogo de ações da máscara V5; não cria estilo próprio.
 */
export default function ReactionPrompt({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const pending = snapshot.combat.pendingReaction;
  if (!pending) return null;
  const reactor = snapshot.board.tokens.find((token) => token.id === pending.reactorId);
  const isMaster = snapshot.multiplayer.role !== "player";
  if (!reactor || !(isMaster || canControlToken(snapshot.multiplayer, reactor))) return null;
  const answer = (actionId: string | null) => {
    try { executeAnswerReaction(pending.id, actionId); }
    catch (error) { appendChat({ author: "Sistema", text: (error as Error).message, kind: "system" }); }
  };
  return (
    <div className="mesa-skin-action-backdrop" role="presentation">
      <section className="mesa-skin-action-dialog scroll-tray" role="dialog" aria-modal="true" aria-label="Reação">
        <header>
          <span><Shield size={18}/></span>
          <div><small>REAÇÃO</small><strong>{pending.reactorName} pode reagir</strong></div>
          <button type="button" onClick={() => answer(null)} aria-label="Não reagir"><X size={18}/></button>
        </header>
        <p className="mesa-skin-dialog-note"><strong>{pending.actorName}</strong> usa <strong>{pending.actionName}</strong> contra {pending.reactorName}. Usar uma reação agora?</p>
        {pending.options.map((option) => (
          <button type="button" key={option.actionId} className="mesa-skin-move-action" onClick={() => answer(option.actionId)}>
            <Shield size={19}/><span><strong>{option.name}</strong><small>{option.pmCost ? `${option.pmCost} PM` : "sem custo"} · antes do golpe</small></span>
          </button>
        ))}
        <button type="button" className="mesa-skin-dialog-back" onClick={() => answer(null)}>Não reagir</button>
      </section>
    </div>
  );
}
