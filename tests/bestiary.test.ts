import { describe, expect, it } from "vitest";
import { getOfficialThreats } from "../src/tactics/data/bestiaryAdapter";

const OFFICIAL_THREATS = getOfficialThreats();
import { threatImage } from "../src/tactics/data/threatImages";
import localThreatImages from "../src/tactics/data/threatImageManifest.json";

describe("bestiário completo", () => {
  it("reúne o bestiário principal e as ameaças das campanhas sem colidir ids", () => {
    expect(OFFICIAL_THREATS.length).toBe(611 + 244);
    const campanhas = OFFICIAL_THREATS.slice(611);
    const principais = new Set(OFFICIAL_THREATS.slice(0, 611).map((threat) => threat.id));
    expect(new Set(campanhas.map((threat) => threat.id)).size).toBe(244);
    expect(campanhas.some((threat) => principais.has(threat.id))).toBe(false);
  });

  it("todo token com imagem aponta para a cópia local", () => {
    const comImagem = OFFICIAL_THREATS.filter((threat) => threat.portrait);
    expect(comImagem.length).toBe(505);
    expect(comImagem.every((threat) => threat.portrait!.startsWith("/threat-images/"))).toBe(true);
  });

  it("retrato customizado e link desconhecido não são trocados", () => {
    expect(threatImage({ portrait: "data:image/png;base64,AAA" })).toBe("data:image/png;base64,AAA");
    expect(threatImage({ portrait: "https://exemplo.com/x.png" })).toBe("https://exemplo.com/x.png");
    expect(Object.keys(localThreatImages).length).toBe(486);
  });
});

describe("ameaça do bestiário na ficha da direita", () => {
  it("leva atributos e perícias treinadas para o token", () => {
    const bandido = getOfficialThreats().find((threat) => threat.id === "bandido")!;
    expect(bandido.attrs).toMatchObject({ for: 1, des: 2 });
    expect(bandido.skillBonuses).toEqual({ furtividade: 5 });
  });
  it("as ações (com a busca de magias citadas) só são calculadas quando pedidas, e continuam completas", () => {
    const todos = getOfficialThreats();
    expect(todos.every((threat) => typeof threat.actionCount === "number")).toBe(true);
    expect(todos.find((threat) => threat.id === "bandido")!.customActions!.length).toBeGreaterThan(0);
  });
});
