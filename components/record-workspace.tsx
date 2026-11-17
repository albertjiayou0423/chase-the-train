"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Entry = { id: string; kind: "ride" | "sighting"; occurred_on: string; train_label: string; origin: string; destination: string; station: string; stock: string; notes: string; visibility: "private" | "public"; moderation: string };
const blank = (kind: Entry["kind"]): Omit<Entry, "id" | "moderation"> => ({ kind, occurred_on: new Date().toISOString().slice(0, 10), train_label: "", origin: "", destination: "", station: "", stock: "", notes: "", visibility: "private" });

export function RecordWorkspace({ kind }: { kind: Entry["kind"] }) {
  const { data: session, isPending } = authClient.useSession();
  const [items, setItems] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Omit<Entry, "moderation">>(blank(kind) as Omit<Entry, "moderation">);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const title = kind === "ride" ? "乘车记录" : "拍车记录";
  const load = useCallback(async () => {
    const response = await fetch(`/api/v1/records?kind=${kind}`, { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setItems(result.items);
    else setError(result.error ?? "加载失败");
    setLoaded(true);
  }, [kind]);
  useEffect(() => {
    if (!session?.user) return;
    const controller = new AbortController();
    fetch(`/api/v1/records?kind=${kind}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok) setItems(result.items);
        else setError(result.error ?? "加载失败");
        setLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("加载失败");
          setLoaded(true);
        }
      });
    return () => controller.abort();
  }, [session?.user, kind]);
  if (isPending) return <p className="text-sm text-muted-foreground">正在检查登录状态…</p>;
  if (!session?.user) return <Card><CardHeader><CardTitle>登录后使用{title}</CardTitle><CardDescription>记录默认仅自己可见。</CardDescription></CardHeader><CardContent><Button render={<a href="/auth/sign-in" />}>登录</Button></CardContent></Card>;

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/v1/records", { method: draft.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setError(result.error ?? "保存失败"); return; }
    setDraft(blank(kind) as Omit<Entry, "moderation">); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("删除这条记录？")) return;
    const response = await fetch(`/api/v1/records?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { setError("删除失败"); return; }
    await load();
  }

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
    <Card><CardHeader><CardTitle>{draft.id ? `编辑${title}` : `新增${title}`}</CardTitle><CardDescription>公开记录须通过审核才会出现在社区。</CardDescription></CardHeader><CardContent><form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="日期"><Input type="date" value={draft.occurred_on} onChange={(e) => update("occurred_on", e.target.value)} required /></Field><Field label="车次"><Input value={draft.train_label} onChange={(e) => update("train_label", e.target.value)} maxLength={60} placeholder="例如 G1" /></Field>{kind === "ride" ? <><Field label="出发站"><Input value={draft.origin} onChange={(e) => update("origin", e.target.value)} maxLength={100} /></Field><Field label="到达站"><Input value={draft.destination} onChange={(e) => update("destination", e.target.value)} maxLength={100} /></Field></> : <Field label="拍摄车站"><Input value={draft.station} onChange={(e) => update("station", e.target.value)} maxLength={100} /></Field>}<Field label="车型"><Input value={draft.stock} onChange={(e) => update("stock", e.target.value)} maxLength={100} /></Field></div><Field label="备注"><Textarea value={draft.notes} onChange={(e) => update("notes", e.target.value)} maxLength={2000} /></Field><Field label="可见范围"><Select value={draft.visibility} onValueChange={(value) => update("visibility", value as Entry["visibility"])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="private">仅自己可见</SelectItem><SelectItem value="public">公开（审核后）</SelectItem></SelectContent></Select></Field>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<div className="flex gap-2"><Button disabled={busy}>{busy ? "保存中…" : "保存记录"}</Button>{draft.id && <Button type="button" variant="outline" onClick={() => setDraft(blank(kind) as Omit<Entry, "moderation">)}>取消编辑</Button>}</div></form></CardContent></Card>
    <Card><CardHeader><CardTitle>我的{title} ({items.length})</CardTitle><CardDescription>按日期倒序显示，最多 100 条。</CardDescription></CardHeader><CardContent className="space-y-3">{!loaded ? <p className="text-sm text-muted-foreground">加载中…</p> : items.length === 0 ? <Empty><EmptyHeader><EmptyTitle>暂无记录</EmptyTitle><EmptyDescription>填写左侧表单即可添加。</EmptyDescription></EmptyHeader></Empty> : items.map((item) => <Card key={item.id} size="sm"><CardHeader><CardTitle>{item.train_label || (kind === "ride" ? `${item.origin} → ${item.destination}` : item.station) || "未命名记录"}</CardTitle><CardDescription>{String(item.occurred_on).slice(0,10)} · {kind === "ride" ? `${item.origin} → ${item.destination}` : item.station}</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.visibility === "private" ? "私密" : item.moderation === "approved" ? "已公开" : "待审核"}</Badge>{item.stock && <Badge variant="secondary">{item.stock}</Badge>}<div className="ml-auto flex gap-1"><Button variant="ghost" size="sm" onClick={() => setDraft({ ...item, occurred_on: String(item.occurred_on).slice(0,10) })}>编辑</Button><Button variant="destructive" size="sm" onClick={() => void remove(item.id)}>删除</Button></div></CardContent></Card>)}</CardContent></Card>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
