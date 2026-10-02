import React from "react";

/**
 * Logo d20 (versão mínima autônoma do navbar do site Tormenta 20 Online).
 */
export const D20Logo: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="d20">
    <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="#b92b3a" />
    <polygon points="50,16 82,33 82,67 50,84 18,67 18,33" fill="#fbebee" />
    <polygon points="50,26 72,38 72,62 50,74 28,62 28,38" fill="#b92b3a" />
    <text x="50" y="58" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fbebee" fontFamily="Georgia, serif">
      20
    </text>
  </svg>
);
