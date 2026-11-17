import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { database, databaseReady } from "@/lib/db";

const candidate = z.object({
  source: z.enum(["wikidata", "osm"]),
  externalId: z.string().min(2).max(40),
  kind: z.enum(["station", "line", "stock", "operator", "other"]),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(300).default(""),
  latitude: z.number().min(24).max(46).nullable().default(null),
  longitude: z.number().min(122).max(154).nullable().default(null),
  retrievedAt: z.iso.datetime(),
});
const payload = z.object({ items: z.array(candidate).min(1).max(10) });

async function userId() {
  const { data } = await getAuth().getSession();
  return data?.user?.id;
}

export async function GET() {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const owner = await userId();
  if (!owner) return Response.json({ error: "请先登录" }, { status: 401 });
  const rows = await database().query(
    "SELECT id, source, external_id, kind, name, description, latitude, longitude, source_url, status, retrieved_at, submitted_at FROM source_candidates WHERE owner_id=$1 ORDER BY submitted_at DESC LIMIT 100",
    [owner],
  );
  return Response.json({ data: rows });
}

export async function POST(request: Request) {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "请求来源无效" }, { status: 403 });
  const owner = await userId();
  if (!owner) return Response.json({ error: "请先登录" }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 20000) return Response.json({ error: "数据过大" }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 20000) return Response.json({ error: "数据过大" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "JSON 格式无效" }, { status: 400 });
  }
  const parsed = payload.safeParse(body);
  if (!parsed.success) return Response.json({ error: "采集数据格式无效" }, { status: 400 });
  const now = Date.now();
  for (const item of parsed.data.items) {
    if (item.source === "wikidata" && !/^Q\d+$/.test(item.externalId)) return Response.json({ error: "Wikidata ID 无效" }, { status: 400 });
    if (item.source === "osm" && !/^(node|way|relation)\/\d+$/.test(item.externalId)) return Response.json({ error: "OSM ID 无效" }, { status: 400 });
    if (Math.abs(now - Date.parse(item.retrievedAt)) > 86400000) return Response.json({ error: "采集时间无效" }, { status: 400 });
  }
  const sql = database();
  let inserted = 0;
  for (const item of parsed.data.items) {
    const sourceUrl = item.source === "wikidata"
      ? `https://www.wikidata.org/wiki/${item.externalId}`
      : `https://www.openstreetmap.org/${item.externalId}`;
    const result = await sql.query(
      "INSERT INTO source_candidates (owner_id, source, external_id, kind, name, description, latitude, longitude, source_url, retrieved_at) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10 WHERE (SELECT count(*) FROM source_candidates WHERE owner_id=$1) < 500 ON CONFLICT (owner_id, source, external_id) DO NOTHING RETURNING id",
      [owner, item.source, item.externalId, item.kind, item.name, item.description, item.latitude, item.longitude, sourceUrl, item.retrievedAt],
    );
    inserted += result.length;
  }
  return Response.json({ data: { inserted, duplicatesOrLimit: parsed.data.items.length - inserted, status: "pending" } }, { status: 201 });
}
