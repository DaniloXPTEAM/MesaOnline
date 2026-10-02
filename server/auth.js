/**
 * Autenticação mínima: hash de senha (scrypt, sem dependência externa) e
 * tokens de sessão assinados com HMAC (sem JWT externo). O segredo de
 * assinatura fica só no servidor e é gerado/persistido localmente na
 * primeira execução.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRET_PATH = path.join(process.env.MODERNRPG_DATA_DIR || path.join(__dirname, "data"), "secret.key");

function loadOrCreateSecret() {
  try {
    return fs.readFileSync(SECRET_PATH, "utf8").trim();
  } catch {
    const secret = crypto.randomBytes(32).toString("hex");
    fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
    fs.writeFileSync(SECRET_PATH, secret, "utf8");
    return secret;
  }
}

const SECRET = process.env.AUTH_SECRET || loadOrCreateSecret();
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias — "permanecer autenticado"

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function signToken(payload) {
  const body = { ...payload, exp: Date.now() + TOKEN_TTL_SECONDS * 1000 };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(body)));
  const sig = base64url(crypto.createHmac("sha256", SECRET).update(payloadB64).digest());
  return `${payloadB64}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = base64url(crypto.createHmac("sha256", SECRET).update(payloadB64).digest());
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromBase64url(payloadB64).toString("utf8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
