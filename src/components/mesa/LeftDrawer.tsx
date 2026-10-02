import { motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
}

export default function LeftDrawer({ title, subtitle, icon: Icon, onClose, children }: Props) {
  return (
    <motion.aside
      className="mesa-left-drawer"
      initial={{ x: -28, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -28, opacity: 0 }}
      transition={{ duration: .2, ease: "easeOut" }}
    >
      <header><span><Icon/></span><div><strong>{title}</strong><small>{subtitle}</small></div><button onClick={onClose} title="Fechar painel" aria-label="Fechar painel"><X/></button></header>
      <div className="mesa-drawer-scroll">{children}</div>
    </motion.aside>
  );
}
