import { database, databaseReady } from "@/lib/db";

function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const rows = await database().query(
    `UPDATE collector_jobs
     SET lease_token=gen_random_uuid(), lease_until=now()+interval '2 minutes', updated_at=now()
     WHERE key=(
       SELECT key FROM collector_jobs
       WHERE next_due<=now() AND (lease_until IS NULL OR lease_until<now())
       ORDER BY next_due, key FOR UPDATE SKIP LOCKED LIMIT 1
     )
     RETURNING key, source, query, kind, bbox, lease_token`,
  );
  return Response.json({ data: rows[0] ?? null }, { headers: { "Cache-Control": "no-store" } });
}
