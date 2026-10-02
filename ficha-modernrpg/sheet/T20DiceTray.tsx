import React, { useEffect, useRef, useState } from "react";
import { D20Logo } from "../layout/T20Navbar";

export interface RollEvent {
  label: string;
  /** notação: "1d20+5", "1d8+3", "2d6" */
  formula: string;
}

interface HistoryItem {
  id: number;
  label: string;
  detail: string;
  total: number;
  crit: "hit" | "miss" | null;
  time: string;
}

const TERM = /([+-]?)\s*(\d*)d(\d+)|([+-])\s*(\d+)/gi;

export function rollFormula(formula: string) {
  let total = 0;
  let firstD20: number | null = null;
  let d20count = 0;
  const parts: string[] = [];
  for (const m of formula.matchAll(TERM)) {
    if (m[3]) {
      const neg = m[1] === "-";
      const qty = Math.min(Number(m[2] || 1), 50);
      const sides = Number(m[3]);
      const vals = Array.from({ length: qty }, () => Math.floor(Math.random() * sides) + 1);
      if (sides === 20) {
        d20count += qty;
        if (firstD20 === null) firstD20 = vals[0];
      }
      const sum = vals.reduce((a, b) => a + b, 0);
      total += neg ? -sum : sum;
      parts.push(`${neg ? "−" : parts.length ? "+" : ""}${qty}d${sides}[${vals.join(",")}]`);
    } else if (m[5]) {
      const v = Number(m[5]);
      total += m[4] === "-" ? -v : v;
      parts.push(`${m[4] === "-" ? "−" : "+"}${v}`);
    }
  }
  const crit = d20count === 1 && firstD20 !== null ? (firstD20 === 20 ? "hit" : firstD20 === 1 ? "miss" : null) : null;
  return { total, detail: parts.join(" "), crit } as const;
}

export const T20DiceTray: React.FC<{ activeRoll: RollEvent | null; onClear: () => void }> = ({ activeRoll, onClear }) => {
  const [open, setOpen] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [formula, setFormula] = useState("1d20");
  const [sound, setSound] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const beep = () => {
    if (!soundRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      /* áudio bloqueado */
    }
  };

  const doRoll = (label: string, f: string) => {
    beep();
    const r = rollFormula(f);
    setHistory((h) =>
      [
        { id: Date.now() + Math.random(), label, detail: r.detail, total: r.total, crit: r.crit, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ...h,
      ].slice(0, 25),
    );
  };

  useEffect(() => {
    if (!activeRoll) return;
    setOpen(true);
    doRoll(activeRoll.label, activeRoll.formula);
    onClear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoll]);

  const last = history[0];
  const manualFormula = `${formula}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`;

  return (
    <>
      <div className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          title="Rolador de dados"
          className="relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-[#b92b3a] shadow-lg transition-transform hover:scale-105"
        >
          <D20Logo className="h-14 w-14" />
          {last && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-[#b92b3a] shadow">
              {last.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setSound((v) => !v)}
          title={sound ? "Som ligado" : "Som desligado"}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white shadow ${sound ? "bg-[#b92b3a]" : "bg-gray-400"}`}
        >
          {sound ? "🔊" : "🔇"}
        </button>
      </div>

      {open && (
        <div className="no-print fixed bottom-20 left-4 z-50 w-80 max-w-[92vw] rounded-lg border border-[#ded7c6] bg-[#fbf9f4] p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between border-b border-[#ded7c6] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#726859]">Rolador de Dados</span>
            <button onClick={() => setOpen(false)} className="text-xs font-bold text-[#9c9180] hover:text-[#b92b3a]">✕</button>
          </div>

          {last ? (
            <div className={`mb-3 rounded border p-2 text-center ${last.crit === "hit" ? "border-[#2b8a3e] bg-[#ebfbee]" : last.crit === "miss" ? "border-[#b92b3a] bg-[#fbebee]" : "border-[#ded7c6] bg-white"}`}>
              <div className="truncate text-[11px] font-semibold text-[#726859]">{last.label}</div>
              <div className="font-serif text-3xl font-black text-[#b92b3a]">{last.total}</div>
              <div className="text-[10px] text-[#726859]">{last.detail}</div>
              {last.crit === "hit" && <div className="text-[10px] font-bold text-[#2b8a3e]">✦ 20 natural — acerto crítico!</div>}
              {last.crit === "miss" && <div className="text-[10px] font-bold text-[#b92b3a]">✦ 1 natural — falha crítica!</div>}
            </div>
          ) : (
            <div className="mb-3 rounded border border-dashed border-[#ded7c6] bg-white p-3 text-center text-xs text-[#9c9180]">
              Clique em um atributo, perícia, ataque ou magia da ficha para rolar.
            </div>
          )}

          <div className="mb-2 flex flex-wrap gap-1">
            {["1d20", "1d4", "1d6", "1d8", "1d10", "1d12", "2d6", "3d6"].map((f) => (
              <button key={f} onClick={() => setFormula(f)} className={`rounded border px-2 py-0.5 text-[10px] font-bold ${formula === f ? "border-[#b92b3a] bg-[#fbebee] text-[#b92b3a]" : "border-[#ded7c6] bg-white text-[#726859]"}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center gap-1">
            {[-5, -2, -1, 1, 2, 5].map((v) => (
              <button key={v} onClick={() => setModifier((m) => m + v)} className="flex-1 rounded border border-[#ded7c6] bg-white py-1 text-xs font-bold text-[#2b261f] hover:border-[#b92b3a]">
                {v > 0 ? `+${v}` : v}
              </button>
            ))}
            <button onClick={() => setModifier(0)} title="Zerar" className="rounded border border-[#ded7c6] bg-white px-2 py-1 text-xs font-bold text-[#726859]">fx</button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => doRoll("Rolagem livre", manualFormula)} className="flex-1 rounded bg-[#b92b3a] py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#9c1f2d]">
              Rolar {manualFormula}
            </button>
            <button onClick={() => { setHistory([]); setModifier(0); }} className="rounded border border-[#ded7c6] bg-white px-2.5 text-xs font-bold uppercase text-[#726859]">Limpar</button>
          </div>

          {history.length > 1 && (
            <div className="mt-3 max-h-36 space-y-1 overflow-y-auto border-t border-[#ded7c6] pt-2">
              {history.slice(1).map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded border border-[#eee8da] bg-white px-2 py-1 text-[11px]">
                  <span className="max-w-[150px] truncate font-medium text-[#2b261f]">{h.label}</span>
                  <span className="text-[#726859]">{h.detail} = <strong className="text-[#b92b3a]">{h.total}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
