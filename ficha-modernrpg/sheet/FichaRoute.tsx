/**
 * FichaRoute — liga a rota oficial `/#/ficha?characterId=<id>` à ficha oficial.
 *
 * Comportamento exigido pela integração:
 *   1. com `characterId`: localizar o CharacterSheet exato, torná-lo ativo e
 *      abrir a ficha oficial (T20CharacterSheet) — NUNCA abrir outro
 *      personagem por fallback silencioso (id inexistente = erro explícito);
 *   2. sem `characterId`: preservar o comportamento normal da ficha
 *      (renderDefault) ou, na ausência dele, o personagem ativo.
 *
 * Não é uma segunda ficha: apenas monta `T20CharacterSheet` (a ficha oficial)
 * com persistência no armazenamento oficial (`characterRoute.ts`).
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CharacterSheet } from "../sheet";
import {
  getActiveCharacterSheet,
  getCharacterSheetById,
  onCharacterRouteChange,
  resolveRoutedCharacter,
  setActiveCharacterId,
  upsertCharacterSheet,
  CHARACTERS_STORAGE_KEY,
  ACTIVE_CHARACTER_STORAGE_KEY,
} from "../characterRoute";
import { recalc, uid } from "../t20/sheetRules";
import { T20CharacterSheet } from "./T20CharacterSheet";
import { rollFormula, type RollEvent } from "./T20DiceTray";
import { EditCharacterModal } from "./EditCharacterModal";
import { CharacterBuilderWorkshop } from "../workshop/CharacterBuilderWorkshop";

interface Props {
  /** Nomes de campanhas sugeridos na Oficina/edição. */
  campaignNames?: string[];
  /** Comportamento normal quando a rota NÃO traz `characterId`. */
  renderDefault?: () => React.ReactNode;
  /** Permite à página hospedeira reagir às rolagens (ex.: T20DiceTray). */
  onRollExternal?: (e: RollEvent, result: { total: number; detail: string }) => void;
}

type RouteState =
  | { kind: "default" }
  | { kind: "sheet"; characterId: string }
  | { kind: "not-found"; characterId: string };

