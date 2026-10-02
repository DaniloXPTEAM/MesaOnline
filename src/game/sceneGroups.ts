import type { SceneState } from "./types";

/**
 * "Cena" = grupo de mapas. Cada mapa continua sendo uma entrada em SCENES (o motor não muda); o campo
 * `group` diz a qual cena ele pertence. Mapas antigos, sem grupo, ficam em "Cena 1".
 */
export const DEFAULT_SCENE_GROUP = "Cena 1";

export const sceneGroupOf = (scene: Pick<SceneState, "group">): string => scene.group?.trim() || DEFAULT_SCENE_GROUP;

/** Agrupa na ordem em que as cenas foram criadas. */
export function groupScenes<T extends Pick<SceneState, "group">>(scenes: readonly T[]): Array<{ name: string; scenes: T[] }> {
  const groups: Array<{ name: string; scenes: T[] }> = [];
  for (const scene of scenes) {
    const name = sceneGroupOf(scene);
    const found = groups.find((group) => group.name === name);
    if (found) found.scenes.push(scene);
    else groups.push({ name, scenes: [scene] });
  }
  return groups;
}

/** Próximo nome livre: "Cena 2", "Cena 3"... */
export function nextSceneGroupName(scenes: readonly Pick<SceneState, "group">[]): string {
  const used = new Set(scenes.map(sceneGroupOf));
  for (let index = 1; ; index += 1) if (!used.has(`Cena ${index}`)) return `Cena ${index}`;
}
