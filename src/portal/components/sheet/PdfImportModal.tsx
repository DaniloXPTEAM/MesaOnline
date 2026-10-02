import React, { useRef, useState } from "react";
import type { CharacterSheet } from "../../types/sheet";
import { ATTR_KEYS, ATTR_NAMES, T20_CLASSES, T20_RACES, T20_SKILLS, type AttrKey } from "../../lib/t20/compendium";
import { importSheetPdf, type PdfDraft } from "../../lib/pdf/importSheetPdf";
import { buildSheet, halfLevel, recalc, skillTotal, trainingBonus } from "../../lib/t20/sheetRules";
import { levelForXp } from "../../lib/t20/xp";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  current: CharacterSheet;
  onCreate: (s: CharacterSheet) => void;
  onMerge: (s: CharacterSheet) => void;
}

/** Aplica o rascunho do PDF em cima de uma ficha (nova ou existente). */
export function applyDraft(base: CharacterSheet, d: PdfDraft): CharacterSheet {
  const s: CharacterSheet = JSON.parse(JSON.stringify(base));
  if (d.name) s.name = d.name;
  if (d.race) s.race = d.race;
  if (d.raceId) s.raceId = d.raceId;
  if (d.class) s.class = d.class;
  if (d.classId) s.classId = d.classId;
  if (d.origin) s.origin = d.origin;
  if (d.deity) s.deity = d.deity;
  if (d.level) s.level = Math.max(1, Math.min(20, d.level));
  if (d.xp !== undefined) s.xp = d.xp;
  if (d.speed) s.speed = d.speed;
  if (d.money !== undefined) s.money = d.money;
  if (d.languages) s.languages = d.languages;
  for (const k of ATTR_KEYS) if (d.attributes[k] !== undefined) s.attributes[k].value = d.attributes[k]!;

  // perícias: treino marcado + ajuste de "outros" para bater com o total anotado
  for (const id of d.trainedSkills) s.skills[id] = { ...(s.skills[id] ?? {}), trained: true };
  const half = halfLevel(s.level);
  const tb = trainingBonus(s.level);
  for (const [id, total] of Object.entries(d.skills)) {
    const def = T20_SKILLS.find((x) => x.id === id);
    if (!def) continue;
    const attr = s.attributes[def.atributo].value;
    const base = half + attr;
    const trained = d.trainedSkills.includes(id) || total >= base + tb;
    const other = total - base - (trained ? tb : 0);
    s.skills[id] = { trained, other: other || undefined };
  }

  // Modelo de heróis: "outros" e atributo trocado por perícia, nomes de Ofício
  for (const [id, n] of Object.entries(d.skillOther ?? {})) s.skills[id] = { ...(s.skills[id] ?? { trained: false }), other: n };
  for (const [id, a] of Object.entries(d.skillAttr ?? {})) s.skills[id] = { ...(s.skills[id] ?? { trained: false }), attr: a };
  for (const [id, note] of Object.entries(d.skillNotes ?? {})) s.skills[id] = { ...(s.skills[id] ?? { trained: false }), note };
  if (d.appearance) s.appearance = d.appearance;
  if (d.notes && !s.notes.includes(d.notes)) s.notes = [s.notes, d.notes].filter(Boolean).join("\n\n");

  let out = recalc(s);
  // inventário, ataques, poderes e magias da ficha substituem os padrões da ficha-base (kit inicial, "Desarmado")
  if (d.equipment?.length) out.equipment = d.equipment;
  if (d.powers?.length) out.powers = d.powers;
  if (d.spells?.length) out.spells = d.spells;
  if (d.attacks?.length) {
    out.attacks = d.attacks.map((a) => {
      const written = d.attackTotals?.[a.id];
      if (written === undefined) return a;
      const extra = written - (skillTotal(out, a.skill === "Luta" ? "lut" : "pon")?.total ?? 0);
      return extra ? { ...a, bonus: extra } : a;
    });
  }
  if (d.hp?.max) out.hp = { max: d.hp.max, current: d.hp.current ?? d.hp.max };
  else if (d.hp?.current) out.hp = { ...out.hp, current: Math.min(out.hp.max, d.hp.current) };
  if (d.mp?.max) out.mp = { max: d.mp.max, current: d.mp.current ?? d.mp.max };
  if (d.defense !== undefined) {
    const armor = out.equipment.filter((i) => i.equipped && (i.category === "Armadura" || i.category === "Escudo")).reduce((a, i) => a + (i.defenseBonus ?? 0), 0);
    out.defenseOther = d.defense - 10 - out.attributes.des.value - armor;
  }
  return out;
}

