import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthContext";
import { listSharedCampaigns, type SharedCampaign } from "../../lib/auth/client";
import type { CampaignRecord } from "../views/CampaignsView";

interface Props {
  localCampaigns: CampaignRecord[];
  onImport: (record: CampaignRecord) => void;
}

export const SharedWithMePanel: React.FC<Props> = ({ localCampaigns, onImport }) => {
  const { user } = useAuth();
  const [list, setList] = useState<SharedCampaign[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setList([]);
      return;
    }
    listSharedCampaigns()
      .then((all) => setList(all.filter((c) => !c.isOwner)))
      .catch((e) => setError(e instanceof Error ? e.message : "Falha ao carregar campanhas compartilhadas."));
  }, [user]);

  if (!user || (list.length === 0 && !error)) return null;

  const importOne = (c: SharedCampaign) => {
    const data = c.data as unknown as CampaignRecord;
    const name = String(data.name ?? "Campanha compartilhada");
    const nameTaken = localCampaigns.some((lc) => lc.name === name);
    const record: CampaignRecord = { ...data, id: `camp-shared-${c.id}`, name: nameTaken ? `${name} (compartilhada)` : name };
    onImport(record);
  };

  return (
    <div className="mb-4 rounded-lg border border-[#1c7ed6]/40 bg-[#e7f5ff] p-3">
      <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#1c7ed6]">Campanhas compartilhadas comigo</div>
      {error && <p className="text-xs font-bold text-[#b92b3a]">{error}</p>}
      <div className="space-y-1">
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded border border-[#ded7c6] bg-white px-2 py-1.5 text-xs">
            <span className="font-bold">{String((c.data as { name?: string }).name ?? "Campanha sem nome")}</span>
            <button onClick={() => importOne(c)} className="rounded bg-[#1c7ed6] px-2 py-1 text-[10px] font-bold uppercase text-white">Importar para minhas campanhas</button>
          </div>
        ))}
      </div>
    </div>
  );
};
