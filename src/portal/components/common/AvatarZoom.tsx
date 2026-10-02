import React, { useRef } from "react";
import { imageFileToDataUrl } from "../../lib/imageFile";

interface Props {
  src?: string;
  name: string;
  /** ponto de foco "x% y%" escolhido pelo usuário */
  pos?: string;
  /** tamanho e formato da miniatura (classes Tailwind de largura/altura) */
  className?: string;
  /** classes extras da moldura (cor de fundo, borda) */
  frameClass?: string;
  /** se informado, mostra um botão 📷 para trocar a imagem ali mesmo */
  onUpload?: (dataUrl: string) => void;
}

/** Miniatura do personagem; ao passar o mouse, mostra a imagem inteira ampliada. */
export const AvatarZoom: React.FC<Props> = ({ src, name, pos, className = "h-12 w-12", frameClass = "border-[#ded7c6] bg-[#fbebee]", onUpload }) => {
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className={`group relative shrink-0 ${className}`}>
      <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded border font-serif font-black text-[#b92b3a] ${frameClass}`}>
        {src ? <img src={src} alt={name} style={{ objectPosition: pos ?? "50% 20%" }} className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
      </div>
      {src && (
        <div className="no-print pointer-events-none absolute left-0 top-full z-50 mt-1 hidden group-hover:block">
          <img src={src} alt="" className="max-h-80 max-w-[20rem] rounded border-2 border-white bg-white object-contain shadow-2xl" />
        </div>
      )}
      {onUpload && (
        <>
          <button type="button" title="Carregar imagem do personagem" onClick={() => file.current?.click()} className="no-print absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#ded7c6] bg-white text-[11px] shadow hover:bg-[#fbebee]">📷</button>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void imageFileToDataUrl(f).then(onUpload).catch(() => undefined); }} />
        </>
      )}
    </div>
  );
};
