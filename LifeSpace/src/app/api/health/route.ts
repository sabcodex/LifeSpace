import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "connected" });
  } catch (error) {
    // Keep credentials and connection details out of the response, but retain
    // the original error in server logs for diagnosis.
    console.error("Database health check failed", error);
    return Response.json({ ok: false, database: "unavailable" }, { status: 500 });
  }
}
