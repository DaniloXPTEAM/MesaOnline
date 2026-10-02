import React, { useRef, useState } from "react";
import { cropImageToDataUrl, imageFileToDataUrl, parsePos } from "../../lib/imageFile";

interface Props {
  value: string;
  /** ponto de foco "x% y%" (só usado quando `bake` é falso) */
  pos?: string;
  onChange: (value: string, pos?: string) => void;
  label?: string;
  /** largura / altura do quadro (1 = quadrado, 0.75 = capa de livro, 2 = faixa larga) */
  aspect?: number;
  /** grava a imagem já recortada no foco escolhido (para telas que não guardam o foco à parte) */
  bake?: boolean;
  /** lado maior, em pixels, da imagem guardada */
  maxSize?: number;
}

/** Carregar uma imagem do computador (ou colar uma URL) e arrastar dentro do quadro para escolher o foco. */
export const ImagePicker: React.FC<Props> = ({ value, pos, onChange, label = "Imagem", aspect = 1, bake = false, maxSize = 640 }) => {
  const file = useRef<HTMLInputElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const original = useRef<string>("");
  const drag = useRef<{ x: number; y: number; p: [number, number]; n?: [number, number] } | null>(null);
  const [error, setError] = useState("");
  const [localPos, setLocalPos] = useState<[number, number]>(() => parsePos(pos));
  const isData = value.startsWith("data:");
  const canDrag = !!value && (!bake || isData);
  const current: [number, number] = bake ? localPos : parsePos(pos);
  const frameW = aspect >= 1 ? 208 : Math.round(208 * aspect);

  const pick = async (f?: File) => {
    if (!f) return;
    setError("");
    try {
      const full = await imageFileToDataUrl(f, bake ? Math.max(maxSize, 1200) : maxSize);
      original.current = full;
      setLocalPos([50, 50]);
      if (bake) onChange(await cropImageToDataUrl(full, "50% 50%", aspect, maxSize), "50% 50%");
      else onChange(full, "50% 50%");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = frame.current;
    const im = img.current;
    if (!d || !el || !im || !im.naturalWidth) return;
    const fw = el.clientWidth;
    const fh = el.clientHeight;
    const s = Math.max(fw / im.naturalWidth, fh / im.naturalHeight);
    const ox = im.naturalWidth * s - fw;
    const oy = im.naturalHeight * s - fh;
    const nx = ox > 1 ? Math.min(100, Math.max(0, d.p[0] - ((e.clientX - d.x) / ox) * 100)) : d.p[0];
    const ny = oy > 1 ? Math.min(100, Math.max(0, d.p[1] - ((e.clientY - d.y) / oy) * 100)) : d.p[1];
    d.n = [nx, ny];
    if (bake) setLocalPos([nx, ny]);
    else onChange(value, `${Math.round(nx)}% ${Math.round(ny)}%`);
  };

  const end = async () => {
    const d = drag.current;
    drag.current = null;
    if (bake && d?.n && original.current) onChange(await cropImageToDataUrl(original.current, `${d.n[0]}% ${d.n[1]}%`, aspect, maxSize), `${Math.round(d.n[0])}% ${Math.round(d.n[1])}%`);
  };

  const lbl = "mb-1 block text-[10px] font-bold uppercase text-[#726859]";
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="flex flex-wrap items-start gap-3">
        <div
          ref={frame}
          style={{ width: frameW, aspectRatio: String(aspect) }}
          onPointerDown={(e) => { if (!canDrag) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, p: current }; }}
          onPointerMove={move}
          onPointerUp={() => void end()}
          className={`relative shrink-0 overflow-hidden rounded border border-[#ded7c6] bg-[#f5f2eb] ${canDrag ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
        >
          {value ? (
            <img ref={img} src={value} alt="" draggable={false} style={{ objectPosition: bake ? "50% 50%" : `${current[0]}% ${current[1]}%` }} className="pointer-events-none h-full w-full select-none object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-[#9c9180]">🖼️</div>
          )}
          {canDrag && <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-bold text-white">arraste para focar</span>}
        </div>
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => file.current?.click()} className="rounded bg-[#b92b3a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#9c1f2d]">📷 Carregar imagem</button>
            {value && <button type="button" onClick={() => { original.current = ""; onChange("", undefined); }} className="rounded border border-[#ded7c6] bg-white px-3 py-1.5 text-xs font-bold text-[#726859] hover:text-[#b92b3a]">Remover</button>}
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <input value={isData ? "" : value} onChange={(e) => onChange(e.target.value, "50% 50%")} className="w-full rounded border border-[#ded7c6] bg-[#fbf9f4] p-2 text-xs outline-none focus:border-[#b92b3a]" placeholder={isData ? "Imagem carregada do computador" : "ou cole o endereço (URL) da imagem"} />
          {bake && value && !isData && <p className="text-[10px] text-[#9c9180]">Para reenquadrar, carregue a imagem do computador.</p>}
        </div>
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-[#b92b3a]">{error}</p>}
    </div>
  );
};
