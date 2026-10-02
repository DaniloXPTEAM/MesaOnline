import { ArrowLeft, Clock3, Crown, Radio, Shield, Swords, Users } from "lucide-react";
import { useState } from "react";
import type { RuntimeSnapshot } from "../../game/types";
import { hostMultiplayer, joinMultiplayer, recentTables } from "../../game/vttBridge";
import { goToPortal } from "../../portalLink";

interface Props {
  snapshot: RuntimeSnapshot;
  campaigns: string[];
  onEnter: () => void;
}

function roomCodeFromPortal(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("sala")?.trim().toUpperCase().slice(0, 12) || "";
}

export default function MesaLobby({ snapshot, campaigns, onEnter }: Props) {
  // O Portal envia ?sala= quando alguém abre uma mesa já criada. O código só
  // preenche o campo: a entrada continua sendo uma ação explícita do jogador.
  const [code, setCode] = useState(roomCodeFromPortal);
  const [busy, setBusy] = useState("");
  const recent = recentTables();
  // A reentrada automática (restoreMultiplayerSession) não passa por
  // createOnline/join, então o motivo da falha — "mesa já aberta em outra aba",
  // por exemplo — só existe no estado do multiplayer. Sem ler daqui o usuário
  // ficava parado no lobby sem nenhuma explicação.
  const notice = busy || snapshot.multiplayer.error || "";

  async function createOnline() {
    try {
      setBusy("Criando sala…");
      await hostMultiplayer();
      onEnter();
    } catch (error) {
      setBusy((error as Error).message);
    }
  }

  async function join(value = code) {
    try {
      setBusy("Entrando…");
      await joinMultiplayer(value);
      onEnter();
    } catch (error) {
      setBusy((error as Error).message);
    }
  }

  return (
    <main className="mesa-lobby">
      <div className="mesa-lobby-frame">
        <header className="mesa-lobby-head">
          {/* Único vínculo com o Portal: o retorno. A Mesa não recria nenhuma tela dele. */}
          <button className="mesa-portal-back" onClick={goToPortal}><ArrowLeft/>Voltar ao Portal</button>
          <div className="mesa-lobby-brand">
            <span className="mesa-lobby-crest" aria-hidden="true"><Shield/><i/></span>
            <div><strong>Mesa Online</strong><small>TORMENTA 20 · MODERNRPG</small></div>
          </div>
          <small className="mesa-lobby-scenes">{snapshot.scenes.length} cena(s) preparada(s)</small>
        </header>

        <section className="mesa-lobby-hero">
          <div className="mesa-lobby-pitch">
            <span className="eyebrow"><Swords/> AVENTURAS EM ARTON</span>
            <h1>Sua mesa.<br/><em>Sem distrações.</em></h1>
            <p>Abra a cena e deixe o mapa ocupar o foco. Exploração, combate tático e multiplayer usam o mesmo estado compartilhado.</p>
            <button className="mesa-local" onClick={onEnter}><Swords/>Continuar mesa local</button>
          </div>
          <div className="mesa-connect-card">
            <div className="mesa-connect-head"><Crown/><span><strong>Criar mesa</strong><small>Você será o Mestre</small></span></div>
            <button className="mesa-create" onClick={createOnline}><Radio/>Criar sala online</button>
            <i><span>ou entrar por código</span></i>
            <div className="mesa-code">
              <input value={code} maxLength={12} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="CÓDIGO"/>
              <button disabled={!code.trim()} onClick={() => join()}>Entrar</button>
            </div>
            {notice && <p className="mesa-connect-notice" role="status">{notice}</p>}
          </div>
        </section>

        <section className="mesa-lobby-lists">
          <article>
            <h2><Clock3/>Mesas recentes</h2>
            {recent.length
              ? recent.map((room) => <button key={room} onClick={() => join(room)}><Radio/><span><strong>{room}</strong><small>Reconectar à sala</small></span></button>)
              : <p>Nenhuma sala online recente.</p>}
          </article>
          <article>
            <h2><Users/>Campanhas</h2>
            {campaigns.length
              ? campaigns.map((campaign) => <button key={campaign} onClick={onEnter}><Swords/><span><strong>{campaign}</strong><small>Abrir na cena atual</small></span></button>)
              : <p>Crie campanhas no Portal ModernRPG.</p>}
          </article>
        </section>
      </div>
    </main>
  );
}
