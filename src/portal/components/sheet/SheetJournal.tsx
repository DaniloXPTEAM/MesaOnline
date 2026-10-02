import React, { useRef, useState } from "react";
import type { JournalEntry } from "../../types/sheet";
import { uid } from "../../lib/t20/sheetRules";

const inp = "w-full rounded border border-[#ded7c6] bg-[#fbf9f4] p-1.5 text-xs outline-none focus:border-[#b92b3a]";

/** Reduz a imagem para uma miniatura pequena, para não pesar o armazenamento local. */
function toThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        const max = 160;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const SheetJournal: React.FC<{ entries: JournalEntry[]; onChange: (e: JournalEntry[]) => void }> = ({ entries, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageFor, setImageFor] = useState<string | null>(null);

  const update = (id: string, p: Partial<JournalEntry>) => onChange(entries.map((e) => (e.id === id ? { ...e, ...p } : e)));
  const add = () => {
    const entry: JournalEntry = { id: uid("diario"), adventure: "", level: 1, xp: 0, text: "" };
    onChange([entry, ...entries]);
    setOpenId(entry.id);
  };

  return (
    <div className="od-card-print rounded-lg border border-[#ded7c6] bg-white p-3 shadow-[0_1px_2px_rgba(43,38,31,0.07),0_6px_14px_-8px_rgba(43,38,31,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-4">
      <div className="mb-3 flex items-center justify-between border-b border-[#ded7c6] pb-2">
        <h2 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#726859]"><span className="text-[#b92b3a]">▼</span> Diário</h2>
        <button onClick={add} className="no-print text-[11px] font-bold text-[#b92b3a] hover:underline">+ Adicionar entrada</button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && imageFor) toThumbnail(file).then((image) => update(imageFor, { image })).catch(() => {});
          e.target.value = "";
        }}
      />
      {entries.length === 0 ? (
        <p className="text-xs text-[#9c9180]">Nenhuma aventura registrada ainda. Adicione uma entrada com o nome da aventura, o nível, o XP ganho e o seu relato.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const open = openId === e.id;
            return (
              <div key={e.id} className="rounded border border-[#ded7c6] bg-[#fbf9f4]">
                <button onClick={() => setOpenId(open ? null : e.id)} className="flex w-full items-center gap-3 p-2 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#ded7c6] bg-white text-base">{e.image ? <img src={e.image} alt="" className="h-full w-full object-cover" /> : "📜"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{e.adventure || "Aventura sem nome"}</span>
                    <span className="block text-[10px] text-[#726859]">Nível {e.level} · +{e.xp} PE</span>
                  </span>
                  <span className="text-[10px] text-[#b92b3a]">{open ? "▲ recolher" : "▼ ver tudo"}</span>
                </button>
                {open && (
                  <div className="space-y-2 border-t border-[#ded7c6] p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_90px_110px]">
                      <input value={e.adventure} onChange={(ev) => update(e.id, { adventure: ev.target.value })} placeholder="Nome da aventura" className={inp} />
                      <input type="number" min={1} max={20} value={e.level} onChange={(ev) => update(e.id, { level: Math.max(1, Number(ev.target.value) || 1) })} title="Nível na época" className={inp} />
                      <input type="number" min={0} value={e.xp} onChange={(ev) => update(e.id, { xp: Math.max(0, Number(ev.target.value) || 0) })} title="XP recebido" className={inp} />
                    </div>
                    <textarea value={e.text} onChange={(ev) => update(e.id, { text: ev.target.value })} rows={6} placeholder="Escreva aqui o relato da aventura…" className={inp} />
                    <div className="no-print flex flex-wrap items-center gap-2">
                      <button onClick={() => { setImageFor(e.id); fileRef.current?.click(); }} className="rounded border border-[#ded7c6] bg-white px-2 py-1 text-[11px] font-bold text-[#726859]">🖼 {e.image ? "Trocar imagem" : "Adicionar imagem"}</button>
                      {e.image && <button onClick={() => update(e.id, { image: undefined })} className="text-[11px] text-[#726859] hover:underline">remover imagem</button>}
                      <button onClick={() => { if (confirm("Remover esta entrada do diário?")) { onChange(entries.filter((x) => x.id !== e.id)); setOpenId(null); } }} className="ml-auto text-[11px] font-bold text-[#b92b3a] hover:underline">Remover entrada</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
