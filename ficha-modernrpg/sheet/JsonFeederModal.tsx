import React, { useState } from "react";
import type { CharacterSheet } from "../sheet";
import { INITIAL_CHARACTERS } from "../data/characters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  current: CharacterSheet;
  all: CharacterSheet[];
  onImport: (sheets: CharacterSheet[]) => void;
}

export const JsonFeederModal: React.FC<Props> = ({ isOpen, onClose, current, all, onImport }) => {
  const [text, setText] = useState(() => JSON.stringify(current, null, 2));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!isOpen) return null;

  const apply = () => {
    try {
      const parsed = JSON.parse(text);
      const list: CharacterSheet[] = Array.isArray(parsed) ? parsed : [parsed];
      if (!list.length || !list[0].name || !list[0].attributes) throw new Error("o JSON precisa ter pelo menos 'name' e 'attributes'.");
      onImport(list);
      setMsg({ ok: true, text: `${list.length} ficha(s) aplicada(s).` });
      setTimeout(onClose, 800);
    } catch (e) {
      setMsg({ ok: false, text: `JSON inválido: ${(e as Error).message}` });
    }
  };

  const download = (content: string, filename: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    a.download = filename;
    a.click();
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-[#ded7c6] bg-[#fbf9f4] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ded7c6] pb-3">
          <div>
            <h2 className="font-serif text-lg font-black text-[#2b261f]">{`{ }`} JSON — Tormenta 20 Online</h2>
            <p className="text-xs text-[#726859]">Cole o JSON do seu backend para preencher a ficha, ou exporte a estrutura atual para integrar.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-[#726859] hover:bg-[#eae4d5] hover:text-[#b92b3a]">✕</button>
        </div>

        <div className="my-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setText(JSON.stringify(current, null, 2))} className="rounded border border-[#ded7c6] bg-white px-2.5 py-1 text-xs font-semibold text-[#726859]">Ficha atual</button>
          <button onClick={() => setText(JSON.stringify(all, null, 2))} className="rounded border border-[#ded7c6] bg-white px-2.5 py-1 text-xs font-semibold text-[#726859]">Todas as fichas</button>
          <button onClick={() => setText(JSON.stringify(INITIAL_CHARACTERS[0], null, 2))} className="rounded border border-[#ded7c6] bg-white px-2.5 py-1 text-xs font-semibold text-[#b92b3a]">Exemplo T20 (Arcanista)</button>
          <span className="flex-1" />
          <button onClick={() => navigator.clipboard?.writeText(text).then(() => setMsg({ ok: true, text: "Copiado!" }))} className="rounded border border-[#ded7c6] bg-white px-3 py-1 text-xs font-bold">📋 Copiar</button>
          <button onClick={() => download(text, `${current.name.toLowerCase().replace(/\s+/g, "-")}.json`)} className="rounded border border-[#ded7c6] bg-white px-3 py-1 text-xs font-bold">⬇ Baixar</button>
        </div>

        {msg && <div className={`mb-2 rounded border p-2 text-xs font-semibold ${msg.ok ? "border-[#2b8a3e] bg-[#ebfbee] text-[#2b8a3e]" : "border-[#b92b3a] bg-[#fbebee] text-[#b92b3a]"}`}>{msg.text}</div>}

        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={18} className="w-full flex-1 rounded border border-[#ded7c6] bg-white p-3 font-mono text-xs text-[#2b261f] outline-none focus:border-[#b92b3a]" />

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-[#ded7c6] pt-3">
          <button onClick={onClose} className="rounded border border-[#ded7c6] bg-white px-4 py-2 text-xs font-bold text-[#726859]">Cancelar</button>
          <button onClick={apply} className="rounded bg-[#b92b3a] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d]">Aplicar JSON</button>
        </div>
      </div>
    </div>
  );
};
