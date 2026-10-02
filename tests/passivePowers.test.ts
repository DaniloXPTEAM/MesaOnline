import { describe, expect, it } from "vitest";
import { actionsForCharacter } from "../src/tactics/interpretation/characterActionAdapter";
import type { CharacterSheet } from "../ficha-modernrpg/sheet";

/** Poderes passivos não podem aparecer como ações; os que têm ativação continuam aparecendo, com o custo certo. */
const power = (name: string, description: string, cost: number | null = null) => ({ id: name, name, type: "Classe", description, cost });
const sheet = { powers: [
  power("Sombra", "+2 Furtividade. Sem penalidade por mover normal. Penalidade por atacar/ação chamativa."),
  power("Pequeno e Rechonchudo", "Seu tamanho é Pequeno e seu deslocamento é 6m. Você recebe +2 em Enganação."),
  power("Ataque Furtivo", "Uma vez por rodada, causa +1d6 dano se atingir criatura desprevenida ou flanqueada."),
  power("Arremessador", "Quando faz um ataque à distância com uma funda ou arma de arremesso, seu dano aumenta."),
  power("Mãos Rápidas", "Uma vez por rodada, pague 1 PM para fazer teste de Ladinagem."),
  power("Especialista", "Escolha perícias. Gaste 1 PM para dobrar seu bônus de treinamento num teste."),
  power("Fúria", "Gaste 2 PM para entrar em Fúria. Recebe +2 em ataque e dano corpo a corpo."),
] , attacks: [], spells: [], equipment: [], racialAbilities: [], classAbilities: [] } as unknown as CharacterSheet;

describe("poderes passivos x ações", () => {
  const actions = actionsForCharacter(sheet);
  const byName = (name: string) => actions.find((action) => action.name === name)!;

  it("passivos caem em 'special' (fora da lista de Agir)", () => {
    for (const name of ["Sombra", "Pequeno e Rechonchudo", "Ataque Furtivo", "Arremessador"]) expect(byName(name).category, name).toBe("special");
  });

  it("poderes com ativação continuam como ação e mostram o custo em PM", () => {
    for (const name of ["Mãos Rápidas", "Especialista", "Fúria"]) expect(byName(name).category, name).toBe("power");
    expect(byName("Mãos Rápidas").pmCost).toBe(1);
    expect(byName("Fúria").pmCost).toBe(2);
  });
});
