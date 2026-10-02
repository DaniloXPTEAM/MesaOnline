import React, { useState } from "react";
import { useAuth } from "../../lib/auth/AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(email.trim(), password);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao autenticar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-[#ded7c6] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-black text-[#b92b3a]">{mode === "login" ? "Entrar na conta" : "Criar conta"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-[#726859] hover:bg-[#eae4d5] hover:text-[#b92b3a]">✕</button>
        </div>
        <p className="mb-4 text-xs leading-5 text-[#726859]">Contas permitem compartilhar campanhas com outros jogadores. Requer o servidor local (<code>npm run server</code>) rodando. Seus dados locais continuam funcionando normalmente sem entrar.</p>
        <div className="space-y-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="w-full rounded border border-[#ded7c6] bg-[#fbf9f4] p-2 text-xs" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (mín. 8 caracteres)" type="password" className="w-full rounded border border-[#ded7c6] bg-[#fbf9f4] p-2 text-xs" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </div>
        {error && <p className="mt-2 text-[11px] font-bold text-[#b92b3a]">{error}</p>}
        <button onClick={submit} disabled={busy || !email.trim() || password.length < 1} className="mt-4 w-full rounded bg-[#b92b3a] py-2 text-xs font-bold uppercase text-white hover:bg-[#9c1f2d] disabled:opacity-50">
          {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-3 w-full text-center text-[11px] font-bold text-[#726859] hover:text-[#b92b3a]">
          {mode === "login" ? "Não tem conta? Criar uma agora" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
};
