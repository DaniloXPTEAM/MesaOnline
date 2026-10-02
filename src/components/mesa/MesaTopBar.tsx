import {
  ChevronRight, Crown, DoorOpen, Lightbulb, Map, Music2, Radio, Settings2,
  Shield, Swords, Users, WandSparkles, Wifi, WifiOff, type LucideIcon,
} from "lucide-react";
import type { MultiplayerState } from "../../game/types";

/**
 * Acesso rápido do topo, espelhando o cluster de ícones da referência.
 * São atalhos para os MESMOS painéis da coluna esquerda — não é uma segunda
 * navegação com destinos próprios, apenas um caminho mais curto para os seis
 * painéis mais usados durante a sessão.
 */
const QUICK_PANELS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "scenes", label: "Trocar de cena", icon: Map },
  { id: "roster", label: "Personagens na cena", icon: Users },
  { id: "jukebox", label: "Trilha sonora", icon: Music2 },
  { id: "environment", label: "Iluminação e clima", icon: Lightbulb },
  { id: "automation", label: "Atalhos de rolagem", icon: WandSparkles },
  { id: "online", label: "Sala multijogador", icon: Radio },
];

interface Props {
  mode: "exploration" | "combat";
  combatActive: boolean;
  canManageCombat: boolean;
  sceneName: string;
  sceneLocation?: string;
  multiplayer: MultiplayerState;
  onExit?: () => void;
  onToggleCombat: () => void;
  /** Painel aberto no momento, para marcar o atalho correspondente. */
  activePanel?: string | null;
  /** Abre/fecha um painel a partir do cluster de atalhos. */
  onQuickPanel?: (id: string) => void;
}

export default function MesaTopBar({ mode, combatActive, canManageCombat, sceneName, sceneLocation, multiplayer, onExit, onToggleCombat, activePanel, onQuickPanel }: Props) {
  const connected = multiplayer.status === "connected";
  const role = multiplayer.role === "player" ? "Jogador" : multiplayer.role === "master" ? "Mestre" : "Mesa local";
  // A composição-base das duas referências usa uma campanha nomeada, não um
  // chip genérico de sessão local. Em salas remotas o código continua visível
  // no título/tooltip de presença, mas a lâmina preserva o cabeçalho da mesa.
  const sessionLabel = "A Queda de Valrion";
  const playerRestrictedQuickPanels = new Set(["environment", "automation", "online"]);
  // Em exploração, Jogador não recebe um grande botão de combate inativo. Se
  // o Mestre iniciar uma batalha, o controle reaparece como "Abrir combate".
  const showCombatToggle = !(multiplayer.role === "player" && mode === "exploration" && !combatActive);
  const combatButton = mode === "combat"
    ? canManageCombat
      ? { label: "Encerrar combate", detail: "Retornar à exploração", disabled: false }
      : { label: "Voltar à exploração", detail: "Combate segue sob o Mestre", disabled: false }
    : canManageCombat
      ? { label: "Batalha Tática", detail: "Iniciar combate", disabled: false }
      : combatActive
        ? { label: "Abrir combate", detail: "Seu personagem está em batalha", disabled: false }
        : { label: "Aguardando Mestre", detail: "Combate ainda não iniciado", disabled: true };
  return (
    <header className="mesa-topbar">
      <div className="mesa-topbar-left">
        {onExit
          ? <button className="mesa-exit" onClick={onExit} title="Voltar ao salão da mesa" aria-label="Voltar ao salão da mesa"><DoorOpen/></button>
          : <span className="mesa-exit-placeholder" aria-hidden="true"/>}
        <div className="mesa-brand-mark" aria-hidden="true"><Shield/><i/></div>
        <div className="mesa-brand-copy"><strong>Armada Nexus RPG</strong><small>Mesa Virtual</small></div>

        <div className="mesa-session-chip" aria-label={`Campanha e sessão: ${sessionLabel}`}>
          <small>Campanha</small>
          <strong>{sessionLabel}</strong>
        </div>
        <span className="mesa-scene-sep" aria-hidden="true"><ChevronRight/></span>
        <div className="mesa-scene-name">
          <small>Cenário atual</small>
          <strong>{sceneName}</strong>
          {sceneLocation && <em>{sceneLocation}</em>}
        </div>
      </div>

      <div className="mesa-topbar-right">
        {onQuickPanel && <nav className="mesa-quick-tools" aria-label="Atalhos de painéis">
          {QUICK_PANELS.map((entry) => {
            const Icon = entry.icon;
            return <button
              key={entry.id}
              className={activePanel === entry.id ? "active" : ""}
              disabled={multiplayer.role === "player" && playerRestrictedQuickPanels.has(entry.id)}
              onClick={() => onQuickPanel(entry.id)}
              title={multiplayer.role === "player" && playerRestrictedQuickPanels.has(entry.id) ? `${entry.label} — somente Mestre` : entry.label}
              aria-label={entry.label}
              aria-pressed={activePanel === entry.id}
            ><Icon/><span>{entry.label}</span></button>;
          })}
        </nav>}
        <div className={`mesa-presence ${connected ? "is-online" : "is-local"}`} title={`${role} · ${connected ? "conectado" : "modo local"}`}>
          <span className="mesa-profile-avatar" aria-hidden="true">{role.charAt(0)}</span>
          <span>
            <strong>{role}</strong>
            <small>{sessionLabel}</small>
          </span>
          {connected ? <Wifi className="mesa-presence-status"/> : <WifiOff className="mesa-presence-status"/>}
          {multiplayer.role === "master" && <Crown className="mesa-role-crown"/>}
        </div>
        {showCombatToggle && <button className={`mesa-combat-toggle ${mode === "combat" ? "is-active" : ""}`} disabled={combatButton.disabled} onClick={onToggleCombat} title={combatButton.detail} aria-label={combatButton.label}>
          <Swords/><span><strong>{combatButton.label}</strong><small>{combatButton.detail}</small></span>
        </button>}
      </div>
    </header>
  );
}
