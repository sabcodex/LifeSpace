import { mergeGuestData, parseGuestPayload } from "@/db/sheet-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Used after a Google sign-in: the browser holds the guest sheet in
 * localStorage, so it posts it here once the session exists.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ ok: false, error: "Unauthenticated." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { guest?: unknown };
    const guest = parseGuestPayload(body.guest);
    if (!guest || guest.tasks.length === 0) {
      return Response.json({ ok: true, migrated: false });
    }

    const result = await mergeGuestData(user.id, guest);
    return Response.json({ ok: true, migrated: true, ...result });
  } catch (error) {
    console.error("POST /api/auth/migrate-guest failed", error);
    return Response.json({ ok: false, error: "Unable to move your progress." }, { status: 500 });
  }
}
