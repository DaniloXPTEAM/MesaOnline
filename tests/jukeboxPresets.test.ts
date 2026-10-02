import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAudio, loadAudio, saveAudio } from "../src/game/audioStore";
import { PRESET_COUNT, cachedPresetUrl, forgetPresetUrl, loadPresets, presetAudioKey, presetFileUrl, updatePreset } from "../src/game/jukeboxPresets";
import { extractYoutubeId } from "../src/game/youtubePlayer";

beforeEach(() => { localStorage.clear(); });

describe("links do YouTube", () => {
  it("reconhece os formatos comuns", () => {
    const id = "dQw4w9WgXcQ";
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(extractYoutubeId(`https://youtu.be/${id}?t=10`)).toBe(id);
    expect(extractYoutubeId(`https://m.youtube.com/watch?v=${id}&list=abc`)).toBe(id);
    expect(extractYoutubeId(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(extractYoutubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(extractYoutubeId(`https://music.youtube.com/watch?v=${id}`)).toBe(id);
  });

  it("não confunde outros endereços com YouTube", () => {
    expect(extractYoutubeId("https://exemplo.com/musica.mp3")).toBeNull();
    expect(extractYoutubeId("https://www.youtube.com/watch?v=curto")).toBeNull();
    expect(extractYoutubeId("isso não é um link")).toBeNull();
    expect(extractYoutubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});

describe("cinco faixas da aventura", () => {
  it("começa com cinco linhas vazias", () => {
    const presets = loadPresets();
    expect(presets).toHaveLength(PRESET_COUNT);
    expect(presets.every((preset) => !preset.name && !preset.url && !preset.file)).toBe(true);
  });

  it("guarda nome e link de cada linha e mantém as outras", () => {
    updatePreset(0, { name: "Combate", url: "https://youtu.be/dQw4w9WgXcQ" });
    updatePreset(3, { name: "Taverna" });
    const presets = loadPresets();
    expect(presets[0]).toMatchObject({ name: "Combate", url: "https://youtu.be/dQw4w9WgXcQ" });
    expect(presets[3].name).toBe("Taverna");
    expect(presets[1].name).toBe("");
    updatePreset(0, { url: "https://youtu.be/outraaaaaaa" });
    expect(loadPresets()[0].name).toBe("Combate");
  });

  it("linha fora de 1 a 5 é ignorada e lista corrompida vira vazia", () => {
    updatePreset(7, { name: "x" });
    expect(loadPresets().some((preset) => preset.name === "x")).toBe(false);
    localStorage.setItem("armada-jukebox-presets-v1", "{lixo");
    expect(loadPresets()).toHaveLength(PRESET_COUNT);
  });
});

describe("áudio escolhido no computador", () => {
  it("guarda o arquivo da linha e o devolve depois", async () => {
    const blob = new Blob(["som"], { type: "audio/mpeg" });
    await saveAudio(presetAudioKey(2), blob);
    expect(await loadAudio(presetAudioKey(2))).toBe(blob);
    await deleteAudio(presetAudioKey(2));
    expect(await loadAudio(presetAudioKey(2))).toBeNull();
  });

  it("abre o arquivo da linha uma vez e reaproveita o endereço", async () => {
    const created: string[] = [];
    const revoked: string[] = [];
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
    URL.createObjectURL = () => { const url = `blob:teste-${created.length}`; created.push(url); return url; };
    URL.revokeObjectURL = (url: string) => { revoked.push(url); };
    try {
      await saveAudio(presetAudioKey(1), new Blob(["som"]));
      const first = await presetFileUrl(1, presetAudioKey(1));
      const second = await presetFileUrl(1, presetAudioKey(1));
      expect(first).toBe("blob:teste-0");
      expect(second).toBe(first);
      expect(created).toHaveLength(1);
      expect(cachedPresetUrl(1)).toBe(first);
      forgetPresetUrl(1);
      expect(revoked).toEqual([first]);
      expect(cachedPresetUrl(1)).toBeUndefined();
    } finally {
      URL.createObjectURL = original.create;
      URL.revokeObjectURL = original.revoke;
    }
  });

  it("sem arquivo guardado, a linha avisa em vez de tocar", async () => {
    expect(await presetFileUrl(4, presetAudioKey(4))).toBeNull();
  });
});

describe("YouTube dentro do Jukebox", () => {
  it("link do YouTube usa o player do YouTube; link de áudio volta ao player normal", async () => {
    vi.resetModules();
    const calls: string[] = [];
    vi.doMock("../src/game/youtubePlayer", () => ({
      extractYoutubeId: (await_url: string) => (await_url.includes("youtu") ? "dQw4w9WgXcQ" : null),
      YoutubeTrack: class {
        async load(id: string) { calls.push(`load:${id}`); }
        async play() { calls.push("play"); }
        pause() { calls.push("pause"); }
        stop() { calls.push("stop"); }
        setVolume(volume: number) { calls.push(`volume:${volume}`); }
        setLoop(loop: boolean) { calls.push(`loop:${loop}`); }
      },
    }));
    const jukebox = await import("../src/game/jukebox");
    const { jukeboxSignal } = await import("../src/game/jukeboxSync");

    jukebox.loadTrack("https://youtu.be/dQw4w9WgXcQ", "Combate");
    expect(jukebox.jukeboxState()).toMatchObject({ source: "youtube", title: "Combate", playing: false });
    await jukebox.playTrack();
    expect(jukebox.jukeboxState().playing).toBe(true);
    jukebox.setVolume(0.6);
    jukebox.setLoop(false);
    jukebox.pauseTrack();
    expect(calls).toEqual(expect.arrayContaining(["load:dQw4w9WgXcQ", "play", "volume:0.6", "loop:false", "pause"]));
    expect(jukeboxSignal()).toMatchObject({ kind: "jukebox", url: "https://youtu.be/dQw4w9WgXcQ", title: "Combate" });

    jukebox.loadTrack("https://exemplo.com/taverna.mp3", "Taverna");
    expect(jukebox.jukeboxState().source).toBe("audio");
    expect(calls).toContain("stop");

    // arquivo do computador (blob:) não é enviado aos jogadores
    jukebox.loadTrack("blob:http://localhost/abc");
    expect(jukeboxSignal()).toBeNull();
    vi.doUnmock("../src/game/youtubePlayer");
  });
});
