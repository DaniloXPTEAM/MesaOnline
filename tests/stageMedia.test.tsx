import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("mídia no palco: arquivos", () => {
  it("aceita imagem e vídeo conhecidos e recusa o resto, com o limite de cada um", async () => {
    const { checkMediaFile, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } = await import("../src/game/stageMedia");
    expect(checkMediaFile({ type: "image/png", size: 1000 })).toEqual({ ok: true, kind: "image" });
    expect(checkMediaFile({ type: "video/mp4", size: 1000 })).toEqual({ ok: true, kind: "video" });
    expect(checkMediaFile({ type: "application/pdf", size: 1000 })).toMatchObject({ ok: false });
    expect(checkMediaFile({ type: "image/svg+xml", size: 1000 })).toMatchObject({ ok: false });
    expect(checkMediaFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toMatchObject({ ok: false });
    expect(checkMediaFile({ type: "video/webm", size: MAX_VIDEO_BYTES + 1 })).toMatchObject({ ok: false });
    expect(checkMediaFile({ type: "image/png", size: 0 })).toMatchObject({ ok: false });
  });

  it("a biblioteca guarda, lista (mais novo primeiro) e remove", async () => {
    const { saveMedia, listMedia, deleteMedia } = await import("../src/game/stageMedia");
    const a = await saveMedia(new Blob([new Uint8Array(10)], { type: "image/png" }), "Taverna");
    await new Promise((resolve) => setTimeout(resolve, 5));
    const b = await saveMedia(new Blob([new Uint8Array(20)], { type: "video/mp4" }), "Abertura do herói");
    expect((await listMedia()).map((item) => item.name)).toEqual(["Abertura do herói", "Taverna"]);
    expect((await listMedia())[0]).toMatchObject({ kind: "video", size: 20 });
    await deleteMedia(a.id);
    expect((await listMedia()).map((item) => item.id)).toEqual([b.id]);
    await expect(saveMedia(new Blob(["x"], { type: "text/html" }), "Script")).rejects.toThrow(/Formato não aceito/);
  });
});

describe("mídia no palco: mesa", () => {
  const media = { id: "stage-1", kind: "video" as const, name: "Apresentação do Kaleb", src: "shared:abcdef123456", shownAt: 1 };

  it("o Mestre mostra e fecha; o Diário registra o que foi mostrado; o jogador recebe a mídia no estado", async () => {
    const bridge = await import("../src/game/vttBridge");
    bridge.showStageMedia(media);
    expect(bridge.getRuntimeSnapshot().board.stageMedia).toMatchObject({ name: "Apresentação do Kaleb", kind: "video" });
    expect(bridge.getRuntimeSnapshot().board.chat.some((entry) => entry.text === "Foi mostrado o vídeo “Apresentação do Kaleb”.")).toBe(true);
    expect(bridge.wireStateForPeer("peer-jogador").scenes[0].board.stageMedia).toMatchObject({ id: "stage-1" });
    bridge.showStageMedia({ ...media, id: "stage-2", kind: "image", name: "Retrato" });
    expect(bridge.getRuntimeSnapshot().board.chat.some((entry) => entry.text === "Foi mostrada a imagem “Retrato”.")).toBe(true);
    bridge.closeStageMedia();
    expect(bridge.getRuntimeSnapshot().board.stageMedia).toBeUndefined();
  });

  it("recarregar a página não traz a mídia de volta (o arquivo não sobrevive)", async () => {
    let bridge = await import("../src/game/vttBridge");
    bridge.showStageMedia(media);
    vi.resetModules();
    bridge = await import("../src/game/vttBridge");
    expect(bridge.getRuntimeSnapshot().board.stageMedia).toBeUndefined();
  });

  it("só o Mestre tem o X: jogador vê a mídia sem botão de fechar", async () => {
    const { default: StageMediaOverlay } = await import("../src/components/mesa/StageMediaOverlay");
    const asMaster = renderToStaticMarkup(<StageMediaOverlay media={{ ...media, src: "https://exemplo/x.png", kind: "image" }} isMaster onClose={() => undefined}/>);
    const asPlayer = renderToStaticMarkup(<StageMediaOverlay media={{ ...media, src: "https://exemplo/x.png", kind: "image" }} isMaster={false} onClose={() => undefined}/>);
    expect(asMaster).toContain('aria-label="Fechar mídia"');
    expect(asPlayer).not.toContain('aria-label="Fechar mídia"');
    expect(asPlayer).toContain("Apresentação do Kaleb");
  });

  it("o arquivo de vídeo e imagem viaja em pedaços como o áudio (tipo aceito pelo receptor)", async () => {
    const shared = await import("../src/game/sharedAudio");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:teste-video" }));
    shared.receiveAudioChunk({ id: "videoabcdef12", name: "v", mime: "video/mp4", index: 0, total: 1, data: btoa("abc") });
    await expect(shared.sharedAudioUrl("videoabcdef12", 500)).resolves.toBe("blob:teste-video");
  });
});
