import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

/**
 * Build the PostgreSQL pool config from DATABASE_URL.
 * Always returns a valid config so Next.js can build without DATABASE_URL.
 * When DATABASE_URL is missing, uses a dummy connection string that will
 * fail gracefully when the pool is actually used at runtime.
 */
function databasePoolConfig(): PoolConfig {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    return {
      connectionString: "postgres://invalid:invalid@localhost:1/invalid",
    };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      connectionString: "postgres://invalid:invalid@localhost:1/invalid",
    };
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    return {
      connectionString: "postgres://invalid:invalid@localhost:1/invalid",
    };
  }

  const sslMode = url.searchParams.get("sslmode") ?? process.env.PGSSLMODE;
  const forceSsl = process.env.DATABASE_SSL === "true";
  const useSsl =
    forceSsl ||
    sslMode === "require" ||
    sslMode === "no-verify" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full";
  url.searchParams.delete("sslmode");
  url.searchParams.delete("uselibpqcompat");

  return {
    connectionString: url.toString(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ...(useSsl
      ? {
          ssl: {
            rejectUnauthorized: sslMode === "verify-ca" || sslMode === "verify-full",
          },
        }
      : {}),
  };
}

const globalForDb = globalThis as typeof globalThis & {
  __lifeSpacePostgresqlPool?: Pool;
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(databasePoolConfig());
  }
  return pool;
}

export const db = drizzle(getPool());

export function getRawDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim();
}

export function validateDatabaseUrl(): { ok: true } | { ok: false; error: string } {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    return {
      ok: false,
      error:
        "DATABASE_URL is missing. Add DATABASE_URL to your environment, for example: postgresql://user:password@host:5432/database",
    };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      error:
        "DATABASE_URL is invalid. It must be a PostgreSQL connection URL, for example: postgresql://user:password@host:5432/database",
    };
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    return {
      ok: false,
      error: "DATABASE_URL must start with postgres:// or postgresql://",
    };
  }
  if (!url.hostname || !url.pathname || url.pathname === "/") {
    return {
      ok: false,
      error: "DATABASE_URL must include a PostgreSQL host and database name",
    };
  }

  return { ok: true };
}
