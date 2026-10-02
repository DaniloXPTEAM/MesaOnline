import { useEffect, useRef } from "react";
import { getCell } from "../game/rules";
import type { BattleMap } from "../game/types";

const WIDTH = 1000;
const HEIGHT = 700;
const RENDER_SCALE = 2;
const TILE_W = 52;
const TILE_H = 27;
const ORIGIN_X = 500;
const ORIGIN_Y = 112;
const ELEVATION_STEP = 15;

export default function IsometricMapCanvas({ map, rotation }: { map: BattleMap; rotation: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      resetContext(context);
      if (map.isoImage) drawDedicatedIsometricArt(context, image, rotation);
      else drawCoherentProjection(context, image, map, rotation);
    };
    image.src = map.isoImage ?? map.image;
    return () => { cancelled = true; };
  }, [map, rotation]);

  return <canvas ref={ref} className="iso-texture-canvas" width={WIDTH * RENDER_SCALE} height={HEIGHT * RENDER_SCALE} aria-label={`Conversao isometrica de ${map.name}`} />;
}

function resetContext(context: CanvasRenderingContext2D) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, WIDTH * RENDER_SCALE, HEIGHT * RENDER_SCALE);
  context.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
}

function drawDedicatedIsometricArt(context: CanvasRenderingContext2D, image: HTMLImageElement, rotation: number) {
  const step = normalizeStep(rotation);
  const sourceW = image.naturalWidth || image.width;
  const sourceH = image.naturalHeight || image.height;
  const boundsW = step % 2 ? sourceH : sourceW;
  const boundsH = step % 2 ? sourceW : sourceH;
  const scale = Math.min(940 / boundsW, 650 / boundsH);
  context.save();
  context.translate(WIDTH / 2, HEIGHT / 2 - 8);
  context.rotate(rotation * Math.PI / 180);
  context.drawImage(image, -sourceW * scale / 2, -sourceH * scale / 2, sourceW * scale, sourceH * scale);
  context.restore();
}

function drawCoherentProjection(context: CanvasRenderingContext2D, image: HTMLImageElement, map: BattleMap, rotation: number) {
  const step = normalizeStep(rotation);
  const rotated = rotateSourceImage(image, step);
  const visualCols = step % 2 ? map.rows : map.cols;
  const visualRows = step % 2 ? map.cols : map.rows;

  // The complete source is projected in one transform, keeping every room and corridor continuous.
  context.save();
  context.transform(
    visualCols * TILE_W / 2 / rotated.width,
    visualCols * TILE_H / 2 / rotated.width,
    -visualRows * TILE_W / 2 / rotated.height,
    visualRows * TILE_H / 2 / rotated.height,
    ORIGIN_X,
    ORIGIN_Y - TILE_H / 2,
  );
  context.drawImage(rotated, 0, 0);
  context.restore();

  const sourceCellW = rotated.width / visualCols;
  const sourceCellH = rotated.height / visualRows;
  const raised = Array.from({ length: map.cols * map.rows }, (_, index) => ({ x: index % map.cols, y: Math.floor(index / map.cols) }))
    .filter((cell) => getCell(map, cell.x, cell.y).elevation > 0)
    .sort((a, b) => {
      const ar = rotateCell(a.x, a.y, map.cols, map.rows, step);
      const br = rotateCell(b.x, b.y, map.cols, map.rows, step);
      return ar.x + ar.y - (br.x + br.y);
    });

  for (const cell of raised) {
    const projected = projectCell(cell.x, cell.y, map, step);
    const rotatedCell = rotateCell(cell.x, cell.y, map.cols, map.rows, step);
    drawCliff(context, projected.x, projected.y, getCell(map, cell.x, cell.y).elevation * 8);
    drawTexturedDiamond(context, rotated, rotatedCell.x * sourceCellW, rotatedCell.y * sourceCellH, sourceCellW, sourceCellH, projected.x, projected.y);
  }
}

function rotateSourceImage(image: HTMLImageElement, step: number) {
  const sourceW = image.naturalWidth || image.width;
  const sourceH = image.naturalHeight || image.height;
  const canvas = document.createElement("canvas");
  canvas.width = step % 2 ? sourceH : sourceW;
  canvas.height = step % 2 ? sourceW : sourceH;
  const context = canvas.getContext("2d")!;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(step * Math.PI / 2);
  context.drawImage(image, -sourceW / 2, -sourceH / 2);
  return canvas;
}

function drawCliff(context: CanvasRenderingContext2D, x: number, y: number, depth: number) {
  context.save();
  context.beginPath();
  context.moveTo(x - TILE_W / 2, y);
  context.lineTo(x, y + TILE_H / 2);
  context.lineTo(x, y + TILE_H / 2 + depth);
  context.lineTo(x - TILE_W / 2, y + depth);
  context.closePath();
  context.fillStyle = "#332d29";
  context.fill();
  context.beginPath();
  context.moveTo(x, y + TILE_H / 2);
  context.lineTo(x + TILE_W / 2, y);
  context.lineTo(x + TILE_W / 2, y + depth);
  context.lineTo(x, y + TILE_H / 2 + depth);
  context.closePath();
  context.fillStyle = "#191715";
  context.fill();
  context.restore();
}

function drawTexturedDiamond(context: CanvasRenderingContext2D, image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, cx: number, cy: number) {
  const tile = document.createElement("canvas");
  tile.width = Math.max(1, Math.ceil(sw));
  tile.height = Math.max(1, Math.ceil(sh));
  tile.getContext("2d")!.drawImage(image, sx, sy, sw, sh, 0, 0, tile.width, tile.height);
  context.save();
  context.beginPath();
  context.moveTo(cx, cy - TILE_H / 2 - .4);
  context.lineTo(cx + TILE_W / 2 + .4, cy);
  context.lineTo(cx, cy + TILE_H / 2 + .4);
  context.lineTo(cx - TILE_W / 2 - .4, cy);
  context.closePath();
  context.clip();
  context.transform(TILE_W / 2 / tile.width, TILE_H / 2 / tile.width, -TILE_W / 2 / tile.height, TILE_H / 2 / tile.height, cx, cy - TILE_H / 2);
  context.drawImage(tile, 0, 0);
  context.restore();
}


function projectCell(x: number, y: number, map: BattleMap, step: number) {
  const rotated = rotateCell(x, y, map.cols, map.rows, step);
  return { x: ORIGIN_X + (rotated.x - rotated.y) * TILE_W / 2, y: ORIGIN_Y + (rotated.x + rotated.y) * TILE_H / 2 - getCell(map, x, y).elevation * ELEVATION_STEP };
}

function normalizeStep(rotation: number) { return ((rotation / 90) % 4 + 4) % 4; }

function rotateCell(x: number, y: number, cols: number, rows: number, step: number) {
  if (step === 1) return { x: rows - 1 - y, y: x };
  if (step === 2) return { x: cols - 1 - x, y: rows - 1 - y };
  if (step === 3) return { x: y, y: cols - 1 - x };
  return { x, y };
}