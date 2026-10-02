import React, { useRef } from "react";

interface Props {
  label: string;
  value: string;
  pos?: string;
  onChange: (value: string, pos?: string) => void;
}

/**
 * Seletor de retrato com ponto de foco.
 * Implementação mínima oficial: upload da imagem + clique no preview para
 * escolher o foco (percentuais), devolvendo (dataUrl, "x% y%").
 */
export const ImagePicker: React.FC<Props> = ({ label, value, pos = "50% 30%", onChange }) => {
  const input = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result), pos);
    reader.readAsDataURL(f);
  };

  const setFocus = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!value) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    onChange(value, `${x}% ${y}%`);
  };

  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase text-[#726859]">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={value ? setFocus : () => input.current?.click()}
          title={value ? "Clique para escolher o foco" : "Enviar imagem"}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#ded7c6] bg-[#f7f3e9]"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" style={{ objectPosition: pos }} draggable={false} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl text-[#9c9180]">📷</span>
          )}
        </button>
        <div className="space-y-1">
          <button type="button" onClick={() => input.current?.click()} className="rounded border border-[#ded7c6] bg-white px-3 py-1.5 text-xs font-bold text-[#726859] hover:border-[#b92b3a] hover:text-[#b92b3a]">
            Enviar imagem
          </button>
          {value && <p className="text-[10px] text-[#9c9180]">foco: {pos}</p>}
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
};