export const PdfImportModal: React.FC<Props> = ({ isOpen, onClose, current, onCreate, onMerge }) => {
  const [draft, setDraft] = useState<PdfDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [fileName, setFileName] = useState("");
  const input = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setFileName(file.name);
    try {
      setDraft(await importSheetPdf(file));
    } catch (e) {
      setError(`Não foi possível ler o PDF: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const upd = (p: Partial<PdfDraft>) => draft && setDraft({ ...draft, ...p });
  const updAttr = (k: AttrKey, v: string) => draft && setDraft({ ...draft, attributes: { ...draft.attributes, [k]: v === "" ? undefined : Number(v) } });

  const create = () => {
    if (!draft) return;
    const raceId = draft.raceId ?? T20_RACES[0].id;
    const classId = draft.classId ?? T20_CLASSES[0].id;
    const base = buildSheet({
      name: draft.name ?? "Personagem importado",
      raceId,
      classId,
      level: draft.level ?? (draft.xp !== undefined ? levelForXp(draft.xp) : 1),
      xp: draft.xp,
      campaign: current.campaign,
      attributes: draft.attributes,
      trainedSkills: draft.trainedSkills,
      notes: `Importado de ${fileName}.`,
    });
    onCreate(applyDraft(base, draft));
    onClose();
  };

  const merge = () => {
    if (!draft) return;
    onMerge(applyDraft(current, draft));
    onClose();
  };

  const field = (label: string, value: string | number | undefined, onChange: (v: string) => void, type: "text" | "number" = "text") => (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-bold uppercase text-[#726859]">{label}</span>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`w-full rounded border p-1.5 text-xs font-semibold ${value === undefined || value === "" ? "border-dashed border-[#c2892c] bg-[#fef9ed]" : "border-[#ded7c6] bg-white"}`} />
    </label>
  );

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg border border-[#ded7c6] bg-[#fbf9f4] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between border-b border-[#ded7c6] pb-3">
          <div>
            <h2 className="font-serif text-lg font-black text-[#2b261f]">📄 Importar ficha em PDF → Tormenta 20 Online</h2>
            <p className="text-xs text-[#726859]">Lê campos de formulário e o texto do PDF, identifica os números e os coloca nos lugares certos da ficha. Revise e confirme.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-[#726859] hover:bg-[#eae4d5] hover:text-[#b92b3a]">✕</button>
        </div>

        {!draft && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#ded7c6] bg-white p-10 text-center"
          >
            <div className="text-4xl">📄</div>
            <p className="mt-2 text-sm font-bold text-[#2b261f]">Arraste a ficha em PDF aqui</p>
            <p className="text-xs text-[#726859]">Ficha oficial editável, ficha gerada por outros apps ou PDF com texto selecionável.</p>
            <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={() => input.current?.click()} disabled={busy} className="mt-4 rounded bg-[#b92b3a] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d] disabled:opacity-50">
              {busy ? "Lendo PDF…" : "Escolher arquivo"}
            </button>
            {error && <p className="mt-3 rounded border border-[#b92b3a] bg-[#fbebee] px-3 py-2 text-xs font-semibold text-[#b92b3a]">{error}</p>}
            <p className="mt-4 max-w-md text-[10px] text-[#9c9180]">PDFs escaneados (imagem) não têm texto extraível — nesse caso preencha os campos manualmente após a leitura.</p>
          </div>
        )}

        {draft && (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#ded7c6] bg-white px-3 py-2 text-xs">
              <span><strong>{fileName}</strong> · {Object.keys(draft.formFields).length} campos de formulário · {draft.rawText.length.toLocaleString("pt-BR")} caracteres de texto</span>
              <button onClick={() => { setDraft(null); setError(null); }} className="font-bold text-[#b92b3a] hover:underline">Trocar arquivo</button>
            </div>

            {draft.warnings.length > 0 && (
              <div className="rounded border border-[#c2892c] bg-[#fef9ed] px-3 py-2 text-xs text-[#7a5a12]">
                <strong>Atenção:</strong> {draft.warnings.join(" ")} Campos em amarelo não foram encontrados — preencha manualmente.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {field("Nome", draft.name, (v) => upd({ name: v }))}
              <label className="block">
                <span className="mb-0.5 block text-[10px] font-bold uppercase text-[#726859]">Raça {draft.race && !draft.raceId ? `(lido: ${draft.race})` : ""}</span>
                <select value={draft.raceId ?? ""} onChange={(e) => upd({ raceId: e.target.value || undefined, race: T20_RACES.find((r) => r.id === e.target.value)?.nome ?? draft.race })} className={`w-full rounded border p-1.5 text-xs font-semibold ${draft.raceId ? "border-[#ded7c6] bg-white" : "border-dashed border-[#c2892c] bg-[#fef9ed]"}`}>
                  <option value="">— escolher —</option>
                  {T20_RACES.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[10px] font-bold uppercase text-[#726859]">Classe {draft.class && !draft.classId ? `(lido: ${draft.class})` : ""}</span>
                <select value={draft.classId ?? ""} onChange={(e) => upd({ classId: e.target.value || undefined, class: T20_CLASSES.find((c) => c.id === e.target.value)?.nome ?? draft.class })} className={`w-full rounded border p-1.5 text-xs font-semibold ${draft.classId ? "border-[#ded7c6] bg-white" : "border-dashed border-[#c2892c] bg-[#fef9ed]"}`}>
                  <option value="">— escolher —</option>
                  {T20_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              {field("Nível", draft.level, (v) => upd({ level: v ? Number(v) : undefined }), "number")}
              {field("Origem", draft.origin, (v) => upd({ origin: v }))}
              {field("Divindade", draft.deity, (v) => upd({ deity: v }))}
              {field("PE (experiência)", draft.xp, (v) => upd({ xp: v ? Number(v) : undefined }), "number")}
              {field("Tibares (T$)", draft.money, (v) => upd({ money: v ? Number(v) : undefined }), "number")}
            </div>

            <div>
              <div className="mb-1 text-[10px] font-bold uppercase text-[#726859]">Atributos (valor = bônus)</div>
              <div className="grid grid-cols-6 gap-2">
                {ATTR_KEYS.map((k) => (
                  <label key={k} className="block text-center">
                    <span className="block text-[10px] font-bold text-[#b92b3a]">{k.toUpperCase()}</span>
                    <input type="number" value={draft.attributes[k] ?? ""} onChange={(e) => updAttr(k, e.target.value)} title={ATTR_NAMES[k]} className={`w-full rounded border p-1 text-center font-serif text-lg font-black ${draft.attributes[k] === undefined ? "border-dashed border-[#c2892c] bg-[#fef9ed]" : "border-[#ded7c6] bg-white"}`} />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {field("PV atual", draft.hp?.current, (v) => upd({ hp: { ...draft.hp, current: v ? Number(v) : undefined } }), "number")}
              {field("PV máx.", draft.hp?.max, (v) => upd({ hp: { ...draft.hp, max: v ? Number(v) : undefined } }), "number")}
              {field("PM atual", draft.mp?.current, (v) => upd({ mp: { ...draft.mp, current: v ? Number(v) : undefined } }), "number")}
              {field("PM máx.", draft.mp?.max, (v) => upd({ mp: { ...draft.mp, max: v ? Number(v) : undefined } }), "number")}
              {field("Defesa", draft.defense, (v) => upd({ defense: v ? Number(v) : undefined }), "number")}
              {field("Deslocamento", draft.speed, (v) => upd({ speed: v ? Number(v) : undefined }), "number")}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase text-[#726859]">
                <span>Perícias lidas ({Object.keys(draft.skills).length} com valor · {draft.trainedSkills.length} treinadas)</span>
                <span className="font-normal normal-case text-[#9c9180]">o total anotado é preservado; a diferença vira “outros”</span>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
                {T20_SKILLS.map((sk) => {
                  const v = draft.skills[sk.id];
                  const tr = draft.trainedSkills.includes(sk.id);
                  return (
                    <div key={sk.id} className={`flex items-center justify-between gap-1 rounded border px-1.5 py-1 text-[11px] ${v !== undefined || tr ? "border-[#ded7c6] bg-white" : "border-[#eee8da] bg-[#faf8f3] text-[#9c9180]"}`}>
                      <label className="flex min-w-0 items-center gap-1">
                        <input type="checkbox" checked={tr} onChange={() => upd({ trainedSkills: tr ? draft.trainedSkills.filter((x) => x !== sk.id) : [...draft.trainedSkills, sk.id] })} className="accent-[#b92b3a]" />
                        <span className="truncate">{sk.nome}</span>
                      </label>
                      <input type="number" value={v ?? ""} placeholder="—" onChange={(e) => { const n = { ...draft.skills }; if (e.target.value === "") delete n[sk.id]; else n[sk.id] = Number(e.target.value); upd({ skills: n }); }} className="w-11 rounded border border-[#ded7c6] bg-white px-0.5 text-center text-[11px]" />
                    </div>
                  );
                })}
              </div>
            </div>

            {(draft.equipment || draft.attacks || draft.powers || draft.spells || draft.notes) && (
              <div className="rounded border border-[#ded7c6] bg-white px-3 py-2 text-xs text-[#5c5446]">
                <strong>Também será importado:</strong> {[
                  draft.equipment && `${draft.equipment.length} itens do inventário`,
                  draft.attacks && `${draft.attacks.length} ataque(s)`,
                  draft.powers && `${draft.powers.length} poder(es)`,
                  draft.spells && `${draft.spells.length} magia(s)`,
                  draft.notes && "anotações e habilidades de raça/origem",
                ].filter(Boolean).join(" · ")}.
              </div>
            )}

            <div>
              <button onClick={() => setShowRaw((v) => !v)} className="text-[11px] font-bold text-[#1c7ed6] hover:underline">{showRaw ? "Ocultar" : "Ver"} texto extraído / campos do formulário</button>
              {showRaw && (
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  <pre className="max-h-48 overflow-auto rounded border border-[#ded7c6] bg-white p-2 text-[10px] leading-relaxed text-[#5c5446]">{draft.rawText || "(sem texto)"}</pre>
                  <pre className="max-h-48 overflow-auto rounded border border-[#ded7c6] bg-white p-2 text-[10px] leading-relaxed text-[#5c5446]">{Object.keys(draft.formFields).length ? JSON.stringify(draft.formFields, null, 1) : "(sem campos de formulário)"}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {draft && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[#ded7c6] pt-3">
            <button onClick={onClose} className="rounded border border-[#ded7c6] bg-white px-4 py-2 text-xs font-bold text-[#726859]">Cancelar</button>
            <button onClick={merge} className="rounded border border-[#1c7ed6] bg-[#e7f5ff] px-4 py-2 text-xs font-bold uppercase text-[#1c7ed6] hover:bg-[#1c7ed6] hover:text-white">Aplicar em “{current.name}”</button>
            <button onClick={create} className="rounded bg-[#b92b3a] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d]">✦ Criar nova ficha</button>
          </div>
        )}
      </div>
    </div>
  );
};
