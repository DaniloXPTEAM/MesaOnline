/**
 * IMPORTADOR UVTT (Universal VTT / .dd2vtt — Dungeondraft e similares).
 *
 * Recuperado de `Vtt/app.js` (`importarUVTT`, `onUVTTFile`).
 * Valor prático: o arquivo traz mapa, escala, paredes, portas e luzes juntos,
 * evitando reconstruir a cena à mão.
 *
 * Suporta as duas formas que aparecem na prática:
 *   - padrão UVTT: `line_of_sight` (arrays de pontos), `portals`, `lights`,
 *     `resolution.pixels_per_grid`, `resolution.map_size`, `image` em base64;
 *   - forma legada lida pelo VTT antigo: `walls` / `portals` com x,y,x2,y2.
 *
 * Coordenadas UVTT já vêm em CÉLULAS de grade — é o mesmo espaço do BOARD,
 * então não há conversão de pixels aqui.
 */
import type { BattleMap, BoardLight, BoardWall } from "./types";

export interface UvttResult {
  map: BattleMap;
  walls: BoardWall[];
  lights: BoardLight[];
  /** metros por célula declarados/derivados do arquivo */
  scale: number;
  aviso?: string;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? v as Json : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const num = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

function ponto(v: unknown): { x: number; y: number } | null {
  const p = obj(v);
  if (p.x === undefined || p.y === undefined) return null;
  return { x: num(p.x), y: num(p.y) };
}

function uid(prefix: string, index: number) {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

/** `true` se o objeto tem cara de UVTT. */
export function isUvtt(data: unknown): boolean {
  const d = obj(data);
  return Boolean(d.line_of_sight || d.portals || d.resolution || d.walls);
}

export function parseUvtt(data: unknown, nome = "Mapa UVTT"): UvttResult {
  const d = obj(data);
  const resolution = obj(d.resolution);
  const mapSize = obj(resolution.map_size);
  const origin = obj(resolution.map_origin);
  const offsetX = num(origin.x);
  const offsetY = num(origin.y);

  const cols = Math.max(1, Math.round(num(mapSize.x, 20)));
  const rows = Math.max(1, Math.round(num(mapSize.y, 20)));

  // UVTT nao declara metros por celula; o padrao de mesa e 1,5 m (T20).
  const scale = num(obj(d.environment).scale, 0) || 1.5;

  const walls: BoardWall[] = [];
  let indice = 0;

  // padrao: line_of_sight = lista de POLILINHAS
  for (const linha of [...arr(d.line_of_sight), ...arr(d.objects_line_of_sight)]) {
    const pontos = arr(linha).map(ponto).filter(Boolean) as Array<{ x: number; y: number }>;
    for (let i = 0; i + 1 < pontos.length; i += 1) {
      walls.push({
        id: uid("uvtt-wall", indice++), type: "wall",
        x1: pontos[i].x - offsetX, y1: pontos[i].y - offsetY,
        x2: pontos[i + 1].x - offsetX, y2: pontos[i + 1].y - offsetY,
      });
    }
  }

  // forma legada: walls com x,y,x2,y2
  for (const bruto of arr(d.walls)) {
    const w = obj(bruto);
    if (w.x === undefined || w.x2 === undefined) continue;
    walls.push({
      id: uid("uvtt-wall", indice++),
      type: w.type === "door" || w.type === "window" ? w.type : "wall",
      x1: num(w.x) - offsetX, y1: num(w.y) - offsetY,
      x2: num(w.x2) - offsetX, y2: num(w.y2) - offsetY,
    });
  }

  // portais viram portas/janelas, com estado real
  for (const bruto of arr(d.portals)) {
    const p = obj(bruto);
    const bounds = arr(p.bounds).map(ponto).filter(Boolean) as Array<{ x: number; y: number }>;
    const tipo: BoardWall["type"] = p.type === "window" ? "window" : "door";
    const fechado = p.closed === undefined ? true : Boolean(p.closed);
    if (bounds.length >= 2) {
      walls.push({
        id: uid("uvtt-portal", indice++), type: tipo,
        x1: bounds[0].x - offsetX, y1: bounds[0].y - offsetY,
        x2: bounds[1].x - offsetX, y2: bounds[1].y - offsetY,
        open: !fechado,
      });
    } else if (p.x !== undefined && p.x2 !== undefined) {
      walls.push({
        id: uid("uvtt-portal", indice++), type: tipo,
        x1: num(p.x) - offsetX, y1: num(p.y) - offsetY,
        x2: num(p.x2) - offsetX, y2: num(p.y2) - offsetY,
        open: !fechado,
      });
    }
  }

  const lights: BoardLight[] = [];
  arr(d.lights).forEach((bruto, i) => {
    const l = obj(bruto);
    const pos = ponto(l.position) || ponto(l);
    if (!pos) return;
    lights.push({
      id: uid("uvtt-light", i),
      x: Math.round(pos.x - offsetX), y: Math.round(pos.y - offsetY),
      type: "torch", name: `Luz ${i + 1}`,
      radius: Math.max(1, num(l.range, 4) * scale),
      color: normalizaCor(String(l.color || "")),
      intensity: Math.min(1, Math.max(0.1, num(l.intensity, 1))),
      enabled: true,
    });
  });

  const imagem = typeof d.image === "string" && d.image
    ? (d.image.startsWith("data:") ? d.image : `data:image/png;base64,${d.image}`)
    : "";

  const armada = obj(d.armada);
  const map: BattleMap = {
    id: `uvtt-${Date.now()}`, name: nome, location: "Importado de UVTT",
    image: imagem, cols, rows, terrain: {}, custom: true,
    ...(Number.isFinite(Number(armada.offsetX)) && armada.offsetX !== undefined ? { offsetX: num(armada.offsetX) } : {}),
    ...(Number.isFinite(Number(armada.offsetY)) && armada.offsetY !== undefined ? { offsetY: num(armada.offsetY) } : {}),
    ...(num(armada.imageScale, 0) > 0 ? { imageScale: num(armada.imageScale) } : {}),
  };

  const aviso = !imagem ? "O arquivo não trazia imagem embutida; importe o mapa à parte." : undefined;
  return { map, walls, lights, scale, aviso };
}

/** UVTT usa AARRGGBB ou RRGGBB; devolve #RRGGBB. */
function normalizaCor(valor: string): string {
  const limpo = valor.replace(/^#/, "");
  if (limpo.length === 8) return `#${limpo.slice(2)}`;
  if (limpo.length === 6) return `#${limpo}`;
  return "#ffb765";
}
