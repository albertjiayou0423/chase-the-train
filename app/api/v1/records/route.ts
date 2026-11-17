import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { database, databaseReady } from "@/lib/db";

const recordSchema = z.object({
  kind: z.enum(["ride", "sighting"]),
  occurred_on: z.iso.date(),
  train_label: z.string().max(60).default(""),
  origin: z.string().max(100).default(""),
  destination: z.string().max(100).default(""),
  station: z.string().max(100).default(""),
  stock: z.string().max(100).default(""),
  notes: z.string().max(2000).default(""),
  visibility: z.enum(["private", "public"]).default("private"),
});

async function owner() {
  const { data } = await getAuth().getSession();
  return data?.user?.id;
}

export async function GET(request: Request) {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const userId = await owner();
  if (!userId) return Response.json({ error: "请先登录" }, { status: 401 });
  const kind = new URL(request.url).searchParams.get("kind") ?? "all";
  if (!["all", "ride", "sighting"].includes(kind)) return Response.json({ error: "无效类型" }, { status: 400 });
  const rows = await database().query("SELECT id, kind, occurred_on, train_label, origin, destination, station, stock, notes, image_url, visibility, moderation, created_at FROM records WHERE owner_id = $1 AND ($2 = 'all' OR kind = $2) ORDER BY occurred_on DESC, created_at DESC LIMIT 100", [userId, kind]);
  return Response.json({ items: rows });
}

export async function POST(request: Request) {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const userId = await owner();
  if (!userId) return Response.json({ error: "请先登录" }, { status: 401 });
  const parsed = recordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "请检查记录内容", issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  const rows = await database().query("INSERT INTO records (owner_id, kind, occurred_on, train_label, origin, destination, station, stock, notes, visibility) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id", [userId,d.kind,d.occurred_on,d.train_label,d.origin,d.destination,d.station,d.stock,d.notes,d.visibility]);
  return Response.json({ id: rows[0].id }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const userId = await owner();
  if (!userId) return Response.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success || !z.uuid().safeParse(body?.id).success) return Response.json({ error: "无效记录" }, { status: 400 });
  const d = parsed.data;
  const rows = await database().query("UPDATE records SET kind=$3, occurred_on=$4, train_label=$5, origin=$6, destination=$7, station=$8, stock=$9, notes=$10, visibility=$11, moderation='pending', updated_at=now() WHERE id=$1 AND owner_id=$2 RETURNING id", [body.id,userId,d.kind,d.occurred_on,d.train_label,d.origin,d.destination,d.station,d.stock,d.notes,d.visibility]);
  return rows.length ? Response.json({ id: rows[0].id }) : Response.json({ error: "记录不存在" }, { status: 404 });
}

export async function DELETE(request: Request) {
  if (!databaseReady()) return Response.json({ error: "数据库尚未配置" }, { status: 503 });
  const userId = await owner();
  if (!userId) return Response.json({ error: "请先登录" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "无效记录" }, { status: 400 });
  const rows = await database().query("DELETE FROM records WHERE id=$1 AND owner_id=$2 RETURNING id", [id,userId]);
  return rows.length ? Response.json({ ok: true }) : Response.json({ error: "记录不存在" }, { status: 404 });
}
