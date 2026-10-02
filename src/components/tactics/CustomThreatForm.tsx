import { useRef, useState, type ChangeEvent } from "react";
import { Image, Save, Upload } from "lucide-react";
import { addCustomThreat } from "../../tactics/engine/customThreats";
import { DEFAULT_THREAT_FIELDS, type ThreatFields, customThreatInput, threatFieldsFromJson } from "../../tactics/engine/customThreatInput";

// Formulário do mestre para criar uma ameaça que não está no bestiário oficial (620 criaturas). O resultado
// entra no mesmo catálogo (AMEACAS_DB, via ArmadaTactics.addCustomThreat na ponte) e funciona igual a uma
// ameaça de verdade: ataca, rola dano, aparece na lista. Adaptado de uma versão antiga do demonstrativo
// (Libraries.tsx/ThreatLibraryDialog); a diferença é que aqui ele chama a ponte em vez de props do React.
function fileAsDataUrl(file: File, callback: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result));
  reader.readAsDataURL(file);
}

export default function CustomThreatForm({ onCreated, onError }: { onCreated: () => void; onError: (message: string) => void }) {
  const [portrait, setPortrait] = useState("");
  const [form, setForm] = useState<ThreatFields>(DEFAULT_THREAT_FIELDS);
  const jsonInput = useRef<HTMLInputElement>(null);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { fields, portrait: imported } = threatFieldsFromJson(JSON.parse(String(reader.result)));
        setForm(fields);
        if (imported) setPortrait(imported);
      } catch {
        /* Formulário manual continua disponível. */
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function save() {
    if (!form.nome.trim()) return;
    try {
      addCustomThreat(customThreatInput(form, portrait));
      setForm((current) => ({ ...current, nome: "" }));
      setPortrait("");
      onCreated();
    } catch (error: any) {
      onError(error.message || String(error));
    }
  }

  return (
    <section className="threat-builder">
      <div className="dialog-section-title"><strong>Nova ameaça</strong><small>Imagem + ficha T20</small></div>
      <div className="portrait-import-row">
        <label className="portrait-drop">
          {portrait ? <img src={portrait} alt="Retrato" /> : <><Image size={25} /><small>Imagem</small></>}
          <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) fileAsDataUrl(file, setPortrait); }} />
        </label>
        <div>
          <button className="json-import" onClick={() => jsonInput.current?.click()}><Upload size={15} /> Importar JSON</button>
          <input ref={jsonInput} hidden type="file" accept="application/json" onChange={importJson} />
          <p>A imagem vira token 2D e sprite isométrico. Também é possível preencher manualmente.</p>
        </div>
      </div>
      <label className="field-label">Nome<input value={form.nome} onChange={(event) => update("nome", event.target.value)} /></label>
      <label className="field-label">Tipo e ND<input value={form.tipo} onChange={(event) => update("tipo", event.target.value)} /></label>
      <div className="three-fields">
        <label className="field-label">PV<input type="number" value={form.pv} onChange={(event) => update("pv", event.target.value)} /></label>
        <label className="field-label">PM<input type="number" value={form.pm} onChange={(event) => update("pm", event.target.value)} /></label>
        <label className="field-label">Defesa<input type="number" value={form.defesa} onChange={(event) => update("defesa", event.target.value)} /></label>
      </div>
      <div className="three-fields">
        <label className="field-label">Iniciativa<input type="number" value={form.iniciativa} onChange={(event) => update("iniciativa", event.target.value)} /></label>
        <label className="field-label">Luta<input type="number" value={form.luta} onChange={(event) => update("luta", event.target.value)} /></label>
        <label className="field-label">Pontaria<input type="number" value={form.pontaria} onChange={(event) => update("pontaria", event.target.value)} /></label>
      </div>
      <div className="two-fields">
        <label className="field-label">Dano<input value={form.dano} onChange={(event) => update("dano", event.target.value)} /></label>
        <label className="field-label">Deslocamento<input value={form.desl} onChange={(event) => update("desl", event.target.value)} placeholder="9m (6q)" /></label>
      </div>
      <button className="save-import" disabled={!form.nome.trim()} onClick={save}><Save size={17} /> Salvar ameaça</button>
    </section>
  );
}
