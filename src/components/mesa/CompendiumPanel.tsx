import { BookOpen, ChevronRight, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type CompendiumEntry, type CompendiumKind, KIND_LABEL,
  loadCompendium, searchCompendium,
} from "../../game/compendium";

/**
 * Compêndio: consulta rápida dos catálogos oficiais durante a sessão.
 * Os dados já existiam e alimentavam o motor — faltava a porta de entrada.
 *
 * UX do V3: troca de conteúdo no painel, sem abrir caixa nova. O detalhe
 * aparece abaixo do resultado e recolhe ao escolher outro.
 */
export default function CompendiumPanel({ onOpenBestiary, canEdit = true }: { onOpenBestiary?: () => void; canEdit?: boolean } = {}) {
  const [kind, setKind] = useState<CompendiumKind>("spell");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<CompendiumEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    loadCompendium(kind)
      .then((lista) => { if (vivo) { setEntries(lista); setLoading(false); } })
      .catch(() => { if (vivo) { setEntries([]); setLoading(false); } });
    return () => { vivo = false; };
  }, [kind]);

  const resultados = useMemo(() => searchCompendium(entries, query), [entries, query]);
  const aberto = resultados.find((entry) => entry.id === openId);

  return <div className="mesa-panel-stack mesa-compendium">
    {onOpenBestiary && <div className="mesa-automation-list">
      <button disabled={!canEdit} onClick={onOpenBestiary} title={canEdit ? "Abrir a janela do Bestiário" : "Só o Mestre coloca ameaças na mesa"}>
        <BookOpen/><span><strong>Bestiário</strong><small>{canEdit ? "Abre a janela com todas as ameaças: escolha e adicione ao mapa" : "Só o Mestre coloca ameaças na mesa"}</small></span><ChevronRight/>
      </button>
    </div>}
    <div className="mesa-compendium-tabs" role="tablist">
      {(Object.keys(KIND_LABEL) as CompendiumKind[]).map((id) => (
        <button key={id} role="tab" aria-selected={kind === id}
          className={kind === id ? "active" : ""}
          onClick={() => { setKind(id); setOpenId(""); setQuery(""); }}>{KIND_LABEL[id]}</button>
      ))}
    </div>

    <label className="mesa-compendium-search">
      <Search/>
      <input value={query} onChange={(event) => setQuery(event.target.value)}
        placeholder={`Buscar em ${KIND_LABEL[kind].toLowerCase()}…`} aria-label="Buscar no compêndio"/>
    </label>

    <div className="mesa-compendium-count">
      {loading ? <><Loader2 className="spin"/> carregando catálogo…</>
        : <>{resultados.length} de {entries.length} {KIND_LABEL[kind].toLowerCase()}</>}
    </div>

    <div className="mesa-compendium-list">
      {!loading && resultados.length === 0 && <p className="mesa-module-note">Nada encontrado para “{query}”.</p>}
      {resultados.map((entry) => (
        <div key={entry.id} className={`mesa-compendium-row ${openId === entry.id ? "open" : ""}`}>
          <button onClick={() => setOpenId(openId === entry.id ? "" : entry.id)}>
            <strong>{entry.name}</strong>
            {entry.meta && <small>{entry.meta}</small>}
          </button>
          {openId === entry.id && aberto && <div className="mesa-compendium-detail">
            {aberto.fields.length > 0 && <dl>
              {aberto.fields.map((field) => (
                <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
              ))}
            </dl>}
            {aberto.description && <p>{aberto.description}</p>}
          </div>}
        </div>
      ))}
    </div>

    <p className="mesa-module-note"><BookOpen/> Catálogos oficiais do T20 — os mesmos que alimentam fichas e bestiário. Nada é duplicado.</p>
  </div>;
}
