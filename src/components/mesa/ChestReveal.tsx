import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { REVEAL_MS, isRevealing } from "../../game/chest";
import type { BoardObject, RuntimeSnapshot } from "../../game/types";

/**
 * Animação de abrir o baú: o conteúdo sobe em cartões, para todos que enxergam o baú. Não mostra
 * exatamente o que o jogador "ganhou": é a representação do que havia dentro, e some sozinha.
 * Dispara quando o carimbo `revealAt` do objeto muda (game/chest.ts); cada abertura toca uma vez por cliente.
 */
export default function ChestReveal({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const shown = useRef(new Set<string>());
  const [active, setActive] = useState<BoardObject | null>(null);

  useEffect(() => {
    const now = Date.now();
    const next = snapshot.board.objects.find((object) => object.opened && isRevealing(object, now) && !shown.current.has(`${object.id}:${object.revealAt}`));
    if (!next) return;
    shown.current.add(`${next.id}:${next.revealAt}`);
    setActive(next);
  }, [snapshot.board.objects]);

  // O relógio fica à parte: se ele morasse no efeito acima, qualquer mudança do tabuleiro (um token andando, um ping)
  // limpava o timer sem criar outro e o aviso ficava preso no meio do palco.
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(null), Math.min(REVEAL_MS, 4500));
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div key={`${active.id}:${active.revealAt}`} className="chest-reveal" role="status" aria-live="polite"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
          <strong>{active.name} aberto</strong>
          <div>
            {(active.contents.length ? active.contents : ["Vazio"]).slice(0, 12).map((item, index) => (
              <motion.span key={`${item}-${index}`} initial={{ opacity: 0, y: 26, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25 + index * 0.16, type: "spring", stiffness: 260, damping: 18 }}>{item}</motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
