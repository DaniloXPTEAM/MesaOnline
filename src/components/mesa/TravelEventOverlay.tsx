import { Map as MapIcon, Swords, X } from "lucide-react";
import { useState } from "react";
import { groupScenes } from "../../game/sceneGroups";
import type { TravelEvent } from "../../game/travel";
import type { SceneState } from "../../game/types";

/**
 * "Houve um encontro!" no palco, para todos. O Mestre escolhe o mapa do cenário (já vem o que foi preparado na Viagem) e
 * vai até ele; só o Mestre fecha. Os jogadores veem o aviso e a descrição.
 */
export default function TravelEventOverlay({ event, isMaster, scenes, preparedSceneId, onGoToScene, onClose }: {
  event: TravelEvent;
  isMaster: boolean;
  scenes: SceneState[];
  preparedSceneId?: string;
  onGoToScene: (sceneId: string) => void;
  onClose: () => void;
}) {
  const [sceneId, setSceneId] = useState(preparedSceneId && scenes.some((scene) => scene.id === preparedSceneId) ? preparedSceneId : "");
  return (
    <div className="mesa-travel-event" role="dialog" aria-label="Encontro da viagem" onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
      <div className="mesa-travel-event-card">
        <small>DIA {event.day} DA VIAGEM</small>
        <h2><Swords size={22}/>{event.title}</h2>
        <p>{event.text}</p>
        {event.pag && <em>{event.pag}</em>}
        {isMaster && <div className="mesa-travel-event-master">
          <label>Mapa do encontro
            <select value={sceneId} onChange={(e) => setSceneId(e.target.value)}>
              <option value="">Ficar neste mapa</option>
              {groupScenes(scenes).map((group) => <optgroup key={group.name} label={group.name}>{group.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</optgroup>)}
            </select>
          </label>
          <div>
            <button type="button" className="primary" onClick={() => { if (sceneId) onGoToScene(sceneId); onClose(); }}><MapIcon size={16}/>{sceneId ? "Ir para o mapa do encontro" : "Começar o encontro"}</button>
            <button type="button" aria-label="Fechar encontro" onClick={onClose}><X size={16}/>Fechar</button>
          </div>
        </div>}
      </div>
    </div>
  );
}
