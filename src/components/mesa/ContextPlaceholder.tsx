import { ChevronRight, CloudFog, Grid3X3, Map, MousePointerClick, Shield, Swords, Users } from "lucide-react";
import { selectToken } from "../../game/vttBridge";
import type { RuntimeSnapshot, TacticalUnitView } from "../../game/types";

interface Props {
  snapshot: RuntimeSnapshot;
  units: TacticalUnitView[];
  mode: "exploration" | "combat";
}

/**
 * Nas referências o painel da direita nunca some: quando nenhum token está
 * selecionado ele mostra o estado da cena em vez de deixar um buraco no
 * layout (e o mapa pulando de largura a cada clique).
 */
export default function ContextPlaceholder({ snapshot, units, mode }: Props) {
  const heroes = units.filter((unit) => unit.side === "heroes");
  const threats = units.filter((unit) => unit.side === "threats");
  const active = units.find((unit) => unit.id === snapshot.combat.activeTokenId);
  const map = snapshot.board.map;
  const weatherLabel = ({ clear: "Limpo", rain: "Chuva", snow: "Neve", embers: "Cinzas", fog: "Névoa", tormenta: "Tormenta", storm: "Tempestade" } as Record<string, string>)[snapshot.board.weather] || snapshot.board.weather;

  return (
    // Sem a classe `mesa-token-context`: este painel é o estado ocioso da
    // coluna, não o painel de um token. Quem inspeciona o DOM (e os testes de
    // estado visual) continua distinguindo "nenhum token aberto".
    <aside className="mesa-context-idle">
      <header className="mesa-context-head is-idle">
        <span className="mesa-context-portrait idle" aria-hidden="true"><MousePointerClick/></span>
        <div className="mesa-context-identity">
          <small>{mode === "combat" ? "Combate" : "Exploração"}</small>
          <strong>Nenhum token selecionado</strong>
          <em>Clique em um token do mapa para abrir o painel dele.</em>
        </div>
      </header>

      <div className="mesa-context-body">
        {/* Estado real da cena: nada aqui é decorativo, tudo vem do BOARD. */}
        <div className="mesa-stat-grid">
          <span className="mesa-stat"><i><Users/></i><small>Heróis</small><b>{heroes.length}</b></span>
          <span className="mesa-stat"><i><Shield/></i><small>Ameaças</small><b>{threats.length}</b></span>
          <span className="mesa-stat"><i><Grid3X3/></i><small>Grade</small><b>{map.cols}×{map.rows}</b></span>
          <span className="mesa-stat"><i><CloudFog/></i><small>Fog</small><b>{snapshot.board.fog.length}</b></span>
          <span className="mesa-stat"><i><Map/></i><small>Cenas</small><b>{snapshot.scenes.length}</b></span>
          <span className="mesa-stat"><i><Swords/></i><small>Clima</small><b>{weatherLabel}</b></span>
        </div>

        {mode === "combat" && <div className="mesa-idle-turn">
          <small>Rodada {snapshot.combat.round || "—"}</small>
          <strong>{active ? `${active.name} está agindo` : "Aguardando iniciativa"}</strong>
        </div>}

        {units.length
          ? <section className="mesa-block">
              <h4><Users/>Na cena<em>{units.length}</em></h4>
              <div className="mesa-idle-roster">{units.map((unit) => <button key={unit.id} onClick={() => selectToken(unit.id)} className={unit.side}>
                <span className="mesa-mini-portrait">{unit.portrait ? <img src={unit.portrait} alt=""/> : unit.symbol}</span>
                <span><strong>{unit.name}</strong><small>PV {unit.pv}/{unit.pvMax} · DEF {unit.defense}</small></span>
                <ChevronRight/>
              </button>)}</div>
            </section>
          : null}

        <div className="mesa-idle-hint">
          <Swords/>
          <span>
            <strong>{mode === "combat" ? "Escolha quem vai agir" : "Cena em exploração"}</strong>
            <small>
              {mode === "combat"
                ? "Selecione a unidade da vez para ver movimento, ataques, magias e itens."
                : "Use o Elenco para trazer personagens e ameaças, e a barra acima do mapa para as ferramentas de cena."}
            </small>
          </span>
        </div>
      </div>
    </aside>
  );
}
