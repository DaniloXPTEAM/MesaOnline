/**
 * Backend mínimo do ModernRPG: contas de usuário e compartilhamento de
 * campanhas/personagens. Roda separado do build estático do frontend
 * (vite-plugin-singlefile) — o app continua funcionando 100% localmente
 * sem este servidor; ele só é necessário para login e compartilhamento.
 *
 * Uso local: `npm run server` (porta padrão 4000, configurável via PORT).
 * Aviso: pensado para uso local/pessoal, sem allowlist de origem CORS.
 */
import cors from "cors";
import express from "express";
import { hashPassword, signToken, verifyPassword, verifyToken } from "./auth.js";
import {
  TOKEN_LIMITS,
  addParticipant,
  addTokenForUser,
  createCampaign,
  createTable,
  createUser,
  deleteBook,
  deleteCampaign,
  deleteCharacter,
  deleteTable,
  deleteTokenForUser,
  findUserByEmail,
  findUserById,
  getCampaign,
  getTableByCode,
  listBooksForUser,
  listCampaignsForUser,
  listCharactersForUser,
  listPublicBooks,
  listPublicTables,
  listTokensForUser,
  publicBookView,
  publicTableView,
  publicUser,
  publishBook,
  rateTable,
  removeParticipant,
  setTokenLinkForUser,
  updateCampaignData,
  updateTable,
  upsertCharacter,
} from "./store.js";

const PORT = Number(process.env.PORT) || 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload?.uid || !findUserById(payload.uid)) return res.status(401).json({ error: "Não autenticado." });
  req.userId = payload.uid;
  next();
}

/* --------------------------------- Auth ---------------------------------- */

app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body || {};
  if (!EMAIL_RE.test(String(email || ""))) return res.status(400).json({ error: "E-mail inválido." });
  if (typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "Senha deve ter ao menos 8 caracteres." });
  if (findUserByEmail(email)) return res.status(409).json({ error: "Já existe uma conta com esse e-mail." });
  const user = createUser(email, hashPassword(password));
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(String(password || ""), user.passwordHash)) return res.status(401).json({ error: "E-mail ou senha incorretos." });
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

app.post("/api/auth/logout", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: publicUser(findUserById(req.userId)) }));

/* ------------------------------- Campanhas -------------------------------- */

function serializeCampaign(c, userId) {
  return {
    id: c.id,
    ownerId: c.ownerId,
    isOwner: c.ownerId === userId,
    participants: c.participantIds,
    participantEmails: c.participantIds.map((id) => findUserById(id)?.email).filter(Boolean),
    data: c.data,
    updatedAt: c.updatedAt,
  };
}

app.get("/api/campaigns", requireAuth, (req, res) => {
  res.json({ campaigns: listCampaignsForUser(req.userId).map((c) => serializeCampaign(c, req.userId)) });
});

app.post("/api/campaigns", requireAuth, (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== "object") return res.status(400).json({ error: "Dados da campanha ausentes." });
  const c = createCampaign(req.userId, data);
  res.json({ campaign: serializeCampaign(c, req.userId) });
});

app.put("/api/campaigns/:id", requireAuth, (req, res) => {
  const c = getCampaign(req.params.id);
  if (!c) return res.status(404).json({ error: "Campanha não encontrada." });
  if (c.ownerId !== req.userId) return res.status(403).json({ error: "Só o proprietário pode editar a campanha." });
  const { data } = req.body || {};
  if (!data || typeof data !== "object") return res.status(400).json({ error: "Dados da campanha ausentes." });
  const updated = updateCampaignData(c.id, data);
  res.json({ campaign: serializeCampaign(updated, req.userId) });
});

app.delete("/api/campaigns/:id", requireAuth, (req, res) => {
  const c = getCampaign(req.params.id);
  if (!c) return res.status(404).json({ error: "Campanha não encontrada." });
  if (c.ownerId !== req.userId) return res.status(403).json({ error: "Só o proprietário pode remover a campanha." });
  deleteCampaign(c.id);
  res.json({ ok: true });
});

app.post("/api/campaigns/:id/share", requireAuth, (req, res) => {
  const c = getCampaign(req.params.id);
  if (!c) return res.status(404).json({ error: "Campanha não encontrada." });
  if (c.ownerId !== req.userId) return res.status(403).json({ error: "Só o proprietário pode compartilhar a campanha." });
  const target = findUserByEmail(req.body?.email);
  if (!target) return res.status(404).json({ error: "Nenhuma conta encontrada com esse e-mail." });
  if (target.id === req.userId) return res.status(400).json({ error: "Você já é o proprietário desta campanha." });
  const updated = addParticipant(c.id, target.id);
  res.json({ campaign: serializeCampaign(updated, req.userId) });
});

