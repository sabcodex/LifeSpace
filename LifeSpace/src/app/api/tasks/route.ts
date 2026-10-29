import { createTaskRecord, loadSheet } from "@/db/sheet-data";
import { getCurrentUser } from "@/lib/auth";
import { clampInt, todayParts } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ ok: false, error: "Unauthenticated." }, { status: 401 });

    const url = new URL(request.url);
    const today = todayParts();
    const year = clampInt(url.searchParams.get("year"), 2000, 2100, today.year);
    const month = clampInt(url.searchParams.get("month"), 1, 12, today.month);
    const data = await loadSheet(user.id, year, month);
    return Response.json({ ok: true, ...data });
  } catch (error) {
    console.error("GET /api/tasks failed", error);
    return Response.json({ ok: false, error: "Unable to load the sheet." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ ok: false, error: "Unauthenticated." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      goal?: unknown;
      year?: unknown;
      month?: unknown;
    };
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) {
      return Response.json({ ok: false, error: "Give the task a name." }, { status: 400 });
    }
    const today = todayParts();
    const goal = clampInt(body.goal, 0, 31, 20);
    const year = clampInt(body.year, 2000, 2100, today.year);
    const month = clampInt(body.month, 1, 12, today.month);
    const task = await createTaskRecord(user.id, year, month, name, goal);
    return Response.json({ ok: true, task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed", error);
    return Response.json({ ok: false, error: "Unable to save the task." }, { status: 500 });
  }
}