export const FichaRoute: React.FC<Props> = ({ campaignNames = [], renderDefault, onRollExternal }) => {
  const [route, setRoute] = useState<RouteState>(() => resolveRoute());
  const [sheet, setSheet] = useState<CharacterSheet | null>(() => (route.kind === "sheet" ? getCharacterSheetById(route.characterId) : null));
  const [workshop, setWorkshop] = useState(false);
  const [quickEdit, setQuickEdit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ label: string; detail: string; total: number } | null>(null);

  function resolveRoute(): RouteState {
    const r = resolveRoutedCharacter();
    if (r.mode === "found") return { kind: "sheet", characterId: r.sheet.id };
    if (r.mode === "not-found") return { kind: "not-found", characterId: r.characterId };
    return { kind: "default" };
  }

  /* Rota mudou (hashchange) → resolver de novo. */
  useEffect(() => onCharacterRouteChange(() => {
    const next = resolveRoute();
    setRoute(next);
    setSheet(next.kind === "sheet" ? getCharacterSheetById(next.characterId) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  /* Mudanças externas no armazenamento oficial (ex.: VTT sincronizando). */
  useEffect(() => {
    const reload = (e?: Event) => {
      const key = (e as StorageEvent | undefined)?.key;
      if (key && key !== CHARACTERS_STORAGE_KEY && key !== ACTIVE_CHARACTER_STORAGE_KEY) return;
      setSheet((cur) => {
        if (!cur) return cur;
        return getCharacterSheetById(cur.id) ?? cur;
      });
    };
    window.addEventListener("storage", reload);
    window.addEventListener("modernrpg-characters-changed", reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("modernrpg-characters-changed", reload);
    };
  }, []);

  useEffect(() => {
    if (!lastRoll) return;
    const t = setTimeout(() => setLastRoll(null), 6000);
    return () => clearTimeout(t);
  }, [lastRoll]);

  const save = useCallback((next: CharacterSheet) => {
    setSheet(next);
    upsertCharacterSheet(next);
  }, []);

  const handleRoll = useCallback(
    (e: RollEvent) => {
      const r = rollFormula(e.formula);
      setLastRoll({ label: e.label, detail: r.detail, total: r.total });
      window.dispatchEvent(new CustomEvent("modernrpg-roll", { detail: { ...e, ...r } }));
      onRollExternal?.(e, r);
    },
    [onRollExternal],
  );

  /* ------------------------- Sem characterId: normal ------------------------- */
  if (route.kind === "default") {
    if (renderDefault) return <>{renderDefault()}</>;
    if (creating) {
      return (
        <CharacterBuilderWorkshop
          campaignNames={campaignNames}
          onCancel={() => setCreating(false)}
          onFinish={(built) => {
            // Oficina criou o personagem: salva no armazenamento oficial e abre a ficha.
            upsertCharacterSheet(built);
            setActiveCharacterId(built.id);
            setCreating(false);
            window.location.hash = `#/ficha?characterId=${encodeURIComponent(built.id)}`;
          }}
        />
      );
    }
    const active = getActiveCharacterSheet();
    if (!active) {
      return (
        <div className="mx-auto max-w-lg p-8 text-center text-[#726859]">
          <p className="font-serif text-lg font-bold text-[#b92b3a]">Nenhum personagem ativo</p>
          <p className="mt-2 text-sm">Crie um personagem na Oficina de Heróis ou abra a ficha com <code>#/ficha?characterId=&lt;id&gt;</code>.</p>
          <button onClick={() => setCreating(true)} className="mt-4 rounded bg-[#b92b3a] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d]">
            ⚒️ Criar personagem na Oficina de Heróis
          </button>
        </div>
      );
    }
    return <MountedSheet sheet={active} save={save} onRoll={handleRoll} lastRoll={lastRoll} campaignNames={campaignNames} workshop={[workshop, setWorkshop]} quickEdit={[quickEdit, setQuickEdit]} />;
  }

  /* -------------------- Id inexistente: erro explícito (sem fallback) -------------------- */
  if (route.kind === "not-found" || !sheet) {
    // Aqui a rota só pode ser 'sheet' ou 'not-found' (o caso 'default' já retornou acima).
    const missingId = route.characterId;
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-[#726859]">
        <p className="font-serif text-lg font-bold text-[#b92b3a]">Personagem não encontrado</p>
        <p className="mt-2 text-sm">
          Nenhum <code>CharacterSheet</code> com o id <code className="break-all rounded bg-[#f7f3e9] px-1">{missingId}</code> existe no armazenamento oficial
          (<code>tormenta20_online_characters_v2</code>) deste dispositivo.
        </p>
        <p className="mt-2 text-sm">Por segurança, nenhuma outra ficha será aberta no lugar. Verifique o vínculo do token/personagem ou importe o personagem pela Oficina de Heróis.</p>
      </div>
    );
  }

  return <MountedSheet sheet={sheet} save={save} onRoll={handleRoll} lastRoll={lastRoll} campaignNames={campaignNames} workshop={[workshop, setWorkshop]} quickEdit={[quickEdit, setQuickEdit]} />;
};

/* ------------------- Ficha oficial montada + ações + persistência ------------------- */

interface MountedProps {
  sheet: CharacterSheet;
  save: (s: CharacterSheet) => void;
  onRoll: (e: RollEvent) => void;
  lastRoll: { label: string; detail: string; total: number } | null;
  campaignNames: string[];
  workshop: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  quickEdit: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

const MountedSheet: React.FC<MountedProps> = ({ sheet, save, onRoll, lastRoll, campaignNames, workshop: [workshop, setWorkshop], quickEdit: [quickEdit, setQuickEdit] }) => {
  const levelUp = useMemo(() => () => save(recalc({ ...sheet, level: sheet.level + 1 })), [sheet, save]);
  const clone = useMemo(
    () => () => {
      const copy: CharacterSheet = { ...sheet, id: uid("char"), name: `${sheet.name} (cópia)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      upsertCharacterSheet(copy);
      setActiveCharacterId(copy.id);
      window.location.hash = `#/ficha?characterId=${encodeURIComponent(copy.id)}`;
    },
    [sheet],
  );

  return (
    <div className="relative">
      <T20CharacterSheet
        sheet={sheet}
        onUpdate={save}
        onRoll={onRoll}
        onEdit={() => setWorkshop(true)}
        onQuickEdit={() => setQuickEdit(true)}
        onClone={clone}
        onLevelUp={levelUp}
      />

      {lastRoll && (
        <div className="no-print fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[#ded7c6] bg-white px-4 py-2 text-sm font-bold text-[#2b261f] shadow-lg">
          🎲 {lastRoll.label}: <span className="text-[#b92b3a]">{lastRoll.detail}</span> = {lastRoll.total}
        </div>
      )}

      <EditCharacterModal isOpen={quickEdit} onClose={() => setQuickEdit(false)} current={sheet} onSave={save} campaignNames={campaignNames} />

      {workshop && (
        <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-[#f5f2eb]">
          <CharacterBuilderWorkshop
            initial={sheet}
            campaignNames={campaignNames}
            onCancel={() => setWorkshop(false)}
            onFinish={(built) => {
              // Mantém o MESMO personagem (mesmo id): a Oficina só reedita.
              save({ ...built, id: sheet.id, createdAt: sheet.createdAt, updatedAt: new Date().toISOString() });
              setWorkshop(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FichaRoute;
