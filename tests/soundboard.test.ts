import { beforeEach, describe, expect, it } from "vitest";
import { addSound, getFreesoundKey, isPlayableUrl, loadSoundboard, removeSound, searchFreesound, setFreesoundKey } from "../src/game/soundboard";
import { sanitizeSignal, signalAllowedFrom } from "../src/game/signals";

beforeEach(() => { localStorage.clear(); });

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("busca no Freesound", () => {
  it("devolve a prévia MP3 de cada som e ignora resultado sem prévia", async () => {
    const urls: string[] = [];
    const hits = await searchFreesound("espada", "MINHA-CHAVE", async (url) => {
      urls.push(url);
      return okResponse({ results: [
        { id: 1, name: "Espada 1", duration: 1.5, previews: { "preview-hq-mp3": "https://cdn.freesound.org/1.mp3" } },
        { id: 2, name: "Sem prévia", duration: 2, previews: {} },
        { id: 3, name: "Só baixa", duration: 3, previews: { "preview-lq-mp3": "https://cdn.freesound.org/3.mp3" } },
      ] });
    });
    expect(hits.map((hit) => hit.id)).toEqual(["1", "3"]);
    expect(hits[1].url).toBe("https://cdn.freesound.org/3.mp3");
    expect(urls[0]).toContain("query=espada");
    expect(urls[0]).toContain("token=MINHA-CHAVE");
  });

  it("exige a chave e explica quando ela é recusada", async () => {
    await expect(searchFreesound("trovão", "", async () => okResponse({}))).rejects.toThrow(/chave/i);
    await expect(searchFreesound("trovão", "x", async () => ({ ok: false, status: 401, json: async () => ({}) }))).rejects.toThrow(/recusada/i);
    expect(await searchFreesound("   ", "x", async () => okResponse({}))).toEqual([]);
  });
});

describe("lista do soundboard", () => {
  it("guarda, atualiza sem duplicar e remove", () => {
    addSound({ id: "1", label: "Espada", url: "https://cdn.freesound.org/1.mp3" });
    addSound({ id: "2", label: "Trovão", url: "https://cdn.freesound.org/2.mp3" });
    addSound({ id: "1", label: "Espada nova", url: "https://cdn.freesound.org/1b.mp3" });
    expect(loadSoundboard().map((slot) => slot.label)).toEqual(["Trovão", "Espada nova"]);
    expect(removeSound("2").map((slot) => slot.id)).toEqual(["1"]);
  });

  it("lista corrompida vira vazia, e a chave fica só no navegador", () => {
    localStorage.setItem("armada-soundboard-v1", "{lixo");
    expect(loadSoundboard()).toEqual([]);
    setFreesoundKey("  abc  ");
    expect(getFreesoundKey()).toBe("abc");
  });
});

describe("som para toda a mesa", () => {
  it("só toca endereço https ou do próprio site", () => {
    expect(isPlayableUrl("https://cdn.freesound.org/1.mp3")).toBe(true);
    expect(isPlayableUrl("/sons/x.mp3")).toBe(true);
    expect(isPlayableUrl("http://inseguro.com/x.mp3")).toBe(false);
    expect(isPlayableUrl("//outro.com/x.mp3")).toBe(false);
    expect(isPlayableUrl("javascript:alert(1)")).toBe(false);
  });

  it("o sinal de som só é aceito do Mestre e com endereço permitido", () => {
    const sinal = sanitizeSignal({ kind: "sfx", url: "https://cdn.freesound.org/1.mp3" });
    expect(sinal).toEqual({ kind: "sfx", url: "https://cdn.freesound.org/1.mp3" });
    expect(signalAllowedFrom(sinal!, false)).toBe(false);
    expect(signalAllowedFrom(sinal!, true)).toBe(true);
    expect(sanitizeSignal({ kind: "sfx", url: "http://inseguro.com/x.mp3" })).toBeNull();
    expect(sanitizeSignal({ kind: "sfx", url: "javascript:alert(1)" })).toBeNull();
  });
});
