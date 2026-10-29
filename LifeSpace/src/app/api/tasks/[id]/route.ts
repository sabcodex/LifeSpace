import { deleteTaskRecord, updateTaskRecord } from "@/db/sheet-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthenticated." }, { status: 401 });

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return Response.json({ ok: false, error: "Invalid task id." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      goal?: unknown;
      position?: unknown;
    };

    const patch: { name?: string; goal?: number; position?: number } = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (body.goal !== undefined && body.goal !== null) {
      const goal = Number.parseInt(String(body.goal), 10);
      if (!Number.isFinite(goal)) {
        return Response.json({ ok: false, error: "Goal must be a number." }, { status: 400 });
      }
      patch.goal = goal;
    }
    if (body.position !== undefined && body.position !== null) {
      const position = Number.parseInt(String(body.position), 10);
      if (Number.isFinite(position)) patch.position = position;
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: false, error: "Nothing to update." }, { status: 400 });
    }

    const task = await updateTaskRecord(user.id, id, patch);
    if (!task) {
      return Response.json({ ok: false, error: "Task not found." }, { status: 404 });
    }
    return Response.json({ ok: true, task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the task.";
    console.error("PATCH /api/tasks/[id] failed", error);
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthenticated." }, { status: 401 });

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return Response.json({ ok: false, error: "Invalid task id." }, { status: 400 });
  }

  try {
    await deleteTaskRecord(user.id, id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] failed", error);
    return Response.json({ ok: false, error: "Unable to delete the task." }, { status: 500 });
  }
}
