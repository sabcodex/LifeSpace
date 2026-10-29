import { applyCompletionEntries, loadSheet, type CompletionEntry } from "@/db/sheet-data";
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
    console.error("GET /api/completions failed", error);
    return Response.json({ ok: false, error: "Unable to load checkboxes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ ok: false, error: "Unauthenticated." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as { entries?: unknown };
    if (!Array.isArray(body.entries)) {
      return Response.json({ ok: false, error: "Missing checkbox entries." }, { status: 400 });
    }

    const entries: CompletionEntry[] = body.entries.slice(0, 1000).map((raw) => {
      const candidate = (raw ?? {}) as { taskId?: unknown; date?: unknown; completed?: unknown };
      return {
        taskId: Number.parseInt(String(candidate.taskId ?? ""), 10),
        date: String(candidate.date ?? ""),
        completed: Boolean(candidate.completed),
      };
    });

    const saved = await applyCompletionEntries(user.id, entries);
    return Response.json({ ok: true, saved });
  } catch (error) {
    console.error("POST /api/completions failed", error);
    return Response.json({ ok: false, error: "Unable to save the checkbox." }, { status: 500 });
  }
}
