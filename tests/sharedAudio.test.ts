import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHUNK_BYTES, MAX_SHARED_AUDIO_BYTES, chunksFor, receiveAudioChunk, registerSharedAudio, sharedAudioUrl, sharedIdForBlobUrl, sharedIdFromUrl } from "../src/game/sharedAudio";
import { sanitizeSignal } from "../src/game/signals";

let counter = 0;
function fakeBlobUrl() { counter += 1; return `blob:http://localhost/teste-${counter}`; }

beforeEach(() => {
  // jsdom não cria endereços de blob: devolve um distinto por arquivo recebido.
  URL.createObjectURL = () => `blob:http://localhost/recebido-${Math.random().toString(36).slice(2, 8)}`;
});

describe("áudio do computador enviado aos jogadores", () => {
  it("o arquivo vira pedaços e o jogador o remonta igual", async () => {
    const bytes = new Uint8Array(70_000).map((_, index) => index % 251);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = fakeBlobUrl();
    const id = registerSharedAudio(url, blob, "combate.mp3")!;
    expect(id).toMatch(/^[\w-]{6,64}$/);
    expect(sharedIdForBlobUrl(url)).toBe(id);

    const chunks = await chunksFor(id);
    expect(chunks.length).toBe(Math.ceil(70_000 / CHUNK_BYTES));
    expect(chunks.every((chunk) => chunk.total === chunks.length && chunk.id === id)).toBe(true);

    // Fora de ordem e com um pedaço repetido: mesmo assim completa uma vez.
    const shuffled = [...chunks].reverse();
    shuffled.push(chunks[0]);
    let created = 0;
    const original = URL.createObjectURL;
    let captured: Blob | null = null;
    URL.createObjectURL = (object: Blob | MediaSource) => { created += 1; captured = object as Blob; return original(object); };
    shuffled.forEach((chunk) => receiveAudioChunk(chunk));
    const received = await sharedAudioUrl(id, 1000);
    expect(received).toMatch(/^blob:/);
    expect(created).toBe(1);
    expect(captured!.size).toBe(70_000);
    expect(captured!.type).toBe("audio/mpeg");
    const back = new Uint8Array(await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(captured!);
    }));
    expect(back.slice(0, 5)).toEqual(bytes.slice(0, 5));
    expect(back[69_999]).toBe(bytes[69_999]);
  });

  it("quem pede antes de o arquivo chegar espera e recebe quando completa", async () => {
    const blob = new Blob([new Uint8Array(30_000).fill(7)], { type: "audio/ogg" });
    const id = registerSharedAudio(fakeBlobUrl(), blob, "taverna.ogg")!;
    const chunks = await chunksFor(id);
    const waiting = sharedAudioUrl(id, 1000);
    chunks.forEach((chunk) => receiveAudioChunk(chunk));
    await expect(waiting).resolves.toMatch(/^blob:/);
  });

  it("recusa arquivo acima do limite e pedaços inválidos", async () => {
    const big = { size: MAX_SHARED_AUDIO_BYTES + 1, type: "audio/mpeg", slice: () => new Blob([]) } as unknown as Blob;
    expect(registerSharedAudio(fakeBlobUrl(), big, "gigante.mp3")).toBeNull();

    const spy = vi.spyOn(URL, "createObjectURL");
    receiveAudioChunk(null);
    receiveAudioChunk({ id: "../../x", index: 0, total: 1, data: "AAAA" });
    receiveAudioChunk({ id: "valido-abc123", index: 5, total: 2, data: "AAAA" });
    receiveAudioChunk({ id: "valido-abc123", index: 0, total: 999999, data: "AAAA" });
    receiveAudioChunk({ id: "valido-abc123", index: 0, total: 1, data: "x".repeat(200_000) });
    expect(spy).not.toHaveBeenCalled();
  });

  it("entende o endereço shared:<id> e só aceita ids válidos", () => {
    expect(sharedIdFromUrl("shared:abc123def456")).toBe("abc123def456");
    expect(sharedIdFromUrl("shared:../../etc")).toBeNull();
    expect(sharedIdFromUrl("https://exemplo.com/a.mp3")).toBeNull();
    expect(sanitizeSignal({ kind: "jukebox", url: "shared:abc123def456", title: "Combate", playing: true, loop: true })).toMatchObject({ url: "shared:abc123def456" });
    expect(sanitizeSignal({ kind: "jukebox", url: "shared:../../x", title: "x", playing: true, loop: true })).toBeNull();
  });
});
