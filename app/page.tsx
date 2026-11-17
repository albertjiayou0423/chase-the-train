"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Camera, ExternalLink, Search, TrainTrack } from "lucide-react";
import { Brand } from "@/components/brand";
import { AuthStatus } from "@/components/auth-status";
import { RecordWorkspace } from "@/components/record-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Kind = "all" | "station" | "line" | "stock" | "operator";
type Entry = {
  id: string;
  kind: Exclude<Kind, "all">;
  name: string;
  detail: string;
  source: "wikidata" | "osm";
  external_id: string;
  source_url: string;
  source_license: string;
  fetched_at: string;
};
const kindLabels: Record<Kind, string> = { all: "全部", station: "车站", line: "线路", stock: "车型", operator: "运营商" };

export default function Home() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams({ q: query.trim(), kind, limit: "50" });
        const response = await fetch(`/api/v1/catalog?${params}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!active) return;
        if (!response.ok) throw new Error(body.error ?? "资料加载失败");
        setItems(body.data);
        setError("");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "资料加载失败");
      } finally {
        if (active) setLoading(false);
      }
    }
    const delay = window.setTimeout(() => void load(), 250);
    const refresh = window.setInterval(() => void load(), 60_000);
    return () => { active = false; controller.abort(); window.clearTimeout(delay); window.clearInterval(refresh); };
  }, [query, kind]);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b"><div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6"><Brand /><div className="flex items-center gap-2"><Button variant="outline" size="sm" render={<Link href="/collect" />}>数据采集</Button><AuthStatus /></div></div></header>
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-6">
      <div><h1 className="text-2xl font-semibold">日本铁路工作台</h1><p className="text-sm text-muted-foreground">查找铁路资料，整理乘车与拍车记录。</p></div>
      <Tabs defaultValue="library" className="gap-5">
        <TabsList className="max-w-full overflow-x-auto"><TabsTrigger value="library"><Search />资料库</TabsTrigger><TabsTrigger value="rides"><TrainTrack />乘车记录</TabsTrigger><TabsTrigger value="sightings"><Camera />拍车记录</TabsTrigger><TabsTrigger value="favorites"><Bookmark />收藏</TabsTrigger></TabsList>
        <TabsContent value="library" className="space-y-4">
          <Card><CardHeader><CardTitle>资料查询</CardTitle><CardDescription>浏览已自动采集的日本车站、线路、车型和运营商资料。</CardDescription></CardHeader><CardContent className="space-y-4"><InputGroup className="h-10"><InputGroupAddon><Search className="text-primary" /></InputGroupAddon><InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索东京、大阪、山手线…" aria-label="搜索资料" /></InputGroup><Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}><TabsList>{(Object.keys(kindLabels) as Kind[]).map((value) => <TabsTrigger key={value} value={value}>{kindLabels[value]}</TabsTrigger>)}</TabsList></Tabs></CardContent></Card>
          <Card><CardHeader><CardTitle>查询结果 ({items.length})</CardTitle><CardDescription>按来源标识去重；资料会随打开页面的浏览器采集而更新。</CardDescription></CardHeader><CardContent>{error ? <p className="text-sm text-destructive">{error}</p> : loading ? <p className="text-sm text-muted-foreground">正在加载资料…</p> : items.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>类型</TableHead><TableHead>名称</TableHead><TableHead>说明</TableHead><TableHead>来源</TableHead><TableHead>抓取时间</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell><Badge variant="secondary">{kindLabels[item.kind]}</Badge></TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-muted-foreground">{item.detail || "暂无说明"}</TableCell><TableCell><a className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline" href={item.source_url} target="_blank" rel="noreferrer">{item.source === "wikidata" ? "Wikidata" : "OpenStreetMap"}<ExternalLink className="size-3" /></a><div className="text-xs text-muted-foreground">{item.source_license}</div></TableCell><TableCell className="text-xs text-muted-foreground">{new Date(item.fetched_at).toLocaleString("zh-CN")}</TableCell></TableRow>)}</TableBody></Table></div> : <Empty><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>暂无匹配资料</EmptyTitle><EmptyDescription>浏览器后台采集开始后会自动入库；也可打开数据采集页查看任务状态。</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="rides"><RecordWorkspace kind="ride" /></TabsContent>
        <TabsContent value="sightings"><RecordWorkspace kind="sighting" /></TabsContent>
        <TabsContent value="favorites"><Card><CardContent><Empty><EmptyHeader><EmptyTitle>暂无收藏</EmptyTitle><EmptyDescription>收藏功能尚在开发中。</EmptyDescription></EmptyHeader></Empty></CardContent></Card></TabsContent>
      </Tabs>
    </main>
  </div>;
}
