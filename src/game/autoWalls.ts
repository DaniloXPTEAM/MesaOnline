/**
 * Paredes automáticas: lê a imagem do mapa e propõe segmentos de parede sobre a grade.
 *
 * Não havia detecção de paredes por imagem nesta base (busquei em `src/`); esta é uma heurística nossa e vale como ponto de partida:
 * o Mestre ajusta ou apaga o que não servir (cada parede automática é marcada `auto` e pode ser removida de uma vez).
 *
 *  - "dark"  (áreas escuras): a célula é "sólida" se a maior parte dos pixels for escura (mapas de masmorra com rocha/vazio
 *    em preto); há parede onde uma célula sólida encosta numa não sólida.
 *  - "edges" (contornos): há parede entre duas células vizinhas quando a cor média muda muito de uma para a outra
 *    (paredes desenhadas com traço grosso). Segmentos soltos de 1 casa são descartados para reduzir ruído.
 *
 * As coordenadas são as da grade (vértices, em casas), as mesmas de `BoardWall`.
 */
export type AutoWallMode = "dark" | "edges";

export interface RasterImage { width: number; height: number; data: ArrayLike<number> }
export interface AutoWallSegment { x1: number; y1: number; x2: number; y2: number }
export interface AutoWallOptions { mode: AutoWallMode; /** 0 (poucas paredes) a 1 (muitas) */ sensitivity: number; maxSegments?: number }

export const MAX_AUTO_WALLS = 600;

interface CellStats { r: number; g: number; b: number; dark: number }

/** Média de cor e fração de pixels escuros de cada célula (`cols × rows`), em ordem de linha. */
function cellStats(image: RasterImage, cols: number, rows: number, darkLevel: number): CellStats[] {
  const sums = Array.from({ length: cols * rows }, () => ({ r: 0, g: 0, b: 0, dark: 0, n: 0 }));
  for (let y = 0; y < image.height; y += 1) {
    const cy = Math.min(rows - 1, Math.floor((y * rows) / image.height));
    for (let x = 0; x < image.width; x += 1) {
      const cx = Math.min(cols - 1, Math.floor((x * cols) / image.width));
      const at = (y * image.width + x) * 4;
      const r = image.data[at], g = image.data[at + 1], b = image.data[at + 2];
      const cell = sums[cy * cols + cx];
      cell.r += r; cell.g += g; cell.b += b; cell.n += 1;
      if (0.299 * r + 0.587 * g + 0.114 * b < darkLevel) cell.dark += 1;
    }
  }
  return sums.map((cell) => ({ r: cell.r / (cell.n || 1), g: cell.g / (cell.n || 1), b: cell.b / (cell.n || 1), dark: cell.dark / (cell.n || 1) }));
}

/** Junta segmentos alinhados e consecutivos (horizontais por linha de vértices, verticais por coluna). */
function mergeSegments(horizontal: Set<string>, vertical: Set<string>): AutoWallSegment[] {
  const out: AutoWallSegment[] = [];
  const runs = (keys: Set<string>, along: "x" | "y") => {
    const lines = new Map<number, number[]>();
    for (const key of keys) {
      const [a, b] = key.split(",").map(Number); // horizontal: x,y  | vertical: x,y
      const line = along === "x" ? b : a;
      const pos = along === "x" ? a : b;
      lines.set(line, [...(lines.get(line) ?? []), pos]);
    }
    for (const [line, positions] of lines) {
      positions.sort((p, q) => p - q);
      let start = positions[0], prev = positions[0];
      const close = () => out.push(along === "x" ? { x1: start, y1: line, x2: prev + 1, y2: line } : { x1: line, y1: start, x2: line, y2: prev + 1 });
      for (const pos of positions.slice(1)) {
        if (pos === prev + 1) { prev = pos; continue; }
        close();
        start = pos; prev = pos;
      }
      close();
    }
  };
  runs(horizontal, "x");
  runs(vertical, "y");
  return out;
}

export function detectWalls(image: RasterImage, cols: number, rows: number, options: AutoWallOptions): AutoWallSegment[] {
  const s = Math.max(0, Math.min(1, options.sensitivity));
  const stats = cellStats(image, cols, rows, 35 + s * 55);
  const at = (x: number, y: number) => stats[y * cols + x];
  const horizontal = new Set<string>(); // aresta entre (x,y-1) e (x,y): linha y, de x a x+1
  const vertical = new Set<string>(); // aresta entre (x-1,y) e (x,y): coluna x, de y a y+1

  if (options.mode === "dark") {
    const solid = (x: number, y: number) => at(x, y).dark >= 0.55;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (x > 0 && solid(x, y) !== solid(x - 1, y)) vertical.add(`${x},${y}`);
        if (y > 0 && solid(x, y) !== solid(x, y - 1)) horizontal.add(`${x},${y}`);
      }
    }
  } else {
    const limit = 150 - s * 110; // distância de cor RGB: sensibilidade alta = limite baixo
    const far = (a: CellStats, b: CellStats) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) > limit;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (x > 0 && far(at(x, y), at(x - 1, y))) vertical.add(`${x},${y}`);
        if (y > 0 && far(at(x, y), at(x, y - 1))) horizontal.add(`${x},${y}`);
      }
    }
  }

  let segments = mergeSegments(horizontal, vertical);
  if (options.mode === "edges") segments = segments.filter((segment) => Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) >= 2);
  const cap = options.maxSegments ?? MAX_AUTO_WALLS;
  if (segments.length > cap) throw new Error(`Foram achados ${segments.length} segmentos (o limite é ${cap}). Diminua a sensibilidade ou troque o modo.`);
  return segments;
}

/** Carrega a imagem do mapa e a reduz para `cols × rows` células de `pixelsPerCell` pixels (só no navegador). */
export async function loadRaster(src: string, cols: number, rows: number, pixelsPerCell = 24): Promise<RasterImage> {
  const scale = Math.min(pixelsPerCell, Math.floor(1600 / Math.max(cols, rows)));
  const width = Math.max(1, cols * scale), height = Math.max(1, rows * scale);
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Não consegui abrir a imagem do mapa.")); image.src = src; });
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Este navegador não permite ler a imagem do mapa.");
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}
