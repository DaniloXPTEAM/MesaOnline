import { Film, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { blobUrlForSharedId, sharedAudioUrl, sharedIdFromUrl } from "../../game/sharedAudio";
import type { StageMedia } from "../../game/stageMedia";

/**
 * Mídia no palco: imagem ou vídeo por cima do mapa, para todos. Vídeo toca com som para todos; só o Mestre tem o X.
 * O arquivo do Mestre já está no navegador dele; o dos jogadores chega em pedaços pela sala (`sharedAudio.ts`).
 */
export default function StageMediaOverlay({ media, isMaster, onClose }: { media: StageMedia; isMaster: boolean; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [needsTap, setNeedsTap] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let alive = true;
    setUrl(null); setError(""); setNeedsTap(false);
    const id = sharedIdFromUrl(media.src);
    if (!id) { setUrl(media.src); return; }
    const local = blobUrlForSharedId(id);
    if (local) { setUrl(local); return; }
    sharedAudioUrl(id).then((ready) => { if (alive) setUrl(ready); }).catch(() => { if (alive) setError("A mídia não chegou até você. Peça ao Mestre para mostrar de novo."); });
    return () => { alive = false; };
  }, [media.id, media.src]);

  useEffect(() => {
    if (url && media.kind === "video" && video.current) void video.current.play().catch(() => setNeedsTap(true));
  }, [url, media.kind, media.id]);

  return (
    <div className="mesa-stage-media" role="dialog" aria-label={`Mídia: ${media.name}`} onPointerDown={(event) => event.stopPropagation()} onContextMenu={(event) => event.stopPropagation()}>
      <header>
        <span>{media.kind === "video" ? <Film size={15}/> : null}{media.name}</span>
        {isMaster && <button type="button" aria-label="Fechar mídia" title="Fechar para todos" onClick={onClose}><X size={18}/></button>}
      </header>
      <div className="mesa-stage-media-body">
        {error && <p role="alert">{error}</p>}
        {!error && !url && <p>Carregando a mídia…</p>}
        {url && media.kind === "image" && <img src={url} alt={media.name} draggable={false}/>}
        {url && media.kind === "video" && <video ref={video} src={url} playsInline autoPlay/>}
        {url && media.kind === "video" && needsTap && <button type="button" className="mesa-stage-media-tap" onClick={() => { setNeedsTap(false); void video.current?.play(); }}><Volume2 size={16}/>Tocar com som</button>}
      </div>
    </div>
  );
}
