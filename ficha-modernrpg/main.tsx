/**
 * ENTRYPOINT do app da ficha oficial ModernRPG.
 *
 * Cadeia da rota oficial:
 *   index.html (raiz) → <script src="/ficha-modernrpg/main.tsx">
 *   → condição de rota: hash "/ficha" (com ou sem ?characterId=)
 *   → render de <FichaRoute/> (ficha-modernrpg/sheet/FichaRoute.tsx)
 *     → resolveRoutedCharacter(): localiza o CharacterSheet pelo id real,
 *       torna-o ativo e abre a ficha oficial (sem fallback silencioso).
 */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { FichaRoute } from "./sheet/FichaRoute";
import "./styles.css";

const hashPath = (): string => {
  const raw = window.location.hash.replace(/^#/, "");
  return raw.split("?")[0] || "/";
};

const App: React.FC = () => {
  const [path, setPath] = useState(hashPath);
  useEffect(() => {
    const onChange = () => setPath(hashPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  // ── Condição de rota: /#/ficha?characterId=<id> → ficha oficial ──
  if (path === "/ficha") return <FichaRoute />;

  return (
    <div className="mx-auto max-w-lg p-10 text-center text-[#726859]">
      <h1 className="font-serif text-2xl font-black text-[#b92b3a]">Ficha ModernRPG — Tormenta 20</h1>
      <p className="mt-3 text-sm">
        A ficha oficial abre pela rota <code className="rounded bg-[#f7f3e9] px-1">/#/ficha?characterId=&lt;CharacterSheet.id&gt;</code>.
      </p>
      <a href="#/ficha" className="mt-4 inline-block rounded bg-[#b92b3a] px-6 py-2 text-sm font-bold uppercase tracking-wider text-white shadow hover:bg-[#9c1f2d]">
        Abrir minha ficha →
      </a>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
