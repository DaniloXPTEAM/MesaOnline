import { beforeEach, describe, expect, it } from "vitest";
import { importCharacterSheet } from "../src/game/importers";
import { actionsForCharacter } from "../src/tactics/interpretation/characterActionAdapter";

/**
 * Ficha no FORMATO REAL da Oficina (ficha-modernrpg/sheet.ts), nao uma fixture
 * reduzida ao que o importador ja sabia ler. A auditoria mostrou 17 campos
 * descartados em silencio e 2 gravados vazios a forca.
 */
const FICHA_REAL = {
  id: "char-oficina-1",
  name: "Sirlaine de Wynna",
  avatar: "/retrato.png",
  avatarPos: "50% 20%",
  race: "Elfa", raceId: "elfo", raceVariantId: "elfo-solar",
  class: "Arcanista", classId: "arcanista", path: "Mago",
  origin: "Acolito", originId: "acolito",
  deity: "Wynna", deityId: "wynna",
  level: 8, campaign: "A Fenix Rubra", campaignUrl: "https://exemplo/campanha",
  attributes: { for: 1, des: 3, con: 2, int: 5, sab: 2, car: 1 },
  hp: { current: 40, max: 48, temp: 6 },
  mp: { current: 30, max: 36 },
  defenseOther: 3, defenseOtherTemp: 2,
  speed: 9, flySpeed: 12, burrowSpeed: 3,
  skills: { Misticismo: { trained: true, value: 16 } },
  attacks: [{ id: "atk1", name: "Adaga", skill: "Luta", damage: "1d4+1" }],
  racialAbilities: [
    { id: "rac-1", name: "Sentidos Elficos", description: "Voce recebe +2 em Percepcao." },
    { id: "rac-2", name: "Arma de Guerra", description: "Acao padrao: seu ataque causa 1d6 extra." },
  ],
  classAbilities: [
    { id: "cls-1", name: "Caminho do Mago", description: "Voce gasta 2 PM para memorizar outra magia.", level: 1 },
  ],
  powers: [{ id: "pow-1", name: "Foco em Magia", type: "Poder de Arcanista", description: "Passiva.", cost: 0 }],
  spells: [{ id: "sp-1", name: "Bola de Fogo", circle: 3, cost: 5, effect: "6d6 de dano" }],
  equipment: [{ id: "eq-1", name: "Cajado", category: "Arma", quantity: 1 }],
  money: 250, xp: 30000, languages: "Comum, Elfico",
  appearance: "Alta e palida.", personality: "Curiosa.", history: "Criada no templo.",
  journal: [{ id: "j1", title: "Sessao 1", body: "Chegamos a taverna." }],
  builder: { step: 4 },
  conditions: [], notes: "Ficha real",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("importacao no formato REAL da Oficina", () => {
  beforeEach(() => window.localStorage.clear());

  it("preserva identidade, caminho, origem e divindade", () => {
    const sheet = importCharacterSheet(FICHA_REAL);
    expect(sheet.name).toBe("Sirlaine de Wynna");
    expect(sheet.raceId).toBe("elfo");
    expect(sheet.raceVariantId).toBe("elfo-solar");
    expect(sheet.classId).toBe("arcanista");
    expect(sheet.path).toBe("Mago");
    expect(sheet.origin).toBe("Acolito");
    expect(sheet.deity).toBe("Wynna");
    expect(sheet.avatarPos).toBe("50% 20%");
    expect(sheet.campaignUrl).toBe("https://exemplo/campanha");
  });

  it("preserva os deslocamentos alternativos que o motor ja consome", () => {
    const sheet = importCharacterSheet(FICHA_REAL);
    expect(sheet.speed).toBe(9);
    expect(sheet.flySpeed).toBe(12);
    expect(sheet.burrowSpeed).toBe(3);
  });

  it("preserva PV temporario e defesa temporaria", () => {
    const sheet = importCharacterSheet(FICHA_REAL);
    expect(sheet.hp.temp).toBe(6);
    expect(sheet.defenseOtherTemp).toBe(2);
  });

  it("preserva narrativa, diario e passos da Oficina", () => {
    const sheet = importCharacterSheet(FICHA_REAL);
    expect(sheet.appearance).toBe("Alta e palida.");
    expect(sheet.personality).toBe("Curiosa.");
    expect(sheet.history).toBe("Criada no templo.");
    expect(sheet.journal?.length).toBe(1);
    expect(sheet.builder).toBeTruthy();
    expect(sheet.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("NAO grava mais racialAbilities e classAbilities vazias", () => {
    const sheet = importCharacterSheet(FICHA_REAL);
    expect(sheet.racialAbilities.map((a) => a.name)).toEqual(["Sentidos Elficos", "Arma de Guerra"]);
    expect(sheet.classAbilities.map((a) => a.name)).toEqual(["Caminho do Mago"]);
    expect(sheet.classAbilities[0].level).toBe(1);
  });
});

describe("raciais e de classe chegam ao menu de comandos", () => {
  it("viram acoes, classificadas pela mesma heuristica dos poderes", () => {
    const sheet = importCharacterSheet(FICHA_REAL);
    const actions = actionsForCharacter(sheet);

    const racial = actions.find((a) => a.id === "character:racial:rac-2");
    const passiva = actions.find((a) => a.id === "character:racial:rac-1");
    const classe = actions.find((a) => a.id === "character:class:cls-1");

    expect(racial).toBeTruthy();
    expect(passiva).toBeTruthy();
    expect(classe).toBeTruthy();

    // "Acao padrao: ... 1d6 extra" tem gancho mecanico -> poder utilizavel
    expect(racial?.category).toBe("power");
    // "+2 em Percepcao" e passiva -> acao especial, nao vira botao de ataque
    expect(passiva?.category).toBe("special");
    // "gasta 2 PM" tem gancho -> poder utilizavel
    expect(classe?.category).toBe("power");
  });

  it("ficha sem raciais nem de classe nao quebra", () => {
    const sheet = importCharacterSheet({ name: "Simples", level: 1 });
    expect(sheet.racialAbilities).toEqual([]);
    expect(sheet.classAbilities).toEqual([]);
    expect(() => actionsForCharacter(sheet)).not.toThrow();
  });
});
