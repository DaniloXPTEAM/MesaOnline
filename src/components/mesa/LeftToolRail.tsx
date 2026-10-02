import type { LucideIcon } from "lucide-react";

export interface MesaRailItem {
  id: string;
  label: string;
  /** Nome acessível quando o rótulo de 1 coluna precisa continuar curto. */
  ariaLabel?: string;
  icon: LucideIcon;
  group?: "tools" | "global";
  disabled?: boolean;
  badge?: string | number;
}

/**
 * Rótulos curtos para a coluna: o nome completo continua no `title` e no
 * cabeçalho da gaveta, mas "Combate e iniciativa" não cabe em 62–96px.
 */
const SHORT_LABEL: Record<string, string> = {
  scenes: "Cenas e mapas",
  roster: "Personagem",
  combat: "Combate",
  compendium: "Inventário",
  sheets: "Fichas",
  environment: "Ambiente",
  history: "Diário",
  jukebox: "Jukebox",
  automation: "Macros / Jukebox",
  online: "Online",
  settings: "Configurações",
};

interface Props {
  items: MesaRailItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
}

/**
 * Navegação principal da Mesa, no padrão das referências: uma coluna à
 * esquerda com ícone + rótulo. As ferramentas de tabuleiro NÃO moram mais
 * aqui — elas foram para a barra horizontal sobre o mapa, senão a coluna
 * passava de 20 itens e cortava o final da lista.
 */
export default function LeftToolRail({ items, activeId, onSelect }: Props) {
  return (
    <nav className="mesa-tool-rail" aria-label="Painéis da mesa">
      <div className="mesa-rail-crest" aria-hidden="true"><i/><b>20</b></div>
      <div className="mesa-rail-scroll">
        {items.map((item, index) => {
          const Icon = item.icon;
          const separator = index > 0 && item.group !== items[index - 1]?.group;
          return <span className={separator ? "mesa-rail-item has-separator" : "mesa-rail-item"} key={item.id}>
            <button
              className={activeId === item.id ? "active" : ""}
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
              title={item.label}
              aria-label={item.ariaLabel ?? item.label}
              data-tip={SHORT_LABEL[item.id] ?? item.label}
              aria-pressed={activeId === item.id}
            >
              <Icon/>
              <em className="mesa-rail-tip">{SHORT_LABEL[item.id] ?? item.label}</em>
              {item.badge !== undefined && <i className="mesa-rail-badge">{item.badge}</i>}
            </button>
          </span>;
        })}
      </div>
      <div className="mesa-rail-coin" aria-hidden="true"/>
    </nav>
  );
}