app.post("/api/campaigns/:id/unshare", requireAuth, (req, res) => {
  const c = getCampaign(req.params.id);
  if (!c) return res.status(404).json({ error: "Campanha não encontrada." });
  if (c.ownerId !== req.userId) return res.status(403).json({ error: "Só o proprietário pode remover participantes." });
  const updated = removeParticipant(c.id, req.body?.userId);
  res.json({ campaign: serializeCampaign(updated, req.userId) });
});

/* ------------------------------- Personagens ------------------------------ */

app.get("/api/characters", requireAuth, (req, res) => {
  const list = listCharactersForUser(req.userId).map((c) => ({ id: c.id, clientId: c.clientId, sheet: c.sheet, updatedAt: c.updatedAt }));
  res.json({ characters: list });
});

app.post("/api/characters", requireAuth, (req, res) => {
  const { clientId, sheet } = req.body || {};
  if (!clientId || !sheet || typeof sheet !== "object") return res.status(400).json({ error: "Ficha inválida." });
  const entry = upsertCharacter(req.userId, clientId, sheet);
  res.json({ character: { id: entry.id, clientId: entry.clientId, sheet: entry.sheet, updatedAt: entry.updatedAt } });
});

app.delete("/api/characters/:id", requireAuth, (req, res) => {
  const list = listCharactersForUser(req.userId);
  if (!list.some((c) => c.id === req.params.id)) return res.status(404).json({ error: "Personagem não encontrado." });
  deleteCharacter(req.params.id);
  res.json({ ok: true });
});

/* ------------------------- Biblioteca de tokens --------------------------- */
/* Imagens de token da conta (data URL), com limite de tamanho e de quantidade por usuário. */

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/** Vínculo do token: ficha (`character`), ameaça do bestiário (`threat`) ou tipo de objeto da cena (`object`). Qualquer outra coisa é descartada. */
function cleanLink(link) {
  if (!link || typeof link !== "object") return undefined;
  if (link.kind !== "character" && link.kind !== "threat" && link.kind !== "object") return undefined;
  const id = String(link.id ?? "").slice(0, 120);
  if (!id) return undefined;
  if (link.kind === "object" && !["item", "chest", "treasure"].includes(id)) return undefined;
  return { kind: link.kind, id, label: String(link.label ?? "").slice(0, 80) };
}

