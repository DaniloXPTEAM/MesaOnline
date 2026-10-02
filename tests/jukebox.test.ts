import { beforeEach, describe, expect, it } from "vitest";
import {
  SOUNDBOARD, jukeboxElement, jukeboxState, loadTrack, pauseTrack,
  setLoop, setVolume, stopTrack, subscribeJukebox, titleFromUrl,
} from "../src/game/jukebox";

/**
 * Antes o painel tinha controles desabilitados e nenhum campo de URL: pela
 * interface não dava para tocar nada. Aqui o player é real.
 */
describe("jukebox", () => {
  beforeEach(() => { stopTrack(); setVolume(0.4); setLoop(true); });

  it("deriva um titulo legivel da URL", () => {
    expect(titleFromUrl("https://cdn/exemplo/taverna_ambiente.mp3")).toBe("taverna ambiente");
    expect(titleFromUrl("https://cdn/a/batalha-final.ogg")).toBe("batalha final");
  });

  it("carrega a faixa e guarda url e titulo", () => {
    loadTrack("https://cdn/tema-da-taverna.mp3");
    expect(jukeboxState().url).toBe("https://cdn/tema-da-taverna.mp3");
    expect(jukeboxState().title).toBe("tema da taverna");
    expect(jukeboxElement()?.src).toContain("tema-da-taverna.mp3");
  });

  it("aceita titulo explicito (arquivo local)", () => {
    loadTrack("blob:abc", "Tema da Fênix");
    expect(jukeboxState().title).toBe("Tema da Fênix");
  });

  it("pausar e parar desligam o estado de tocando", () => {
    loadTrack("https://cdn/x.mp3");
    pauseTrack();
    expect(jukeboxState().playing).toBe(false);
    stopTrack();
    expect(jukeboxState().playing).toBe(false);
  });

  it("volume fica entre 0 e 1 e chega ao elemento", () => {
    setVolume(0.75);
    expect(jukeboxState().volume).toBe(0.75);
    expect(jukeboxElement()?.volume).toBeCloseTo(0.75);
    setVolume(5); expect(jukeboxState().volume).toBe(1);
    setVolume(-2); expect(jukeboxState().volume).toBe(0);
  });

  it("repeticao e refletida no elemento", () => {
    loadTrack("https://cdn/y.mp3");
    setLoop(false);
    expect(jukeboxState().loop).toBe(false);
    expect(jukeboxElement()?.loop).toBe(false);
  });

  it("notifica quem estiver ouvindo", () => {
    let avisos = 0;
    const cancelar = subscribeJukebox(() => { avisos += 1; });
    loadTrack("https://cdn/z.mp3");
    setVolume(0.2);
    cancelar();
    setVolume(0.9);
    expect(avisos).toBe(2);
  });

  it("o soundboard traz efeitos curtos prontos (plim, espada, porta...)", () => {
    expect(SOUNDBOARD.map((slot) => slot.label)).toEqual(["Plim", "Espada", "Porta abrindo", "Impacto", "Magia", "Moedas"]);
  });
});
