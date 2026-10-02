import React, { useRef, useState } from "react";
import type { CharacterSheet } from "../sheet";
import { importVttJson, type VttCampaign, type VttImportResult } from "../vtt/importVtt";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (characters: CharacterSheet[], campaign?: VttCampaign) => void;
}

export const VttImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [result, setResult] = useState<VttImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  const readFile = (f: File) =>
    f.text().then((t) => run(t, f.name)).catch(() => {
      setError("Não consegui ler o arquivo (talvez seja grande demais). Exporte só os atores/cenas que você precisa, ou divida o arquivo.");
      setResult(null);
    });

  const run = (raw: string, name = "colado") => {
    setError(null);
    try {
      const r = importVttJson(raw, name);
      setResult(r);
      setCampaignName(r.campaign?.name ?? name.replace(/\.(json|db)$/i, ""));
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-[#ded7c6] bg-[#fbf9f4] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between border-b border-[#ded7c6] pb-3">
          <div>
            <h2 className="font-serif text-lg font-black text-[#2b261f]">🎲 Importar do VTT — Foundry / Roll20</h2>
            <p className="text-xs text-[#726859]">Aceita: aventura/mundo/compêndio exportado do Foundry (JSON ou .db), ator exportado do Foundry (sistema tormenta20), mundo/compêndio (.json ou .db NeDB), personagem do Roll20 (JSON com <code>attribs</code>) ou fichas deste site.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-[#726859] hover:bg-[#eae4d5] hover:text-[#b92b3a]">✕</button>
        </div>

        {!result && (
          <div className="space-y-3">
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void readFile(f); }} className="flex flex-col items-center rounded-lg border-2 border-dashed border-[#ded7c6] bg-white p-8 text-center">
              <div className="text-4xl">🎲</div>
              <p className="mt-2 text-sm font-bold">Arraste o arquivo .json / .db aqui</p>
              <p className="text-xs text-[#726859]">Foundry: clique com o botão direito no ator → “Exportar dados”. Roll20: use a extensão VTT Enhancement Suite → Export.</p>
              <input ref={input} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void readFile(f); }} />
              <button onClick={() => input.current?.click()} className="mt-3 rounded bg-[#b92b3a] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d]">Escolher arquivo</button>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase text-[#726859]">ou cole o JSON</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder='{"name":"...","type":"character","system":{...},"items":[...]}' className="w-full rounded border border-[#ded7c6] bg-white p-2 font-mono text-[11px]" />
              <button disabled={!text.trim()} onClick={() => run(text)} className="mt-2 rounded border border-[#b92b3a] bg-[#fbebee] px-4 py-1.5 text-xs font-bold text-[#b92b3a] disabled:opacity-40">Analisar</button>
            </div>
            {error && <p className="rounded border border-[#b92b3a] bg-[#fbebee] p-2 text-xs font-semibold text-[#b92b3a]">Erro: {error}</p>}
          </div>
        )}

        {result && (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#ded7c6] bg-white px-3 py-2">
              <span>Formato: <strong>{result.kind}</strong> · {result.characters.length} personagem(ns) · {result.campaign?.npcs.length ?? 0} NPC(s) · {result.campaign?.scenes.length ?? 0} cena(s) · {result.campaign?.journals.length ?? 0} diário(s)</span>
              <button onClick={() => { setResult(null); setText(""); }} className="font-bold text-[#b92b3a] hover:underline">Trocar arquivo</button>
            </div>
            {result.warnings.map((w, i) => <p key={i} className="rounded border border-[#c2892c] bg-[#fef9ed] p-2 text-[#7a5a12]">{w}</p>)}

            {result.characters.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase text-[#726859]">Personagens</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {result.characters.map((c) => (
                    <div key={c.id} className="rounded border border-[#ded7c6] bg-white p-2">
                      <div className="font-serif font-bold">{c.name}</div>
                      <div className="text-[11px] text-[#b92b3a]">{c.race} · {c.class} · {c.level}º</div>
                      <div className="text-[10px] text-[#726859]">PV {c.hp.current}/{c.hp.max} · PM {c.mp.current}/{c.mp.max} · {Object.values(c.skills).filter((s) => s.trained).length} perícias · {c.powers.length} poderes · {c.spells.length} magias · {c.equipment.length} itens</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.campaign && (
              <div className="rounded border border-[#ded7c6] bg-white p-3">
                <div className="mb-1 text-[10px] font-bold uppercase text-[#726859]">Campanha</div>
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="mb-2 w-full rounded border border-[#ded7c6] bg-[#fbf9f4] p-1.5 text-xs font-bold" />
                {result.campaign.npcs.length > 0 && <p><strong>NPCs / ameaças:</strong> {result.campaign.npcs.slice(0, 20).map((x) => x.name).join(", ")}{result.campaign.npcs.length > 20 ? "…" : ""}</p>}
                {result.campaign.scenes.length > 0 && <p><strong>Cenas:</strong> {result.campaign.scenes.slice(0, 15).join(", ")}</p>}
                {result.campaign.journals.length > 0 && <p><strong>Diários:</strong> {result.campaign.journals.slice(0, 10).map((j) => j.name).join(", ")}</p>}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-[#ded7c6] pt-3">
              <button onClick={onClose} className="rounded border border-[#ded7c6] bg-white px-4 py-2 text-xs font-bold text-[#726859]">Cancelar</button>
              <button
                disabled={!result.characters.length && !result.campaign}
                onClick={() => { onImport(result.characters.map((c) => ({ ...c, campaign: campaignName || c.campaign })), result.campaign ? { ...result.campaign, name: campaignName || result.campaign.name, actors: result.characters } : undefined); onClose(); }}
                className="rounded bg-[#b92b3a] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d] disabled:opacity-40"
              >
                ✦ Importar {result.characters.length ? `${result.characters.length} ficha(s)` : ""}{result.campaign ? " + campanha" : ""}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
