import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Drizzle. Add it to .env (for example: postgresql://user:password@host:5432/database).",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    // One source of truth: Drizzle and the running app both use DATABASE_URL.
    url: databaseUrl,
  },
});
