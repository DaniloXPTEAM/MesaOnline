import { jukeboxState, loadTrack, pauseTrack, playTrack, setLoop, subscribeJukebox } from "./jukebox";
import { SHARED_PREFIX, sharedAudioUrl, sharedIdForBlobUrl, sharedIdFromUrl } from "./sharedAudio";
import { type Signal, onSignals } from "./signals";

/** Faixa atual do Jukebox como sinal (volume fica local de cada jogador). */
export function jukeboxSignal(): Signal | null {
  const { url, title, playing, loop } = jukeboxState();
  if (!url) return null;
  if (url.startsWith("blob:")) {
    // Áudio do computador do Mestre: os jogadores o recebem pela sala e tocam pelo id.
    const id = sharedIdForBlobUrl(url);
    return id ? { kind: "jukebox", url: `${SHARED_PREFIX}${id}`, title, playing, loop } : null;
  }
  return { kind: "jukebox", url, title, playing, loop };
}

/**
 * Sincroniza a faixa: o Mestre publica quando faz play/pausa/troca/loop e os
 * jogadores aplicam. `role()` é lida a cada evento (o papel muda ao entrar/sair da sala).
 * `share` envia o arquivo do computador aos jogadores antes de eles precisarem tocá-lo.
 */
export function installJukeboxSync(
  role: () => "local" | "master" | "player",
  send: (signal: Signal) => void,
  share?: (id: string) => Promise<void>,
): () => void {
  let last = "";
  const stopPublishing = subscribeJukebox(() => {
    if (role() !== "master") return;
    const signal = jukeboxSignal();
    if (!signal || signal.kind !== "jukebox") return;
    const fingerprint = `${signal.url}|${signal.playing}|${signal.loop}`;
    if (fingerprint === last) return;
    last = fingerprint;
    const id = sharedIdFromUrl(signal.url);
    if (id && share) void share(id).catch(() => undefined);
    send(signal);
  });
  const stopApplying = onSignals((signal) => {
    if (signal.kind !== "jukebox" || role() !== "player") return;
    const apply = (url: string) => {
      const current = jukeboxState();
      if (url !== current.url) loadTrack(url, signal.title);
      if (signal.loop !== current.loop) setLoop(signal.loop);
      if (signal.playing) void playTrack(); else pauseTrack();
    };
    const id = sharedIdFromUrl(signal.url);
    if (id) void sharedAudioUrl(id).then(apply).catch(() => undefined);
    else apply(signal.url);
  });
  return () => { stopPublishing(); stopApplying(); };
}
