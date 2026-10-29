import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "organizer_session";
const SESSION_DAYS = 365;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  provider: string;
  avatarUrl: string | null;
};

let authReady: Promise<void> | null = null;

export function ensureAuthReady(): Promise<void> {
  if (!authReady) {
    authReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "email" text NOT NULL,
          "name" text NOT NULL DEFAULT '',
          "password_hash" text,
          "provider" text NOT NULL DEFAULT 'email',
          "avatar_url" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email")
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" serial PRIMARY KEY NOT NULL,
          "token" text NOT NULL,
          "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "expires_at" timestamp with time zone NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_unique" ON "sessions" ("token")
      `);
      await db.execute(sql`
        ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE
      `);
    })().catch((error) => {
      authReady = null;
      throw error;
    });
  }
  return authReady;
}

/* ───────────── Passwords (scrypt, no external dependency) ───────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/* ───────────── Sessions ───────────── */

export async function createSession(userId: number): Promise<string> {
  await ensureAuthReady();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({ token, userId, expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureAuthReady();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    await ensureAuthReady();
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        provider: users.provider,
        avatarUrl: users.avatarUrl,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error("Unable to resolve the current user", error);
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/* ───────────── Accounts ───────────── */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function findUserByEmail(email: string) {
  await ensureAuthReady();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return row ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  password?: string;
  provider: "email";
  avatarUrl?: string | null;
}) {
  await ensureAuthReady();
  const [row] = await db
    .insert(users)
    .values({
      email: normalizeEmail(input.email),
      name: input.name.trim().slice(0, 80) || normalizeEmail(input.email).split("@")[0],
      passwordHash: input.password ? hashPassword(input.password) : null,
      provider: input.provider,
      avatarUrl: input.avatarUrl ?? null,
    })
    .returning();
  return row;
}


