import { PackageOpen } from "lucide-react";
import type { CSSProperties } from "react";
import { Token } from "../mesaSkin/components/MapArea";
import type { SkinMapToken } from "../mesaSkin/runtime";
import { ISO_STAGE_SIZE, isoPoint, rotateCell, type StageRotation } from "../../game/isoView";
import type { BattleMap, BoardObject } from "../../game/types";
import { isoLayout } from "../../tactics/iso-layout";
import IsometricMapCanvas from "../IsometricMapCanvas";

/** Caixa em que o token é desenhado (o token se centraliza nela) e quanto ele sobe acima do centro da célula. */
const BOX = 120;
const RAISE = 22;

export interface IsoTokenEntry { token: SkinMapToken; gx: number; gy: number }

interface Props {
  map: BattleMap;
  rotation: StageRotation;
  tokens: IsoTokenEntry[];
  objects: BoardObject[];
  fog: Set<string>;
  reach: Set<string>;
  pendingMove: string | null;
  aura: Set<string>;
  view: "explore" | "combat";
  onCellClick: (x: number, y: number) => void;
  onCellHover: (x: number, y: number) => void;
  onTokenSelect: (id: string) => void;
}

/**
 * Visão isométrica do palco. Religa o V3 (`components/BattleBoard.tsx` IsometricBoard,
 * `IsometricMapCanvas.tsx`, `tactics/iso-layout.ts`): o mapa vem do canvas (arte isométrica dedicada
 * ou a imagem 2D projetada de uma vez, com faces laterais nas células elevadas) e as células são losangos
 * clicáveis sobre ele. Os tokens são os MESMOS do 2D (componente da máscara V5), de pé sobre a célula e
 * mais altos nas células elevadas, no lugar dos cartões do V3. Cores de alcance, destino, aura e névoa
 * são as do 2D.
 */
export default function IsoStage({ map, rotation, tokens, objects, fog, reach, pendingMove, aura, view, onCellClick, onCellHover, onTokenSelect }: Props) {
  const layout = isoLayout(map, rotation / 90);
  const cells = Array.from({ length: map.cols * map.rows }, (_, index) => ({ x: index % map.cols, y: Math.floor(index / map.cols) }))
    .sort((a, b) => {
      const ar = rotateCell(a.x, a.y, map.cols, map.rows, rotation);
      const br = rotateCell(b.x, b.y, map.cols, map.rows, rotation);
      return ar.x + ar.y - (br.x + br.y);
    });
  const depth = (gx: number, gy: number) => { const r = rotateCell(gx, gy, map.cols, map.rows, rotation); return r.x + r.y; };
  const diamond = (cx: number, cy: number) => `${cx},${cy - layout.tileH / 2} ${cx + layout.tileW / 2},${cy} ${cx},${cy + layout.tileH / 2} ${cx - layout.tileW / 2},${cy}`;
  const tokenScale = layout.tileW / 52;

  return (
    <div className="mesa-iso-stage" data-iso-stage style={{ position: "relative", width: ISO_STAGE_SIZE.width, height: ISO_STAGE_SIZE.height }}>
      {map.image || map.isoImage
        ? <IsometricMapCanvas map={map} rotation={rotation}/>
        : <div className="empty-map">Importe um mapa em Cenas e mapas</div>}
      <svg viewBox={`0 0 ${ISO_STAGE_SIZE.width} ${ISO_STAGE_SIZE.height}`} width={ISO_STAGE_SIZE.width} height={ISO_STAGE_SIZE.height} style={{ position: "absolute", inset: 0, overflow: "visible" } as CSSProperties} role="img" aria-label={`${map.name}, visão isométrica`}>
        {cells.map(({ x, y }) => {
          const key = `${x},${y}`;
          const p = isoPoint(map, x, y, rotation);
          const fill = fog.has(key) ? "rgba(3,4,5,.72)"
            : pendingMove === key ? "rgba(96,176,244,.42)"
              : reach.has(key) ? "rgba(96,176,244,.22)"
                : aura.has(key) ? "rgba(217,169,76,.12)"
                  : "transparent";
          const stroke = pendingMove === key ? "#bfe4ff" : reach.has(key) ? "rgba(124,196,255,.55)" : aura.has(key) ? "rgba(217,169,76,.28)" : "rgba(var(--mxr-218-202-170),.06)";
          return <polygon key={key} data-cell={key} data-cell-x={x} data-cell-y={y} points={diamond(p.x, p.y)} fill={fill} stroke={stroke} strokeWidth={pendingMove === key ? 2 : 1}
            style={{ cursor: "pointer" }} onClick={(event) => { event.stopPropagation(); onCellClick(x, y); }} onMouseEnter={() => onCellHover(x, y)}/>;
        })}
        {[
          ...objects.map((object) => ({ kind: "object" as const, id: object.id, gx: object.x, gy: object.y, object })),
          ...tokens.map((entry) => ({ kind: "token" as const, id: entry.token.id, gx: entry.gx, gy: entry.gy, entry })),
        ].sort((a, b) => depth(a.gx, a.gy) - depth(b.gx, b.gy)).map((item) => {
          const p = isoPoint(map, item.gx, item.gy, rotation);
          return (
            <foreignObject key={`${item.kind}-${item.id}`} x={p.x} y={p.y} width={1} height={1} style={{ overflow: "visible" }}>
              <div style={{ position: "absolute", left: -BOX / 2, top: -BOX / 2 - RAISE, width: BOX, height: BOX, transform: `scale(${tokenScale})`, transformOrigin: `${BOX / 2}px ${BOX / 2 + RAISE}px` }}>
                {item.kind === "token"
                  ? <Token token={{ ...item.entry.token, x: 50, y: 50 }} mode={view} index={0} onSelect={() => onTokenSelect(item.entry.token.id)}/>
                  : <button className={`next-object ${item.object.kind}`} style={{ left: "50%", top: "50%" }} onClick={(event) => { event.stopPropagation(); }}><PackageOpen/><small>{item.object.name}</small></button>}
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
