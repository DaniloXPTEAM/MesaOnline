import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_CHARACTER_STORAGE_KEY } from "../ficha-modernrpg/characterRoute";
import { openPortalSheet } from "../src/portalLink";

describe("ficha oficial aberta a partir da Mesa", () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

  it("seleciona o personagem como ativo e abre a rota da ficha no Portal", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    openPortalSheet("brakka-punho-de-ferro");
    expect(localStorage.getItem(ACTIVE_CHARACTER_STORAGE_KEY)).toBe("brakka-punho-de-ferro");
    expect(open).toHaveBeenCalledWith("/#/ficha?characterId=brakka-punho-de-ferro", "_blank", "noopener,noreferrer");
  });
});
