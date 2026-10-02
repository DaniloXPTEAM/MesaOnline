import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Dices, ScrollText } from "lucide-react";
import type { CSSProperties } from "react";
import type { RuntimeSnapshot } from "../../game/types";

interface Props {
  snapshot: RuntimeSnapshot;
  onOpenHistory: () => void;
  /** estado normal = faixa compacta; expandido = histórico detalhado */
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

type RecentItem = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  outcome: string;
  total?: string;
  time?: number;
  tone: "success" | "danger" | "neutral";
};

export default function RecentRollsBar({ snapshot, onOpenHistory, expanded = false, onToggleExpanded }: Props) {
  const recent = recentItems(snapshot).slice(0, expanded ? 12 : 6);
  return (
    <section className={`mesa-recent-bar ${expanded ? "is-expanded" : "is-compact"}`} aria-label="Rolagens recentes">
      <div className="mesa-recent-label">
        <span className="mesa-recent-die" aria-hidden="true"><Dices/></span>
        <span><strong>Últimas rolagens</strong><small>acontecimentos recentes</small></span>
      </div>
      <div className="mesa-recent-list">
        {recent.length
          ? recent.map((item, index) => {
              const token = snapshot.board.tokens.find((entry) => entry.name === item.actor);
              return <motion.article
                key={item.id}
                className={item.tone}
                initial={index === 0 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                style={{ "--roll-accent": token?.accent || "#b98a43" } as CSSProperties}
              >
                <span className="mesa-roll-avatar" aria-hidden="true">
                  {token?.imageUrl ? <img src={token.imageUrl} alt=""/> : <b>{token?.symbol || item.actor.slice(0, 1).toUpperCase()}</b>}
                </span>
                <span className="mesa-roll-who"><b>{item.actor}</b><small>{item.action}</small></span>
                {item.detail && <span className="mesa-roll-formula">{item.detail}</span>}
                {item.total && <strong className="mesa-roll-total">{item.total}</strong>}
                <span className="mesa-roll-meta">
                  {item.outcome && <em>{item.outcome}</em>}
                  {item.time && <i>{new Date(item.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</i>}
                </span>
              </motion.article>;
            })
          : <div className="mesa-recent-empty">
              <ScrollText/><span><strong>A mesa está em silêncio</strong><small>Rolagens, combate e mensagens aparecerão aqui.</small></span>
            </div>}
      </div>
      <div className="mesa-recent-actions">
        <button className="mesa-recent-toggle" onClick={onToggleExpanded} title={expanded ? "Recolher" : "Expandir histórico"} aria-label={expanded ? "Recolher" : "Expandir histórico"} aria-expanded={expanded}>{expanded ? <ChevronDown/> : <ChevronUp/>}</button>
        <button className="mesa-history-button" onClick={onOpenHistory}><ScrollText/><span><strong>Histórico</strong><small>ver sessão</small></span></button>
      </div>
    </section>
  );
}

function recentItems(snapshot: RuntimeSnapshot): RecentItem[] {
  const rolls: RecentItem[] = snapshot.combat.rolls.slice(0, 6).map((roll) => ({
    id: roll.id,
    actor: roll.actor,
    action: roll.action,
    detail: roll.formula,
    total: String(roll.total),
    outcome: roll.outcome,
    time: roll.timestamp,
    tone: roll.success ? "success" : "danger",
  }));
  if (rolls.length >= 3) return rolls;
  const logs: RecentItem[] = snapshot.combat.log.slice(0, 6).map((entry) => ({
    id: entry.id,
    actor: entry.type === "system" ? "Sistema" : "Mesa",
    action: entry.title,
    detail: entry.detail,
    outcome: "",
    time: entry.timestamp,
    tone: entry.tone || "neutral",
  }));
  const chat: RecentItem[] = snapshot.board.chat.slice(-6).reverse().map((entry) => ({
    id: entry.id,
    actor: entry.author,
    action: entry.kind === "roll" ? "Rolagem" : entry.kind === "combat" ? "Combate" : entry.kind === "system" ? "Sistema" : "Mensagem",
    detail: entry.text,
    outcome: "",
    time: entry.timestamp,
    tone: entry.kind === "combat" ? "danger" : "neutral",
  }));
  return [...rolls, ...logs, ...chat].filter((entry, index, list) => list.findIndex((candidate) => candidate.id === entry.id) === index);
}
