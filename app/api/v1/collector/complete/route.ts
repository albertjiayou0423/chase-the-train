import { z } from "zod";
import { database, databaseReady } from "@/lib/db";

const itemSchema = z.object({
  externalId: z.string().min(2).max(40),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(300).default(""),
  latitude: z.number().min(24).max(46).nullable().default(null),
  longitude: z.number().min(122).max(154).nullable().default(null),
});
const bodySchema = z.object({
  key: z.string().min(1).max(80),
  leaseToken: z.uuid(),
  status: z.enum(["success", "error"]),
  items: z.array(itemSchema).max(30).default([]),
  error: z.string().max(150).optional(),
});

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "请求来源无效" }, { status: 403 });
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 30000) return Response.json({ error: "数据过大" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "JSON 格式无效" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "采集数据格式无效" }, { status: 400 });
  const { key, leaseToken, status, items, error } = parsed.data;
  const sql = database();
  const jobs = await sql.query(
    "SELECT source, kind FROM collector_jobs WHERE key=$1 AND lease_token=$2 AND lease_until>now()",
    [key, leaseToken],
  );
  if (!jobs.length) return Response.json({ error: "采集任务已过期" }, { status: 409 });
  const source = jobs[0].source as "wikidata" | "osm";
  const kind = jobs[0].kind as string;
  if (status === "success") {
    for (const item of items) {
      if (source === "wikidata" && !/^Q\d+$/.test(item.externalId)) return Response.json({ error: "Wikidata ID 无效" }, { status: 400 });
      if (source === "osm" && !/^(node|way|relation)\/\d+$/.test(item.externalId)) return Response.json({ error: "OSM ID 无效" }, { status: 400 });
    }
    for (const item of items) {
      const sourceUrl = source === "wikidata"
        ? `https://www.wikidata.org/wiki/${item.externalId}`
        : `https://www.openstreetmap.org/${item.externalId}`;
      await sql.query(
        `INSERT INTO rail_entities (source, external_id, kind, name, detail, latitude, longitude, source_url, source_license, fetched_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
         ON CONFLICT (source, external_id) DO UPDATE
         SET kind=EXCLUDED.kind, name=EXCLUDED.name, detail=EXCLUDED.detail,
             latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
             source_url=EXCLUDED.source_url, source_license=EXCLUDED.source_license,
             fetched_at=now(), updated_at=now()`,
        [source, item.externalId, kind, item.name, item.description, item.latitude, item.longitude, sourceUrl, source === "wikidata" ? "CC0" : "ODbL"],
      );
    }
  }
  const nextDue = status === "success"
    ? (source === "osm" ? "7 days" : "1 day")
    : "15 minutes";
  await sql.query(
    `UPDATE collector_jobs
     SET next_due=now()+$3::interval, lease_token=NULL, lease_until=NULL,
         last_success=CASE WHEN $4='success' THEN now() ELSE last_success END,
         last_count=CASE WHEN $4='success' THEN $5 ELSE last_count END,
         last_error=CASE WHEN $4='error' THEN $6 ELSE NULL END,
         updated_at=now()
     WHERE key=$1 AND lease_token=$2`,
    [key, leaseToken, nextDue, status, items.length, error ?? "采集失败"],
  );
  return Response.json({ data: { persisted: status === "success" ? items.length : 0, status } }, { headers: { "Cache-Control": "no-store" } });
}
