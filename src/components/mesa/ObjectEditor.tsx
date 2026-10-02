import { ImageUp, PackageOpen } from "lucide-react";
import { DEFAULT_CHEST_LOCK_DC, LOCK_PRESETS } from "../../game/chest";
import type { BoardObject } from "../../game/types";
import TrapEditor from "./TrapEditor";
import { updateBoardObject } from "../../game/vttBridge";

/**
 * Configuração do baú pelo Mestre (a "mini-macro" do baú): nome, conteúdo, trancado e CD, armadilha.
 * Só o Mestre chega aqui (gaveta Macros → Mapa e objetos). Usa as classes de campo das gavetas.
 */
const num = (value: string, min: number, max: number, fallback: number) => Math.max(min, Math.min(max, Math.round(Number(value)) || fallback));

/** Lê a imagem do token do objeto: GIF fica como veio (para animar); as outras são reduzidas a 256 px para não pesar na sala. */
async function imageFromFile(file: File): Promise<string | undefined> {
  const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
  if (file.type === "image/gif") return file.size <= 2_000_000 ? url : undefined;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const side = Math.min(256, Math.max(image.naturalWidth, image.naturalHeight));
      const scale = side / Math.max(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.9));
    };
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

export default function ObjectEditor({ object }: { object: BoardObject }) {
  const set = (patch: Partial<BoardObject>) => updateBoardObject(object.id, patch);
  const lockDc = object.lockDc ?? DEFAULT_CHEST_LOCK_DC;
  return <div className="mesa-panel-section"><h4>CONFIGURAR: {object.name.toUpperCase()}</h4>
    <label className="mesa-panel-field"><span>Nome</span><div><input value={object.name} maxLength={60} onChange={(event) => set({ name: event.target.value })}/></div></label>
    <div className="mesa-object-image-row">
      <span className="mesa-mini-portrait">{object.image ? <img src={object.image} alt=""/> : <PackageOpen/>}</span>
      <label className="mesa-token-pick"><ImageUp/>{object.image ? "Trocar imagem" : "Imagem do token"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void imageFromFile(file).then((image) => image && set({ image })); }}/></label>
      {object.image && <button type="button" onClick={() => set({ image: undefined })}>Tirar imagem</button>}
    </div>
    <label className="mesa-panel-field"><span>Descrição (aparece ao abrir o item)</span><div><textarea rows={2} value={object.description ?? ""} maxLength={400} onChange={(event) => set({ description: event.target.value })}/></div></label>
    <div className="mesa-grid-settings-row">
      <label>Trancado<input type="checkbox" checked={object.locked} onChange={(event) => set({ locked: event.target.checked })}/></label>
      <label>Fechadura<select value={LOCK_PRESETS.some((preset) => preset.dc === lockDc) ? lockDc : "custom"} onChange={(event) => event.target.value !== "custom" && set({ lockDc: Number(event.target.value) })}>{LOCK_PRESETS.map((preset) => <option key={preset.dc} value={preset.dc}>{preset.label}</option>)}<option value="custom">Outra CD</option></select></label>
      <label>CD<input type="number" min={1} max={60} value={lockDc} onChange={(event) => set({ lockDc: num(event.target.value, 1, 60, DEFAULT_CHEST_LOCK_DC) })}/></label>
    </div>
    <div className="mesa-grid-settings-row">
      <label>Tranca Arcana (+10)<input type="checkbox" checked={Boolean(object.magicLocked)} onChange={(event) => set({ magicLocked: event.target.checked, ...(event.target.checked ? { locked: true } : { magicBonus: 0 }) })}/></label>
      {object.magicLocked && <label>CD Misticismo<input type="number" min={1} max={60} value={object.magicDc ?? 20} onChange={(event) => set({ magicDc: num(event.target.value, 1, 60, 20) })}/></label>}
      {object.magicLocked && <label>Aprimoramentos<select value={object.magicBonus ?? 0} onChange={(event) => set({ magicBonus: Number(event.target.value) })}><option value={0}>Nenhum</option><option value={5}>+5 CD</option><option value={10}>+10 CD</option></select></label>}
    </div>
    <label className="mesa-panel-field"><span>Conteúdo (um item por linha)</span><div>
      <textarea rows={4} value={object.contents.join("\n")} onChange={(event) => set({ contents: event.target.value.split("\n").slice(0, 40) })} onBlur={(event) => set({ contents: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 40) })}/>
    </div></label>
    <TrapEditor trap={object.trap} onChange={(trap) => set({ trap })}/>
  </div>;
}
