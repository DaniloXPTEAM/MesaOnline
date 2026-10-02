import { motion } from "framer-motion";
import { Compass, Swords } from "lucide-react";

export default function CombatModeTransition({ mode }: { mode: "exploration" | "combat" }) {
  const Icon = mode === "combat" ? Swords : Compass;
  return <motion.div
    className={`mesa-mode-transition ${mode}`}
    initial={{ opacity: .95 }}
    animate={{ opacity: 0 }}
    transition={{ duration: .38, ease: "easeOut" }}
    aria-hidden="true"
  ><motion.span initial={{ scale: .72, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: .28 }}><Icon/><b>{mode === "combat" ? "BATALHA TÁTICA" : "EXPLORAÇÃO"}</b></motion.span></motion.div>;
}
