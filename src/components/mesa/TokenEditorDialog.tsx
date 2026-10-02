import { ImageUp, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CharacterSheet } from "../../../ficha-modernrpg/sheet";
import { fileToDataUrl } from "../../game/imageEditor";
import { OBJECT_KIND_LABEL } from "../../game/objectPlacement";
import { DEFAULT_FRAME, FRAME_BOX, FRAME_ZOOM_MAX, FRAME_ZOOM_MIN, type TokenFrame, bakeToken, clampFrame, framedSize } from "../../game/tokenFrame";
import type { LibraryToken, TokenLink, TokenTemplate } from "../../game/tokenLibrary";
import type { ThreatTemplate } from "../../game/types";
import { linkFromJson } from "../../game/tokenJson";

/**
 * Novo token / Editar token. A imagem fica sob um círculo fixo e é arrastada até enquadrar a cabeça ou o corpo; abaixo, o
 * nome, o lado, os dados de uma ameaça (PV, PM, Defesa, tesouro), a aura e o vínculo com uma ficha, ameaça ou objeto.
 * Os campos vêm do formulário "Novo token" do VTT antigo; a aparência é a da Mesa.
 */
interface Props {
  token?: LibraryToken;
  sheets: CharacterSheet[];
  threats: ThreatTemplate[];
  onClose: () => void;
  /** `place`: além de guardar na biblioteca, coloca o token no mapa. */
  onSave: (token: LibraryToken, place: boolean) => Promise<void> | void;
  /** Um JSON ligado criou uma ficha ou ameaça nova: a lista de vínculos precisa recarregar. */
  onCatalogChanged?: () => void;
}

const num = (value: string, min: number, max: number, fallback: number) => {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
};

