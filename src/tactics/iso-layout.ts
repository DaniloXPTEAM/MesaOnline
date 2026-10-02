import type {BattleMap} from '../game/types';
export function isoLayout(map:BattleMap,step:number){
 const scale=Math.min(1,28/(map.cols+map.rows));
 const settings=map.isoGrid;
 const tileW=map.isoImage?(settings?.tileWidth||52)*scale:52*scale;
 return {scale,tileW,tileH:tileW*27/52,originX:map.isoImage?(settings?.x??500):500+(step%2?map.cols-map.rows:map.rows-map.cols)*tileW/4,
 originY:map.isoImage?(settings?.y??240):112,elevationStep:map.isoImage?0:15*scale};
}
