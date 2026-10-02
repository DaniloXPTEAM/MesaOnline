// @vitest-environment node
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Backend de conta (server/): isolamento entre contas. Sobe o servidor de verdade numa porta e numa
 * pasta de dados temporárias (nunca toca em server/data) e conversa com ele por HTTP.
 */
const PORT = 4391;
const BASE = `http://127.0.0.1:${PORT}/api`;
let server: ChildProcess;
let dataDir = "";

async function call(method: string, path: string, body?: unknown, token?: string) {
  const response = await fetch(`${BASE}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json().catch(() => ({})) as Record<string, any> };
}
async function account(email: string) {
  const result = await call("POST", "/auth/register", { email, password: "senha-segura-123" });
  return { token: result.body.token as string, id: result.body.user?.id as string, email };
}

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "modernrpg-server-"));
  server = spawn(process.execPath, ["server/index.js"], { env: { ...process.env, PORT: String(PORT), MODERNRPG_DATA_DIR: dataDir }, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  server.stdout?.on("data", (chunk) => { output += String(chunk); });
  server.stderr?.on("data", (chunk) => { output += String(chunk); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { await fetch(`${BASE}/tables`); return; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  throw new Error(`servidor de teste não subiu: ${output.slice(0, 400)}`);
}, 20000);
afterAll(() => { server?.kill(); });

describe("contas", () => {
  it("cadastro valida e-mail, senha e duplicidade; login confere a senha", async () => {
    expect((await call("POST", "/auth/register", { email: "invalido", password: "senha-segura-123" })).status).toBe(400);
    expect((await call("POST", "/auth/register", { email: "a@teste.com", password: "curta" })).status).toBe(400);
    const a = await account("a@teste.com");
    expect(a.token).toBeTruthy();
    expect((await call("POST", "/auth/register", { email: "a@teste.com", password: "senha-segura-123" })).status).toBe(409);
    expect((await call("POST", "/auth/login", { email: "a@teste.com", password: "errada-errada" })).status).toBe(401);
    expect((await call("POST", "/auth/login", { email: "a@teste.com", password: "senha-segura-123" })).status).toBe(200);
  });

  it("sem token ou com token adulterado: 401; a senha nunca volta", async () => {
    const a = await account("b@teste.com");
    expect((await call("GET", "/campaigns")).status).toBe(401);
    expect((await call("GET", "/campaigns", undefined, `${a.token.slice(0, -3)}xxx`)).status).toBe(401);
    const me = await call("GET", "/auth/me", undefined, a.token);
    expect(me.status).toBe(200);
    expect(JSON.stringify(me.body)).not.toMatch(/passwordHash|senha-segura/);
  });

  it("os dados ficam só na pasta temporária do teste", () => {
    expect(existsSync(join(dataDir, "db.json"))).toBe(true);
  });
});

describe("isolamento entre contas", () => {
  it("campanha: só o dono vê, edita, compartilha e apaga; participante lê mas não edita; descompartilhar tira o acesso", async () => {
    const owner = await account("dono@teste.com");
    const other = await account("outro@teste.com");
    const created = await call("POST", "/campaigns", { data: { name: "Ossos de Arton" } }, owner.token);
    const id = created.body.campaign.id as string;
    expect((await call("GET", "/campaigns", undefined, other.token)).body.campaigns).toEqual([]);
    expect((await call("PUT", `/campaigns/${id}`, { data: { name: "roubada" } }, other.token)).status).toBe(403);
    expect((await call("DELETE", `/campaigns/${id}`, undefined, other.token)).status).toBe(403);
    expect((await call("POST", `/campaigns/${id}/share`, { email: "dono@teste.com" }, other.token)).status).toBe(403);

    expect((await call("POST", `/campaigns/${id}/share`, { email: other.email }, owner.token)).status).toBe(200);
    const shared = (await call("GET", "/campaigns", undefined, other.token)).body.campaigns as any[];
    expect(shared).toHaveLength(1);
    expect(shared[0].isOwner).toBe(false);
    expect((await call("PUT", `/campaigns/${id}`, { data: { name: "x" } }, other.token)).status).toBe(403);

    await call("POST", `/campaigns/${id}/unshare`, { userId: other.id }, owner.token);
    expect((await call("GET", "/campaigns", undefined, other.token)).body.campaigns).toEqual([]);
    expect((await call("DELETE", `/campaigns/${id}`, undefined, owner.token)).status).toBe(200);
  });

  it("personagens: cada conta só lista e apaga os próprios", async () => {
    const a = await account("ficha-a@teste.com");
    const b = await account("ficha-b@teste.com");
    const saved = await call("POST", "/characters", { clientId: "vharo", sheet: { name: "Vharo" } }, a.token);
    const id = saved.body.character.id as string;
    expect((await call("GET", "/characters", undefined, b.token)).body.characters).toEqual([]);
    expect((await call("DELETE", `/characters/${id}`, undefined, b.token)).status).toBe(404);
    expect((await call("GET", "/characters", undefined, a.token)).body.characters).toHaveLength(1);
  });

  it("livros: publicar exige conta; só o autor remove", async () => {
    const author = await account("autor@teste.com");
    const other = await account("leitor@teste.com");
    const body = { title: "Bestiário caseiro", fileUrl: "https://exemplo.com/a.pdf", declaresOriginal: true };
    expect((await call("POST", "/books", body)).status).toBe(401);
    const published = await call("POST", "/books", body, author.token);
    const id = published.body.book.id as string;
    expect((await call("DELETE", `/books/${id}`, undefined, other.token)).status).toBe(403);
    expect((await call("GET", "/books/mine", undefined, other.token)).body.books).toEqual([]);
    expect((await call("DELETE", `/books/${id}`, undefined, author.token)).status).toBe(200);
  });

  it("mesas sem conta: só quem tem o código de gerenciamento edita ou remove, e a lista pública não o expõe", async () => {
    const created = await call("POST", "/tables", { name: "Mesa aberta", system: "Tormenta20" });
    const table = created.body.table;
    expect(table.managementToken).toBeTruthy();
    const listed = JSON.stringify((await call("GET", "/tables")).body);
    expect(listed).not.toContain(table.managementToken);
    expect((await call("PATCH", `/tables/${table.id}`, { managementToken: "errado", patch: { name: "x" } })).status).toBe(403);
    expect((await call("DELETE", `/tables/${table.id}`, { managementToken: "errado" })).status).toBe(403);
    expect((await call("DELETE", `/tables/${table.id}`, { managementToken: table.managementToken })).status).toBe(200);
  });
});

describe("biblioteca de tokens da conta", () => {
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  it("exige login, valida a imagem e o nome, e cada conta vê só os seus tokens", async () => {
    const a = await account("tok-a@teste.com");
    const b = await account("tok-b@teste.com");
    expect((await call("GET", "/tokens")).status).toBe(401);
    expect((await call("POST", "/tokens", { name: "", image: PNG }, a.token)).status).toBe(400);
    expect((await call("POST", "/tokens", { name: "Script", image: "data:text/html;base64,PHNjcmlwdD4=" }, a.token)).status).toBe(400);
    expect((await call("POST", "/tokens", { name: "Grande", image: `data:image/png;base64,${"A".repeat(2_100_000)}` }, a.token)).status).toBe(413);
    const created = await call("POST", "/tokens", { name: "Goblin", image: PNG }, a.token);
    expect(created.status).toBe(200);
    const id = created.body.token.id as string;
    expect((await call("GET", "/tokens", undefined, a.token)).body.tokens.map((token: { name: string }) => token.name)).toEqual(["Goblin"]);
    expect((await call("GET", "/tokens", undefined, b.token)).body.tokens).toEqual([]);
    expect((await call("DELETE", `/tokens/${id}`, undefined, b.token)).status).toBe(404);
    expect((await call("DELETE", `/tokens/${id}`, undefined, a.token)).status).toBe(200);
    expect((await call("GET", "/tokens", undefined, a.token)).body.tokens).toEqual([]);
  });

  it("vínculo do token: só ficha ou ameaça; só o dono altera", async () => {
    const a = await account("tok-c@teste.com");
    const b = await account("tok-d@teste.com");
    const created = await call("POST", "/tokens", { name: "Kael", image: PNG, link: { kind: "character", id: "ficha-1", label: "Kael" } }, a.token);
    expect(created.body.token.link).toEqual({ kind: "character", id: "ficha-1", label: "Kael" });
    const id = created.body.token.id as string;
    const bad = await call("POST", "/tokens", { name: "Estranho", image: PNG, link: { kind: "script", id: "x" } }, a.token);
    expect(bad.body.token.link).toBeUndefined();
    expect((await call("PATCH", `/tokens/${id}`, { link: { kind: "threat", id: "bandido", label: "Bandido" } }, b.token)).status).toBe(404);
    const changed = await call("PATCH", `/tokens/${id}`, { link: { kind: "threat", id: "bandido", label: "Bandido" } }, a.token);
    expect(changed.body.token.link).toMatchObject({ kind: "threat", id: "bandido" });
    expect((await call("PATCH", `/tokens/${id}`, { link: null }, a.token)).body.token.link).toBeUndefined();
  });

  it("vínculo a objeto da cena aceita só item, baú ou tesouro", async () => {
    const a = await account("tok-e@teste.com");
    const ok = await call("POST", "/tokens", { name: "Baú velho", image: PNG, link: { kind: "object", id: "chest", label: "Baú" } }, a.token);
    expect(ok.body.token.link).toEqual({ kind: "object", id: "chest", label: "Baú" });
    const bad = await call("POST", "/tokens", { name: "Estranho", image: PNG, link: { kind: "object", id: "dragao", label: "?" } }, a.token);
    expect(bad.body.token.link).toBeUndefined();
  });

  it("dados do token (janela Novo token) são limpos: só campos conhecidos, com limites", async () => {
    const a = await account("tok-f@teste.com");
    const made = await call("POST", "/tokens", { name: "Goblin", image: PNG, template: { side: "threats", hp: 99999, pm: -5, defense: 12.4, aura: { radiusM: 120, color: "javascript:alert(1)" }, loot: ["35 TC", "Adaga", "x".repeat(300)], extra: "descartado" } }, a.token);
    expect(made.body.token.template).toEqual({ side: "threats", hp: 9999, pm: 0, defense: 12, aura: { radiusM: 90, color: "#ffb765" }, loot: ["35 TC", "Adaga", "x".repeat(100)] });
    const hero = await call("POST", "/tokens", { name: "Aliado", image: PNG, template: { side: "qualquer" } }, a.token);
    expect(hero.body.token.template).toEqual({ side: "heroes", hp: 10, pm: 0, defense: 10 });
    const none = await call("POST", "/tokens", { name: "Sem dados", image: PNG }, a.token);
    expect(none.body.token.template).toBeUndefined();
    const listed = await call("GET", "/tokens", undefined, a.token);
    expect(listed.body.tokens.find((token: { name: string }) => token.name === "Goblin").template.side).toBe("threats");
  });
});