export default function TokenEditorDialog({ token, sheets, threats, onClose, onSave, onCatalogChanged }: Props) {
  const template = token?.template;
  const [source, setSource] = useState(token?.image ?? "");
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [frame, setFrame] = useState<TokenFrame>(DEFAULT_FRAME);
  const [name, setName] = useState(token?.name ?? "");
  const [side, setSide] = useState<TokenTemplate["side"]>(template?.side ?? "heroes");
  const [hp, setHp] = useState(String(template?.hp ?? 10));
  const [pm, setPm] = useState(String(template?.pm ?? 0));
  const [defense, setDefense] = useState(String(template?.defense ?? 10));
  const [auraRadius, setAuraRadius] = useState(String(template?.aura?.radiusM ?? 0));
  const [auraColor, setAuraColor] = useState(template?.aura?.color ?? "#ffb765");
  const [loot, setLoot] = useState((template?.loot ?? []).join("\n"));
  const [linkValue, setLinkValue] = useState(token?.link ? `${token.link.kind}:${token.link.id}` : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; frame: TokenFrame } | null>(null);

  // Mede a imagem sempre que ela troca; o enquadramento volta ao centro.
  useEffect(() => {
    if (!source) { setNatural({ width: 0, height: 0 }); return; }
    let alive = true;
    const image = new Image();
    image.onload = () => { if (alive) { setNatural({ width: image.naturalWidth, height: image.naturalHeight }); setFrame(DEFAULT_FRAME); } };
    image.onerror = () => { if (alive) setError("Não consegui abrir essa imagem."); };
    image.src = source;
    return () => { alive = false; };
  }, [source]);

  async function takeFile(file: File | Blob | undefined | null) {
    if (!file || !file.type.startsWith("image/")) { setError("Escolha um arquivo de imagem (PNG, JPG, WEBP ou GIF)."); return; }
    setError("");
    const data = await fileToDataUrl(file);
    if (data) {
      setSource(data);
      if (!name.trim() && "name" in file && typeof file.name === "string") setName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
    }
  }

  // Ctrl+V com a janela aberta cola a imagem da área de transferência.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const file = [...(event.clipboardData?.files ?? [])].find((entry) => entry.type.startsWith("image/"));
      if (!file) return;
      event.preventDefault();
      void takeFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const shown = useMemo(() => (natural.width ? framedSize(natural.width, natural.height, FRAME_BOX, frame.zoom) : null), [natural, frame.zoom]);
  const clamped = (next: TokenFrame) => (natural.width ? clampFrame(natural.width, natural.height, FRAME_BOX, next) : next);

  /** Liga o token a um arquivo JSON de herói ou de ameaça (a ficha ou a ameaça é criada na hora). */
  async function linkJson(file: File | undefined) {
    if (!file) return;
    try {
      const link = linkFromJson(JSON.parse(await file.text()), source);
      onCatalogChanged?.();
      setLinkValue(`${link.kind}:${link.id}`);
      if (!name.trim()) setName(link.label);
      setError("");
    } catch (cause) {
      setError(`JSON não aceito: ${(cause as Error).message}`);
    }
  }

  function save(place: boolean) {
    if (!source) { setError("Escolha uma imagem para o token."); return; }
    if (!name.trim()) { setError("Dê um nome ao token."); return; }
    setBusy(true);
    setError("");
    void (async () => {
      try {
        const image = await bakeToken(source, frame);
        const [kind, ...rest] = linkValue.split(":");
        const id = rest.join(":");
        const label = kind === "character" ? sheets.find((sheet) => sheet.id === id)?.name
          : kind === "object" ? OBJECT_KIND_LABEL[id as keyof typeof OBJECT_KIND_LABEL]
            : threats.find((threat) => threat.id === id)?.name;
        const link: TokenLink | undefined = linkValue && label ? { kind: kind as TokenLink["kind"], id, label } : undefined;
        const radius = Number(auraRadius);
        const lootLines = loot.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 12);
        const nextTemplate: TokenTemplate = {
          side, hp: num(hp, 0, 9999, 10), pm: num(pm, 0, 999, 0), defense: num(defense, 0, 99, 10),
          ...(radius > 0 ? { aura: { radiusM: Math.min(90, radius), color: auraColor } } : {}),
          ...(lootLines.length ? { loot: lootLines } : {}),
        };
        await onSave({ id: token?.id ?? `tok-${crypto.randomUUID()}`, name: name.trim().slice(0, 60), image, addedAt: token?.addedAt ?? Date.now(), ...(link ? { link } : {}), template: nextTemplate, cloud: token?.cloud }, place);
      } catch (cause) {
        setError((cause as Error).message);
        setBusy(false);
      }
    })();
  }

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="dialog mesa-token-dialog" role="dialog" aria-label={token ? "Editar token" : "Novo token"}>
        <header className="mesa-token-dialog-head">
          <div><small>TOKENS</small><h2>{token ? "Editar token" : "Novo token"}</h2></div>
          <button type="button" aria-label="Fechar" onClick={onClose}><X/></button>
        </header>
        <div className="mesa-token-dialog-grid">
          <div className="mesa-token-frame">
            <div
              className="mesa-token-mold"
              style={{ width: FRAME_BOX, height: FRAME_BOX, touchAction: "none", cursor: source ? "grab" : "default" }}
              onPointerDown={(event) => { if (!source) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, frame }; }}
              onPointerMove={(event) => { const d = drag.current; if (!d || d.pointerId !== event.pointerId) return; setFrame(clamped({ ...d.frame, x: d.frame.x + event.clientX - d.startX, y: d.frame.y + event.clientY - d.startY })); }}
              onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); void takeFile(event.dataTransfer.files[0]); }}
            >
              {source && shown
                ? <img src={source} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: shown.width, height: shown.height, transform: `translate(calc(-50% + ${frame.x}px), calc(-50% + ${frame.y}px))`, maxWidth: "none" }}/>
                : <span className="mesa-token-mold-empty"><ImageUp/>Escolha ou cole uma imagem</span>}
            </div>
            <p className="mesa-module-note">Arraste a imagem para enquadrar dentro do círculo.</p>
            <label className="mesa-token-zoom">Tamanho da imagem
              <input type="range" min={FRAME_ZOOM_MIN * 100} max={FRAME_ZOOM_MAX * 100} value={Math.round(frame.zoom * 100)} disabled={!source}
                onChange={(event) => setFrame((current) => clamped({ ...current, zoom: Number(event.target.value) / 100 }))}/>
            </label>
            <label className="mesa-token-pick"><ImageUp/>{source ? "Trocar imagem" : "Escolher imagem"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void takeFile(file); }}/></label>
          </div>

          <div className="mesa-token-fields">
            <label>Nome<input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Goblin guerreiro"/></label>
            <label>Tipo
              <select value={side} onChange={(event) => setSide(event.target.value as TokenTemplate["side"])}>
                <option value="heroes">Herói ou aliado</option>
                <option value="threats">Ameaça</option>
              </select>
            </label>
            <label>Vincular a
              <select value={linkValue} onChange={(event) => setLinkValue(event.target.value)}>
                <option value="">Sem vínculo (token genérico)</option>
                {sheets.length > 0 && <optgroup label="Ficha (herói)">{sheets.map((sheet) => <option key={sheet.id} value={`character:${sheet.id}`}>{sheet.name}</option>)}</optgroup>}
                <optgroup label="Objeto da cena">{(["item", "chest", "treasure"] as const).map((kind) => <option key={kind} value={`object:${kind}`}>{OBJECT_KIND_LABEL[kind]}</option>)}</optgroup>
                <optgroup label="Ameaça do bestiário">{threats.map((threat) => <option key={threat.id} value={`threat:${threat.id}`}>{threat.name}</option>)}</optgroup>
              </select>
            </label>
            <label className="mesa-token-json-pick">Ou ligar a um arquivo JSON (herói ou ameaça)<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void linkJson(file); }}/></label>
            {side === "threats" && <fieldset>
              <legend>Dados da ameaça</legend>
              <div className="mesa-token-row">
                <label>PV<input type="number" min={0} value={hp} onChange={(event) => setHp(event.target.value)}/></label>
                <label>PM<input type="number" min={0} value={pm} onChange={(event) => setPm(event.target.value)}/></label>
                <label>Defesa<input type="number" min={0} value={defense} onChange={(event) => setDefense(event.target.value)}/></label>
              </div>
              <label>Tesouro (um item por linha)<textarea rows={3} value={loot} onChange={(event) => setLoot(event.target.value)} placeholder={"35 TC\nAdaga"}/></label>
            </fieldset>}
            <fieldset>
              <legend>Aura e luz</legend>
              <div className="mesa-token-row">
                <label>Raio (m)<input type="number" min={0} max={90} step={1.5} value={auraRadius} onChange={(event) => setAuraRadius(event.target.value)}/></label>
                <label>Cor<input type="color" value={auraColor} onChange={(event) => setAuraColor(event.target.value)}/></label>
              </div>
              <p className="mesa-module-note">Raio 0 = sem aura. Com aura, o token ilumina ao redor.</p>
            </fieldset>
          </div>
        </div>
        {error && <p className="mesa-token-error" role="alert">{error}</p>}
        <footer className="mesa-token-dialog-foot">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="button" disabled={busy} onClick={() => save(false)}>{busy ? "Salvando…" : "Salvar na biblioteca"}</button>
          <button type="button" className="primary" disabled={busy} onClick={() => save(true)}><Plus/>Salvar e colocar no mapa</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
