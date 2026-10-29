import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return Response.json({ ok: false, error: "Could not sign out." }, { status: 500 });
  }
}
