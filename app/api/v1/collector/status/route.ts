import { database, databaseReady } from "@/lib/db";

export async function GET() {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const [jobs, count] = await Promise.all([
    database().query("SELECT key, source, last_success, last_count, last_error, next_due FROM collector_jobs ORDER BY key"),
    database().query("SELECT source, count(*)::integer AS count FROM rail_entities GROUP BY source"),
  ]);
  return Response.json({ data: { jobs, counts: count } }, { headers: { "Cache-Control": "no-store" } });
}
