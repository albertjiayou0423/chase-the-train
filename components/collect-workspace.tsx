"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, ExternalLink, Search } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Source = "wikidata" | "osm";
type Kind = "station" | "line" | "stock" | "operator" | "other";
type Candidate = {
  source: Source;
  externalId: string;
  kind: Kind;
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  retrievedAt: string;
};

const sourceUrl = (item: Candidate) => item.source === "wikidata"
  ? `https://www.wikidata.org/wiki/${item.externalId}`
  : `https://www.openstreetmap.org/${item.externalId}`;

export function CollectWorkspace() {
  const { data: session } = authClient.useSession();
  const [source, setSource] = useState<Source>("wikidata");
  const [query, setQuery] = useState("東京駅");
  const [language, setLanguage] = useState("ja");
  const [kind, setKind] = useState<Kind>("station");
  const [bbox, setBbox] = useState("35.67,139.75,35.69,139.78");
  const [items, setItems] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  async function collectWikidata() {
    const term = query.trim();
    if (term.length < 2 || term.length > 50) throw new Error("关键词需要 2–50 个字");
    const url = new URL("https://www.wikidata.org/w/api.php");
    Object.entries({ action: "wbsearchentities", format: "json", search: term, language, limit: "15", origin: "*" })
      .forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Wikidata HTTP ${response.status}`);
    const data = await response.json() as { search?: Array<{ id: string; label?: string; description?: string }> };
    const retrievedAt = new Date().toISOString();
    return (data.search ?? []).filter((hit) => /^Q\d+$/.test(hit.id)).map((hit) => ({
      source: "wikidata" as const,
      externalId: hit.id,
      kind,
      name: (hit.label ?? hit.id).slice(0, 120),
      description: (hit.description ?? "").slice(0, 300),
      latitude: null,
      longitude: null,
      retrievedAt,
    }));
  }

  async function collectOverpass() {
    const values = bbox.split(",").map((value) => Number(value.trim()));
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) throw new Error("请输入 south,west,north,east");
    const [south, west, north, east] = values;
    if (south < 24 || north > 46 || west < 122 || east > 154 || south >= north || west >= east || north - south > 0.15 || east - west > 0.15)
      throw new Error("范围须在日本境内，宽高不超过 0.15°");
    const ql = `[out:json][timeout:15];nwr["railway"="station"](${south},${west},${north},${east});out center 30;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(ql)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(18000) });
    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}；公共节点可能繁忙，请稍后重试`);
    const data = await response.json() as { elements?: Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };
    const retrievedAt = new Date().toISOString();
    return (data.elements ?? []).flatMap((element) => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      if (!["node", "way", "relation"].includes(element.type) || !Number.isSafeInteger(element.id) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      return [{
        source: "osm" as const,
        externalId: `${element.type}/${element.id}`,
        kind: "station" as const,
        name: (element.tags?.["name:ja"] ?? element.tags?.name ?? "名称未标注").slice(0, 120),
        description: (element.tags?.operator ?? "").slice(0, 300),
        latitude: latitude as number,
        longitude: longitude as number,
        retrievedAt,
      }];
    });
  }

  async function collect() {
    setBusy(true);
    setItems([]);
    setSaved([]);
    setMessage("");
    try {
      const result = source === "wikidata" ? await collectWikidata() : await collectOverpass();
      setItems(result);
      if (!result.length) setMessage("没有找到候选资料");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "采集失败");
    } finally {
      setBusy(false);
    }
  }

  async function save(item: Candidate) {
    setSaving(item.externalId);
    setMessage("");
    try {
      const response = await fetch("/api/v1/me/source-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [item] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "保存失败");
      setSaved((current) => [...current, item.externalId]);
      setMessage(result.data.inserted ? "已保存为待核验候选" : "这条候选已保存过，或已达到数量上限");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving("");
    }
  }

  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 text-foreground">
    <div className="flex items-center gap-3"><Button variant="outline" size="icon" render={<Link href="/" aria-label="返回工作台" />}><ArrowLeft /></Button><div><h1 className="text-2xl font-semibold">资料采集</h1><p className="text-sm text-muted-foreground">由当前浏览器主动查询公开来源；保存后进入待核验库。</p></div></div>
    <Tabs value={source} onValueChange={(value) => { setSource(value as Source); setItems([]); setMessage(""); }}>
      <TabsList><TabsTrigger value="wikidata">Wikidata</TabsTrigger><TabsTrigger value="osm">OpenStreetMap / Overpass</TabsTrigger></TabsList>
      <TabsContent value="wikidata"><Card><CardHeader><CardTitle>实体搜索</CardTitle><CardDescription>适合查找日本车站、线路、车型和运营商。搜索结果未经审校。</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="wd-query">关键词</Label><Input id="wd-query" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={50} /></div><div className="space-y-2"><Label>语言</Label><Select value={language} onValueChange={(v) => setLanguage(String(v))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ja">日文</SelectItem><SelectItem value="zh">中文</SelectItem><SelectItem value="en">英文</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>候选类型</Label><Select value={kind} onValueChange={(v) => setKind(v as Kind)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="station">车站</SelectItem><SelectItem value="line">线路</SelectItem><SelectItem value="stock">车型</SelectItem><SelectItem value="operator">运营商</SelectItem></SelectContent></Select></div><Button onClick={() => void collect()} disabled={busy}><Search />{busy ? "采集中…" : "查询"}</Button></CardContent></Card></TabsContent>
      <TabsContent value="osm"><Card><CardHeader><CardTitle>局部车站</CardTitle><CardDescription>按日本境内的小范围边界框查询。公共 Overpass 节点繁忙时可能失败。</CardDescription></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><div className="min-w-64 flex-1 space-y-2"><Label htmlFor="osm-bbox">边界框：南纬, 西经, 北纬, 东经</Label><Input id="osm-bbox" value={bbox} onChange={(e) => setBbox(e.target.value)} /></div><Button onClick={() => void collect()} disabled={busy}><Search />{busy ? "采集中…" : "查询"}</Button></CardContent></Card></TabsContent>
    </Tabs>
    {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
    <Card><CardHeader><CardTitle>候选结果 ({items.length})</CardTitle><CardDescription>保存需要登录。浏览器提交的信息将先进入待核验库，不会直接成为正式资料。</CardDescription></CardHeader><CardContent className="space-y-2">{items.map((item) => <div key={item.externalId} className="flex flex-wrap items-center gap-3 rounded-lg border p-3"><Badge variant="secondary">{item.kind}</Badge><div className="min-w-40 flex-1"><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.description || item.externalId}</div></div><Button variant="ghost" size="sm" render={<a href={sourceUrl(item)} target="_blank" rel="noreferrer" />}><ExternalLink />原文</Button><Button size="sm" onClick={() => void save(item)} disabled={!session?.user || saving === item.externalId || saved.includes(item.externalId)}><Database />{saved.includes(item.externalId) ? "已保存" : saving === item.externalId ? "保存中…" : "保存候选"}</Button></div>)}{!items.length && <p className="py-6 text-center text-sm text-muted-foreground">输入关键词或边界框后查询。</p>}{!session?.user && <p className="text-sm text-muted-foreground">登录后可以保存候选资料。</p>}{source === "osm" && <p className="text-xs text-muted-foreground"><a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a></p>}</CardContent></Card>
  </main>;
}
