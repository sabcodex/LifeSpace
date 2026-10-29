import { exportUserSheet, mergeGuestData, parseGuestPayload } from "@/db/sheet-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Download a full copy of the signed-in user's sheet (every month). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Sign in to download your account backup." }, { status: 401 });
  }
  try {
    const sheet = await exportUserSheet(user.id);
    return Response.json({ ok: true, sheet, name: user.name });
  } catch (error) {
    console.error("GET /api/backup failed", error);
    return Response.json({ ok: false, error: "Could not create your backup. Try again." }, { status: 500 });
  }
}

/**
 * Restore a backup into the signed-in account. Tasks are matched per month by
 * name, so restoring the same file twice never creates duplicates.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Sign in to restore into your account." }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { sheet?: unknown };
    const sheet = parseGuestPayload(body.sheet);
    if (!sheet) {
      return Response.json({ ok: false, error: "That file is not a LifeSpace backup." }, { status: 400 });
    }
    if (sheet.tasks.length > 20_000 || sheet.completions.length > 400_000) {
      return Response.json({ ok: false, error: "That backup file is too large." }, { status: 413 });
    }
    const result = await mergeGuestData(user.id, sheet);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/backup failed", error);
    return Response.json({ ok: false, error: "Could not restore your backup. Try again." }, { status: 500 });
  }
}
