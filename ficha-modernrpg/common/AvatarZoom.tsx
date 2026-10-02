import React, { useRef } from "react";

interface Props {
  src?: string;
  /** ponto de foco do retrato, ex.: "50% 20%" */
  pos?: string;
  name: string;
  className?: string;
  frameClass?: string;
  onUpload?: (dataUrl: string) => void;
}

/**
 * Retrato do personagem com ponto de foco.
 * Implementação mínima oficial: exibe a imagem (ou a inicial do nome) com o
 * ponto de foco `pos` e, quando `onUpload` é fornecido, permite trocar a
 * imagem por upload (a ficha decide o novo foco).
 */
export const AvatarZoom: React.FC<Props> = ({ src, pos = "50% 30%", name, className = "h-24 w-24", frameClass = "", onUpload }) => {
  const input = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !onUpload) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(String(reader.result));
    reader.readAsDataURL(f);
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border shadow-sm ${frameClass} ${className}`}
      onClick={() => onUpload && input.current?.click()}
      title={onUpload ? "Clique para trocar o retrato" : undefined}
      style={{ cursor: onUpload ? "pointer" : "default" }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" style={{ objectPosition: pos }} draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-serif text-3xl font-black text-[#b92b3a]">
          {(name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      {onUpload && <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} onClick={(e) => e.stopPropagation()} />}
    </div>
  );
};
