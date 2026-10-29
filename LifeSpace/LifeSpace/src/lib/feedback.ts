import { asc, desc, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { feedback, users } from "@/db/schema";
import { ensureAuthReady, type SessionUser } from "@/lib/auth";

export const FEEDBACK_CATEGORIES = ["idea", "add", "remove", "bug", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

let ready: Promise<void> | null = null;

export function ensureFeedbackReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await ensureAuthReady();
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "feedback" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
          "name" text DEFAULT '' NOT NULL,
          "email" text,
          "category" text DEFAULT 'idea' NOT NULL,
          "rating" integer,
          "message" text NOT NULL,
          "read_at" timestamp with time zone,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

/**
 * The website owner can read feedback. Owners are listed in ADMIN_EMAILS
 * (comma separated). Without that variable, the first account ever created is the owner.
 */
/** Private inbox access without accounts: ?key=<ADMIN_KEY>. */
export function hasAdminKey(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY?.trim();
  return Boolean(expected && key && key === expected);
}

export async function isOwner(user: SessionUser | null): Promise<boolean> {
  if (!user) return false;
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (configured.length > 0) return configured.includes(user.email.toLowerCase());

  await ensureAuthReady();
  const [first] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(1);
  return first?.id === user.id;
}

export async function countUnreadFeedback(): Promise<number> {
  await ensureFeedbackReady();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feedback)
    .where(isNull(feedback.readAt));
  return row?.count ?? 0;
}

export async function listFeedback() {
  await ensureFeedbackReady();
  return db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(500);
}
