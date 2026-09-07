import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { Env } from "./db";

const SESSION_COOKIE = "bbs_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000;

import { levelFromPoints } from "./reputation";

export type SessionUser = {
  id: number;
  email: string | null;
  username: string;
  points: number;
  level: string;
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function sanitizeUsername(name: string): string {
  return name.replace(/[<>]/g, "").trim().slice(0, 32);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt);
  return `${toBase64(salt)}:${toBase64(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const salt = fromBase64(saltB64);
  const expected = fromBase64(hashB64);
  const actual = await deriveKey(password, salt);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

export function createSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sessionExpiry(): number {
  return Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
}

export async function getSessionUser(
  db: D1Database,
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.username, u.points
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .bind(token, now)
    .first<{ id: number; email: string | null; username: string; points: number }>();
  if (!row) return null;
  return {
    ...row,
    level: levelFromPoints(row.points),
  };
}

export async function readSessionUser(
  c: Context<{ Bindings: Env }>,
): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE);
  return getSessionUser(c.env.DB, token);
}

export function setSessionCookie(
  c: Context<{ Bindings: Env }>,
  token: string,
  expiresAt: number,
): void {
  const secure = new URL(c.req.url).protocol === "https:";
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    expires: new Date(expiresAt * 1000),
  });
}

export function clearSessionCookie(c: Context<{ Bindings: Env }>): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export { SESSION_COOKIE };
