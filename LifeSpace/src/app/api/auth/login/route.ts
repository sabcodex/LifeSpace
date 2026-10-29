import { mergeGuestData, parseGuestPayload, seedStarterSheet } from "@/db/sheet-data";
import { createSession, findUserByEmail, normalizeEmail, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown;
      password?: unknown;
      guest?: unknown;
    };
    const guest = parseGuestPayload(body.guest);
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return Response.json(
        { ok: false, error: "Enter your email and password." },
        { status: 400 },
      );
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json(
        { ok: false, error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    if (guest && guest.tasks.length > 0) {
      await mergeGuestData(user.id, guest);
    } else {
      await seedStarterSheet(user.id);
    }
    await createSession(user.id);

    return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return Response.json(
      { ok: false, error: "Could not sign you in. Please try again." },
      { status: 500 },
    );
  }
}
