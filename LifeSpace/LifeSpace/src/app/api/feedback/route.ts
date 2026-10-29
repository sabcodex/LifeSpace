import { inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { getCurrentUser, isValidEmail } from "@/lib/auth";
import { hasAdminKey } from "@/lib/feedback";
import {
  ensureFeedbackReady,
  FEEDBACK_CATEGORIES,
  isOwner,
  listFeedback,
  type FeedbackCategory,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits);
    return true;
  }
  hits.push(now);
  recent.set(key, hits);
  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const category = FEEDBACK_CATEGORIES.includes(body.category as FeedbackCategory)
      ? (body.category as FeedbackCategory)
      : "idea";
    const rating =
      Number.isInteger(body.rating) && (body.rating as number) >= 1 && (body.rating as number) <= 5
        ? (body.rating as number)
        : null;

    if (message.length < 3) {
      return Response.json({ ok: false, error: "Write a few words before sending." }, { status: 400 });
    }
    if (message.length > 2000) {
      return Response.json({ ok: false, error: "Keep your message under 2000 characters." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const name = user
      ? user.name
      : typeof body.name === "string"
        ? body.name.trim().slice(0, 80)
        : "";
    const rawEmail = user ? user.email : typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (rawEmail && !isValidEmail(rawEmail)) {
      return Response.json({ ok: false, error: "Enter a valid email, or leave it empty." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(user ? `user:${user.id}` : `ip:${ip}`)) {
      return Response.json(
        { ok: false, error: "Thanks! You've sent a lot of feedback — please try again in a few minutes." },
        { status: 429 },
      );
    }

    await ensureFeedbackReady();
    await db.insert(feedback).values({
      userId: user?.id ?? null,
      name,
      email: rawEmail || null,
      category,
      rating,
      message,
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback failed", error);
    return Response.json({ ok: false, error: "Could not send your feedback. Try again." }, { status: 500 });
  }
}

function keyFrom(request: Request): string | null {
  return new URL(request.url).searchParams.get("key");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!hasAdminKey(keyFrom(request)) && !(await isOwner(user))) {
    return Response.json({ ok: false, error: "Only the website owner can read feedback." }, { status: 403 });
  }
  const items = await listFeedback();
  return Response.json({ ok: true, items });
}

/** Marks messages as read: { ids: number[] } or { all: true }. */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!hasAdminKey(keyFrom(request)) && !(await isOwner(user))) {
    return Response.json({ ok: false, error: "Only the website owner can update feedback." }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown; all?: unknown };
  await ensureFeedbackReady();
  if (body.all === true) {
    await db.update(feedback).set({ readAt: new Date() }).where(isNull(feedback.readAt));
  } else if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((id): id is number => Number.isInteger(id)).slice(0, 500);
    if (ids.length > 0) await db.update(feedback).set({ readAt: new Date() }).where(inArray(feedback.id, ids));
  }
  return Response.json({ ok: true });
}
