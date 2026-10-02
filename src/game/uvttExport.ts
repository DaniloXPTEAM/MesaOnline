/**
 * EXPORTADOR UVTT (Universal VTT / .dd2vtt): caminho inverso de `uvtt.ts`.
 * Sai o mapa da cena com grade, paredes, portas/janelas e luzes; a imagem
 * vai embutida em base64. As coordenadas continuam em células de grade.
 */
import { activeGrid } from "./distance";
import { CELL_PX } from "./mapView";
import type { BoardState } from "./types";

/** Pixels por célula da imagem exportada (o UVTT precisa declarar). */
const DEFAULT_PIXELS_PER_GRID = 70;

const hexColor = (color: string) => `ff${String(color || "#ffb765").replace(/^#/, "").padEnd(6, "0").slice(0, 6)}`;

/** `data:image/png;base64,AAA` → `AAA`. Outros formatos (URL) precisam ser baixados antes. */
export function base64FromDataUrl(image: string): string | null {
  const match = /^data:[^;,]+;base64,(.+)$/.exec(image);
  return match ? match[1] : null;
}

export function buildUvtt(board: BoardState, imageBase64: string, pixelsPerGrid = DEFAULT_PIXELS_PER_GRID): Record<string, unknown> {
  const { map } = board;
  const scale = activeGrid().scale || 1.5;
  const point = (x: number, y: number) => ({ x, y });
  const solid = board.walls.filter((wall) => wall.type === "wall");
  const portals = board.walls.filter((wall) => wall.type === "door" || wall.type === "window");
  return {
    format: 0.3,
    resolution: {
      map_origin: point(0, 0),
      map_size: point(map.cols, map.rows),
      pixels_per_grid: pixelsPerGrid,
    },
    line_of_sight: solid.map((wall) => [point(wall.x1, wall.y1), point(wall.x2, wall.y2)]),
    objects_line_of_sight: [],
    portals: portals.map((wall) => ({
      position: point((wall.x1 + wall.x2) / 2, (wall.y1 + wall.y2) / 2),
      bounds: [point(wall.x1, wall.y1), point(wall.x2, wall.y2)],
      rotation: 0,
      closed: !wall.open,
      freestanding: false,
      type: wall.type === "window" ? "window" : "door",
    })),
    lights: board.lights.filter((light) => light.enabled !== false).map((light) => ({
      position: point(light.x, light.y),
      range: Math.max(0.5, light.radius / scale),
      intensity: light.intensity,
      color: hexColor(light.color),
      shadows: true,
    })),
    environment: { baked_lighting: false, ambient_light: "ffffffff", scale },
    // Extensão própria: ao reimportar aqui, a imagem volta à posição alinhada.
    armada: { offsetX: map.offsetX ?? 0, offsetY: map.offsetY ?? 0, imageScale: map.imageScale ?? 1, cellPx: CELL_PX },
    image: imageBase64,
  };
}

/** Lê a imagem do mapa (data URL ou endereço) e devolve em base64. */
export async function imageToBase64(image: string): Promise<string> {
  const embedded = base64FromDataUrl(image);
  if (embedded) return embedded;
  if (!image) return "";
  const response = await fetch(image);
  const blob = await response.blob();
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let index = 0; index < buffer.length; index += 0x8000) binary += String.fromCharCode(...buffer.subarray(index, index + 0x8000));
  return btoa(binary);
}

export async function exportUvtt(board: BoardState): Promise<Record<string, unknown>> {
  return buildUvtt(board, await imageToBase64(board.map.image));
}
