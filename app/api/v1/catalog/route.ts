import { database, databaseReady } from "@/lib/db";

export async function GET(request: Request) {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const kind = url.searchParams.get("kind") ?? "all";
  if (!["all", "station", "line", "stock", "operator"].includes(kind)) return Response.json({ error: "无效类型" }, { status: 400 });
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 50);
  const sql = database();
  const rows = await sql.query(
    "SELECT id, kind, name, detail, source, external_id, source_url, source_license, latitude, longitude, fetched_at, updated_at FROM rail_entities WHERE ($1 = 'all' OR kind = $1) AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR detail ILIKE '%' || $2 || '%') ORDER BY updated_at DESC, name LIMIT $3",
    [kind, q, limit]
  );
  return Response.json({ data: rows, meta: { asOf: new Date().toISOString(), sourceStatus: "persisted" } });
}