/** Dados que o token traz ao entrar no mapa (janela "Novo token"): só campos conhecidos, com limites. */
function cleanTemplate(template) {
  if (!template || typeof template !== "object") return undefined;
  const num = (value, min, max, fallback) => { const n = Math.round(Number(value)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback; };
  const out = { side: template.side === "threats" ? "threats" : "heroes", hp: num(template.hp, 0, 9999, 10), pm: num(template.pm, 0, 999, 0), defense: num(template.defense, 0, 99, 10) };
  const radius = Number(template.aura?.radiusM);
  if (Number.isFinite(radius) && radius > 0) out.aura = { radiusM: Math.min(90, Math.round(radius * 10) / 10), color: /^#[0-9a-fA-F]{6}$/.test(String(template.aura?.color)) ? template.aura.color : "#ffb765" };
  if (Array.isArray(template.loot)) out.loot = template.loot.slice(0, 12).map((line) => String(line).slice(0, 100)).filter(Boolean);
  return out;
}

const tokenView = (t) => ({ id: t.id, name: t.name, image: t.image, addedAt: t.addedAt, ...(t.link ? { link: t.link } : {}), ...(t.template ? { template: t.template } : {}) });

app.get("/api/tokens", requireAuth, (req, res) => {
  res.json({ tokens: listTokensForUser(req.userId).map(tokenView), limits: TOKEN_LIMITS });
});

app.post("/api/tokens", requireAuth, (req, res) => {
  const name = String(req.body?.name ?? "").trim().slice(0, TOKEN_LIMITS.nameChars);
  const image = req.body?.image;
  if (!name) return res.status(400).json({ error: "Dê um nome ao token." });
  if (typeof image !== "string" || !IMAGE_DATA_URL.test(image)) return res.status(400).json({ error: "Imagem inválida (use PNG, JPG, WEBP ou GIF)." });
  if (image.length > TOKEN_LIMITS.imageChars) return res.status(413).json({ error: "Imagem grande demais (máximo de cerca de 1,5 MB)." });
  if (listTokensForUser(req.userId).length >= TOKEN_LIMITS.perUser) return res.status(409).json({ error: `Limite de ${TOKEN_LIMITS.perUser} tokens na conta.` });
  const entry = addTokenForUser(req.userId, { name, image, link: cleanLink(req.body?.link), template: cleanTemplate(req.body?.template) });
  res.json({ token: tokenView(entry) });
});

app.patch("/api/tokens/:id", requireAuth, (req, res) => {
  const entry = setTokenLinkForUser(req.params.id, req.userId, cleanLink(req.body?.link));
  if (!entry) return res.status(404).json({ error: "Token não encontrado." });
  res.json({ token: tokenView(entry) });
});

app.delete("/api/tokens/:id", requireAuth, (req, res) => {
  if (!deleteTokenForUser(req.params.id, req.userId)) return res.status(404).json({ error: "Token não encontrado." });
  res.json({ ok: true });
});

/* ---------------------------------- Mesas ---------------------------------- */
/* Sem autenticação: criar/entrar por código funciona sem conta, como já
   acontece ao abrir uma sala do VTT. Quem cria recebe um managementToken
   (guardado só no navegador de quem criou) para editar/remover depois. */

app.post("/api/tables", (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Nome da mesa é obrigatório." });
  const t = createTable(req.body || {});
  res.json({ table: publicTableView(t, { includeToken: true }) });
});

app.get("/api/tables", (req, res) => {
  const { system, modality, priceType, q, sort, page } = req.query;
  const { tables, total, hasMore } = listPublicTables({ system, modality, priceType, q, sort, page: Number(page) || 1 });
  res.json({ tables: tables.map((t) => publicTableView(t)), total, hasMore });
});

app.get("/api/tables/code/:code", (req, res) => {
  const t = getTableByCode(req.params.code);
  if (!t) return res.status(404).json({ error: "Nenhuma mesa encontrada com esse código." });
  res.json({ table: publicTableView(t) });
});

app.patch("/api/tables/:id", (req, res) => {
  const { managementToken, patch } = req.body || {};
  const updated = updateTable(req.params.id, managementToken, patch || {});
  if (!updated) return res.status(403).json({ error: "Código de gerenciamento inválido." });
  res.json({ table: publicTableView(updated, { includeToken: true }) });
});

app.delete("/api/tables/:id", (req, res) => {
  const ok = deleteTable(req.params.id, req.body?.managementToken);
  if (!ok) return res.status(403).json({ error: "Código de gerenciamento inválido." });
  res.json({ ok: true });
});

app.post("/api/tables/:id/rate", (req, res) => {
  const updated = rateTable(req.params.id, req.body?.value);
  if (!updated) return res.status(400).json({ error: "Avaliação inválida." });
  res.json({ ratingAvg: publicTableView(updated).ratingAvg, ratingCount: updated.ratingCount });
});

/* --------------------------- Livros (catálogo público) --------------------- */
/* Publicar exige conta (o autor precisa ser identificável); ler/baixar não. */

app.get("/api/books", (req, res) => {
  const { q, system, priceType, page } = req.query;
  const { books, total, hasMore } = listPublicBooks({ q, system, priceType, page: Number(page) || 1 });
  res.json({ books: books.map((b) => publicBookView(b, { ownerEmail: findUserById(b.ownerId)?.email })), total, hasMore });
});

app.get("/api/books/mine", requireAuth, (req, res) => {
  const books = listBooksForUser(req.userId).map((b) => publicBookView(b));
  res.json({ books });
});

app.post("/api/books", requireAuth, (req, res) => {
  const { title, fileUrl, declaresOriginal } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: "Título é obrigatório." });
  if (!fileUrl || !String(fileUrl).trim()) return res.status(400).json({ error: "Link do arquivo é obrigatório." });
  if (!declaresOriginal) return res.status(400).json({ error: "É necessário confirmar que o material é de criação própria." });
  const b = publishBook(req.userId, req.body);
  res.json({ book: publicBookView(b, { ownerEmail: findUserById(req.userId)?.email }) });
});

app.delete("/api/books/:id", requireAuth, (req, res) => {
  const ok = deleteBook(req.params.id, req.userId);
  if (!ok) return res.status(403).json({ error: "Só o autor pode remover este livro." });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`[ModernRPG server] ouvindo em http://localhost:${PORT}`));
