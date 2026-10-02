import React from "react";

interface OfficialCampaign {
  id: string;
  title: string;
  tag: string;
  text: string;
  image: string;
  href: string;
}

/** Para incluir outra campanha oficial, basta acrescentar um item aqui (o `href` aponta para a página em `public/`). */
const OFFICIAL_CAMPAIGNS: OfficialCampaign[] = [
  {
    id: "libertacao-de-valkaria",
    title: "A Libertação de Valkaria",
    tag: "Painel do Mestre",
    text: "NPCs com nível de afinidade, locais da cidade (Templo de Valkaria, Taverna do Corvo, Casa de Banho, Laboratório Alquímico) e missões da campanha.",
    image: "./libertacao/images/templo_valkaria.png",
    href: "./libertacao/index.html",
  },
];

export const OfficialCampaigns: React.FC = () => (
  <section className="mb-4 rounded-lg border border-[#d7ad5d]/60 bg-[#2b261f] p-3 text-white shadow-sm sm:p-4" aria-label="Campanhas Oficiais">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-serif text-lg font-black text-[#f2c572]">📜 Campanhas Oficiais</h2>
      <span className="text-[11px] text-white/60">Escolha uma campanha pronta para jogar</span>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {OFFICIAL_CAMPAIGNS.map((c) => (
        <div key={c.id} className="flex overflow-hidden rounded border border-white/15 bg-[#3b3428]">
          <img src={c.image} alt="" className="h-auto w-28 shrink-0 object-cover sm:w-36" />
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f2c572]">{c.tag}</span>
            <h3 className="font-serif text-lg font-black leading-tight">{c.title}</h3>
            <p className="mt-1 flex-1 text-xs leading-5 text-white/75">{c.text}</p>
            <button onClick={() => window.open(c.href, "_blank", "noopener,noreferrer")} className="mt-2 w-fit rounded bg-[#b92b3a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#9c1f2d]">▶ Abrir campanha</button>
          </div>
        </div>
      ))}
    </div>
  </section>
);
