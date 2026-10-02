/**
 * Armazenamento mínimo em arquivo JSON local (sem banco de dados externo).
 * Suficiente para o escopo pedido: contas, campanhas e personagens com
 * proprietário e participantes. Todas as mutações persistem em disco de
 * forma síncrona logo em seguida, evitando corrupção por concorrência.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// MODERNRPG_DATA_DIR troca a pasta dos dados (usado nos testes, para não tocar nos dados reais).
const DATA_DIR = process.env.MODERNRPG_DATA_DIR || path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return { users: [], campaigns: [], characters: [], tables: [] };
  }
}

const db = load();
db.tables ??= [];
db.books ??= [];
db.tokens ??= [];

function persist() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------- Usuários -------------------------------- */

export function findUserByEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return db.users.find((u) => u.email === e) || null;
}

export function findUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}

export function createUser(email, passwordHash) {
  const user = { id: uid("user"), email: String(email).trim().toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
  db.users.push(user);
  persist();
  return user;
}

export function publicUser(user) {
  return { id: user.id, email: user.email };
}

/* ------------------------------- Campanhas -------------------------------- */

export function listCampaignsForUser(userId) {
  return db.campaigns.filter((c) => c.ownerId === userId || c.participantIds.includes(userId));
}

export function getCampaign(id) {
  return db.campaigns.find((c) => c.id === id) || null;
}

export function createCampaign(ownerId, data) {
  const campaign = { id: uid("scamp"), ownerId, participantIds: [], data, updatedAt: new Date().toISOString() };
  db.campaigns.push(campaign);
  persist();
  return campaign;
}

export function updateCampaignData(id, data) {
  const c = getCampaign(id);
  if (!c) return null;
  c.data = data;
  c.updatedAt = new Date().toISOString();
  persist();
  return c;
}

export function deleteCampaign(id) {
  const before = db.campaigns.length;
  db.campaigns = db.campaigns.filter((c) => c.id !== id);
  if (db.campaigns.length !== before) persist();
  return before !== db.campaigns.length;
}

export function addParticipant(campaignId, userId) {
  const c = getCampaign(campaignId);
  if (!c) return null;
  if (c.ownerId !== userId && !c.participantIds.includes(userId)) c.participantIds.push(userId);
  persist();
  return c;
}

export function removeParticipant(campaignId, userId) {
  const c = getCampaign(campaignId);
  if (!c) return null;
  c.participantIds = c.participantIds.filter((id) => id !== userId);
  persist();
  return c;
}

/* ------------------------------- Personagens ------------------------------ */

export function listCharactersForUser(userId) {
  return db.characters.filter((c) => c.ownerId === userId);
}

export function getCharacter(id) {
  return db.characters.find((c) => c.id === id) || null;
}

export function upsertCharacter(ownerId, clientId, sheet) {
  let entry = db.characters.find((c) => c.ownerId === ownerId && c.clientId === clientId);
  if (!entry) {
    entry = { id: uid("schar"), ownerId, clientId, sheet, updatedAt: new Date().toISOString() };
    db.characters.push(entry);
  } else {
    entry.sheet = sheet;
    entry.updatedAt = new Date().toISOString();
  }
  persist();
  return entry;
}

export function deleteCharacter(id) {
  const before = db.characters.length;
  db.characters = db.characters.filter((c) => c.id !== id);
  if (db.characters.length !== before) persist();
  return before !== db.characters.length;
}

/* ------------------------- Biblioteca de tokens --------------------------- */

export const TOKEN_LIMITS = { perUser: 200, imageChars: 2_000_000, nameChars: 60 };

export function listTokensForUser(userId) {
  return db.tokens.filter((t) => t.ownerId === userId);
}

export function addTokenForUser(ownerId, { name, image, link, template }) {
  const entry = { id: uid("tok"), ownerId, name, image, addedAt: Date.now(), ...(link ? { link } : {}), ...(template ? { template } : {}) };
  db.tokens.push(entry);
  persist();
  return entry;
}

export function setTokenLinkForUser(id, ownerId, link) {
  const entry = db.tokens.find((t) => t.id === id && t.ownerId === ownerId);
  if (!entry) return null;
  if (link) entry.link = link;
  else delete entry.link;
  persist();
  return entry;
}

export function deleteTokenForUser(id, ownerId) {
  const before = db.tokens.length;
  db.tokens = db.tokens.filter((t) => !(t.id === id && t.ownerId === ownerId));
  if (db.tokens.length !== before) persist();
  return before !== db.tokens.length;
}

/* --------------------------------- Mesas ---------------------------------- */

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem O/0/I/1 (ambíguos)
  let code;
  do {
    code = Array.from({ length: 8 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  } while (db.tables.some((t) => t.code === code));
  return code;
}

export function createTable(data) {
  const table = {
    id: uid("table"),
    code: genCode(),
    managementToken: crypto.randomBytes(24).toString("hex"),
    name: data.name,
    system: data.system || "",
    modality: data.modality === "presencial" ? "presencial" : "online",
    priceType: data.priceType === "paga" ? "paga" : "gratuita",
    priceValue: data.priceType === "paga" ? Number(data.priceValue) || 0 : 0,
    schedule: data.schedule || "",
    gmName: data.gmName || "",
    seatsTotal: Math.max(1, Number(data.seatsTotal) || 1),
    seatsFilled: 0,
    ageRating: data.ageRating || "livre",
    vttPlatform: data.vttPlatform || "Mesa de Arton (deste site)",
    description: data.description || "",
    imageUrl: data.imageUrl || "",
    contactInfo: data.contactInfo || "",
    liveRoomCode: data.liveRoomCode || "",
    kind: data.kind === "campanha" ? "campanha" : "oneshot",
    isPublic: !!data.isPublic,
    ratingSum: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.tables.push(table);
  persist();
  return table;
}

export function getTableById(id) {
  return db.tables.find((t) => t.id === id) || null;
}

export function getTableByCode(code) {
  return db.tables.find((t) => t.code === String(code || "").toUpperCase()) || null;
}

const TABLE_PATCH_FIELDS = ["kind", "name", "system", "modality", "priceType", "priceValue", "schedule", "gmName", "seatsTotal", "seatsFilled", "ageRating", "vttPlatform", "description", "imageUrl", "contactInfo", "liveRoomCode", "isPublic"];

export function updateTable(id, managementToken, patch) {
  const t = getTableById(id);
  if (!t || t.managementToken !== managementToken) return null;
  for (const key of TABLE_PATCH_FIELDS) {
    if (patch[key] !== undefined) t[key] = patch[key];
  }
  persist();
  return t;
}

export function deleteTable(id, managementToken) {
  const t = getTableById(id);
  if (!t || t.managementToken !== managementToken) return false;
  db.tables = db.tables.filter((x) => x.id !== id);
  persist();
  return true;
}

export function rateTable(id, value) {
  const t = getTableById(id);
  if (!t) return null;
  const v = Math.min(5, Math.max(1, Number(value) || 0));
  if (!v) return null;
  t.ratingSum += v;
  t.ratingCount += 1;
  persist();
  return t;
}

export function listPublicTables({ system, modality, priceType, q, sort = "relevancia", page = 1, pageSize = 12 } = {}) {
  let list = db.tables.filter((t) => t.isPublic);
  if (system) list = list.filter((t) => t.system.toLowerCase().includes(String(system).toLowerCase()));
  if (modality) list = list.filter((t) => t.modality === modality);
  if (priceType) list = list.filter((t) => t.priceType === priceType);
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((t) => t.name.toLowerCase().includes(s) || t.system.toLowerCase().includes(s) || t.description.toLowerCase().includes(s));
  }
  const sorted = [...list].sort((a, b) => {
    if (sort === "recentes") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "vagas") return (b.seatsTotal - b.seatsFilled) - (a.seatsTotal - a.seatsFilled);
    if (sort === "preco") return a.priceValue - b.priceValue;
    return new Date(b.createdAt) - new Date(a.createdAt); // relevância: por ora, mais recentes primeiro
  });
  const total = sorted.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return { tables: sorted.slice(start, start + pageSize), total, hasMore: start + pageSize < total };
}

export function publicTableView(t, { includeToken = false } = {}) {
  const ratingAvg = t.ratingCount ? Math.round((t.ratingSum / t.ratingCount) * 10) / 10 : null;
  const view = {
    id: t.id, code: t.code, name: t.name, system: t.system, modality: t.modality,
    priceType: t.priceType, priceValue: t.priceValue, schedule: t.schedule, gmName: t.gmName,
    seatsTotal: t.seatsTotal, seatsFilled: t.seatsFilled, ageRating: t.ageRating,
    vttPlatform: t.vttPlatform, description: t.description, imageUrl: t.imageUrl,
    contactInfo: t.contactInfo, liveRoomCode: t.liveRoomCode, kind: t.kind === "campanha" ? "campanha" : "oneshot",
    isPublic: t.isPublic, ratingAvg, ratingCount: t.ratingCount, createdAt: t.createdAt,
  };
  if (includeToken) view.managementToken = t.managementToken;
  return view;
}

/* --------------------------- Livros (catálogo público) --------------------- */
/* Todo livro publicado aqui é homebrew por definição (nada oficial pode ser
   hospedado). Guarda só metadados + um link para o arquivo — o arquivo em
   si não é enviado para este servidor. */

export function publishBook(ownerId, data) {
  const book = {
    id: uid("book"),
    ownerId,
    title: data.title,
    authorName: data.authorName || "",
    system: data.system || "",
    coverUrl: data.coverUrl || "",
    fileUrl: data.fileUrl || "",
    priceType: data.priceType === "paga" ? "paga" : "gratuita",
    priceValue: data.priceType === "paga" ? Number(data.priceValue) || 0 : 0,
    description: data.description || "",
    createdAt: new Date().toISOString(),
  };
  db.books.push(book);
  persist();
  return book;
}

export function getBookById(id) {
  return db.books.find((b) => b.id === id) || null;
}

export function deleteBook(id, ownerId) {
  const b = getBookById(id);
  if (!b || b.ownerId !== ownerId) return false;
  db.books = db.books.filter((x) => x.id !== id);
  persist();
  return true;
}

export function listBooksForUser(ownerId) {
  return db.books.filter((b) => b.ownerId === ownerId);
}

export function listPublicBooks({ q, system, priceType, page = 1, pageSize = 12 } = {}) {
  let list = db.books;
  if (system) list = list.filter((b) => b.system.toLowerCase().includes(String(system).toLowerCase()));
  if (priceType) list = list.filter((b) => b.priceType === priceType);
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((b) => b.title.toLowerCase().includes(s) || b.authorName.toLowerCase().includes(s) || b.description.toLowerCase().includes(s));
  }
  const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = sorted.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return { books: sorted.slice(start, start + pageSize), total, hasMore: start + pageSize < total };
}

export function publicBookView(b, { ownerEmail } = {}) {
  return {
    id: b.id, title: b.title, authorName: b.authorName || ownerEmail || "Autor anônimo", system: b.system,
    coverUrl: b.coverUrl, fileUrl: b.fileUrl, priceType: b.priceType, priceValue: b.priceValue,
    description: b.description, createdAt: b.createdAt, ownerId: b.ownerId,
  };
}
