import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthContext";
import { createSharedCampaign, listSharedCampaigns, shareCampaign, unshareCampaign, updateSharedCampaign, type SharedCampaign } from "../../lib/auth/client";
import { getShareLinks, setShareLink } from "../../lib/auth/campaignShareLinks";
import type { CampaignRecord } from "../views/CampaignsView";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignRecord | null;
}

export const CampaignShareModal: React.FC<Props> = ({ isOpen, onClose, campaign }) => {
  const { user } = useAuth();
  const [remote, setRemote] = useState<SharedCampaign | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen || !campaign || !user) {
      setRemote(null);
      return;
    }
    const serverId = getShareLinks()[campaign.id];
    if (!serverId) {
      setRemote(null);
      return;
    }
    listSharedCampaigns().then((list) => setRemote(list.find((c) => c.id === serverId) ?? null)).catch(() => setRemote(null));
  }, [isOpen, campaign, user]);

  if (!isOpen || !campaign) return null;

  const activate = async () => {
    setBusy(true);
    setError("");
    try {
      const created = await createSharedCampaign(campaign as unknown as Record<string, unknown>);
      setShareLink(campaign.id, created.id);
      setRemote(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao ativar compartilhamento.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!remote) return;
    setBusy(true);
    setError("");
    try {
      setRemote(await updateSharedCampaign(remote.id, campaign as unknown as Record<string, unknown>));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!remote || !email.trim()) return;
    setBusy(true);
    setError("");
    try {
      setRemote(await shareCampaign(remote.id, email.trim()));
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao compartilhar.");
    } finally {
      setBusy(false);
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!remote) return;
    setBusy(true);
    setError("");
    try {
      setRemote(await unshareCampaign(remote.id, userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover participante.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-[#ded7c6] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-black text-[#b92b3a]">Compartilhar “{campaign.name}”</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-[#726859] hover:bg-[#eae4d5] hover:text-[#b92b3a]">✕</button>
        </div>

        {!user ? (
          <p className="text-xs leading-5 text-[#726859]">Entre na sua conta (canto superior direito) para compartilhar esta campanha com outros jogadores.</p>
        ) : !remote ? (
          <div>
            <p className="mb-3 text-xs leading-5 text-[#726859]">Ative o compartilhamento para convidar jogadores por e-mail. Uma cópia dos dados atuais da campanha é enviada para sua conta; a campanha local não é alterada.</p>
            <button onClick={activate} disabled={busy} className="w-full rounded bg-[#b92b3a] py-2 text-xs font-bold uppercase text-white hover:bg-[#9c1f2d] disabled:opacity-50">{busy ? "Aguarde…" : "Ativar compartilhamento"}</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail do jogador" className="flex-1 rounded border border-[#ded7c6] bg-[#fbf9f4] p-2 text-xs" onKeyDown={(e) => { if (e.key === "Enter") share(); }} />
              <button onClick={share} disabled={busy || !email.trim()} className="rounded bg-[#b92b3a] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Convidar</button>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-black uppercase text-[#726859]">Participantes ({remote.participants.length})</div>
              {remote.participants.length === 0 && <p className="text-xs text-[#9c9180]">Ninguém além de você ainda.</p>}
              <div className="space-y-1">
                {remote.participants.map((pid, i) => (
                  <div key={pid} className="flex items-center justify-between rounded border border-[#ded7c6] bg-[#fbf9f4] px-2 py-1 text-xs">
                    <span className="truncate">{remote.participantEmails[i] ?? pid}</span>
                    <button onClick={() => removeParticipant(pid)} className="ml-2 shrink-0 text-[10px] font-bold uppercase text-[#b92b3a]">Remover</button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={resend} disabled={busy} className="w-full rounded border border-[#ded7c6] bg-white py-2 text-xs font-bold text-[#726859] hover:bg-[#eae4d5] disabled:opacity-50">Reenviar dados atuais da campanha</button>
          </div>
        )}
        {error && <p className="mt-2 text-[11px] font-bold text-[#b92b3a]">{error}</p>}
      </div>
    </div>
  );
};
