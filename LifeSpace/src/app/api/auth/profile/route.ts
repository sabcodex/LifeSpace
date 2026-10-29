import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Sign in to update your account name." }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return Response.json({ ok: false, error: "Enter a valid name." }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return Response.json({ ok: false, error: "Enter a valid name." }, { status: 400 });
  }
  const name = body.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80) {
    return Response.json(
      { ok: false, error: "Your name must be between 1 and 80 characters." },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ name })
      .where(eq(users.id, user.id))
      .returning({ name: users.name });
    if (!updated) {
      return Response.json({ ok: false, error: "Account not found." }, { status: 404 });
    }
    return Response.json({ ok: true, name: updated.name });
  } catch (error) {
    console.error("PATCH /api/auth/profile failed", error);
    return Response.json({ ok: false, error: "Could not save your name." }, { status: 500 });
  }
}
