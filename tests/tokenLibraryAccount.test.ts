import { beforeEach, describe, expect, it, vi } from "vitest";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.unstubAllGlobals(); });

describe("biblioteca de tokens: navegador e conta", () => {
  it("sem login, tudo fica no navegador e nenhuma chamada de rede é feita", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const lib = await import("../src/game/tokenLibrary");
    expect(lib.hasAccount()).toBe(false);
    expect(await lib.saveLibraryToken({ id: "tok-1", name: "Goblin", image: PNG, addedAt: 1 })).toEqual({ cloud: false });
    expect((await lib.listLibraryTokens()).map((token) => token.name)).toEqual(["Goblin"]);
    await lib.deleteLibraryToken("tok-1");
    expect(await lib.listLibraryTokens()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("com login, o token sobe para a conta e não aparece duas vezes; se o servidor falhar, fica no navegador", async () => {
    localStorage.setItem("tormenta20_online_auth_token_v1", "jwt-de-teste");
    const cloud: Array<{ id: string; name: string; image: string; addedAt: number }> = [];
    let down = false;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
      if (down) throw new Error("offline");
      const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-de-teste");
      if (init.method === "POST") { const body = JSON.parse(String(init.body)); const token = { id: "tok-servidor", name: body.name, image: body.image, addedAt: 5 }; cloud.push(token); return json({ token }); }
      return json({ tokens: cloud });
    }));
    const lib = await import("../src/game/tokenLibrary");
    expect(lib.hasAccount()).toBe(true);
    expect(await lib.saveLibraryToken({ id: "tok-local", name: "Orc", image: PNG, addedAt: 1 })).toEqual({ cloud: true });
    const list = await lib.listLibraryTokens();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "tok-servidor", name: "Orc", cloud: true });

    down = true;
    const result = await lib.saveLibraryToken({ id: "tok-off", name: "Elfo", image: PNG, addedAt: 9 });
    expect(result.cloud).toBe(false);
    expect(result.error).toBeTruthy();
    expect((await lib.listLibraryTokens()).map((token) => token.name)).toContain("Elfo");
  });

  it("o vínculo de um token do navegador fica guardado e pode ser desfeito", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const lib = await import("../src/game/tokenLibrary");
    const token = { id: "tok-v", name: "Bandido", image: PNG, addedAt: 1 };
    await lib.saveLibraryToken(token);
    await lib.setLibraryTokenLink(token, { kind: "threat", id: "bandido-comum", label: "Bandido Comum" });
    expect((await lib.listLibraryTokens())[0].link).toEqual({ kind: "threat", id: "bandido-comum", label: "Bandido Comum" });
    await lib.setLibraryTokenLink({ ...token, link: { kind: "threat", id: "bandido-comum", label: "Bandido Comum" } }, null);
    expect((await lib.listLibraryTokens())[0].link).toBeUndefined();
  });
});

