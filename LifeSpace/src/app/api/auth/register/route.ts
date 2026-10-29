import { mergeGuestData, parseGuestPayload, seedStarterSheet } from "@/db/sheet-data";
import {
  createSession,
  createUser,
  findUserByEmail,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      guest?: unknown;
    };
    const guest = parseGuestPayload(body.guest);

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email)) {
      return Response.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return Response.json(
        { ok: false, error: "Use at least 8 characters for your password." },
        { status: 400 },
      );
    }
    if (name.length > 80) {
      return Response.json({ ok: false, error: "That name is too long." }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return Response.json(
        {
          ok: false,
          error:
            existing.provider === "google" && !existing.passwordHash
              ? "This email is already linked to Google. Use Continue with Google."
              : "An account with this email already exists. Sign in instead.",
        },
        { status: 409 },
      );
    }

    const user = await createUser({ email, name, password, provider: "email" });
    // If the visitor built a sheet as a guest, it becomes their account's sheet.
    if (guest && guest.tasks.length > 0) {
      await mergeGuestData(user.id, guest);
    } else {
      await seedStarterSheet(user.id);
    }
    await createSession(user.id);

    return Response.json(
      { ok: true, user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/auth/register failed", error);
    return Response.json(
      { ok: false, error: "Could not create your account. Please try again." },
      { status: 500 },
    );
  }
}
