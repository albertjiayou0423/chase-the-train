"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Brand } from "@/components/brand";
import { runCollectorOnce } from "@/lib/collector/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Job = { key: string; source: string; last_success: string | null; last_count: number; last_error: string | null; next_due: string };
type Status = { jobs: Job[]; counts: Array<{ source: string; count: number }> };

export function CollectWorkspace() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch("/api/v1/collector/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`状态加载失败：HTTP ${response.status}`);
    const body = await response.json() as { data: Status };
    setStatus(body.data);
    setLoadError("");
  }

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const response = await fetch("/api/v1/collector/status", { cache: "no-store" });
        if (!response.ok) throw new Error(`状态加载失败：HTTP ${response.status}`);
        const body = await response.json() as { data: Status };
        if (active) { setStatus(body.data); setLoadError(""); }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "状态加载失败");
      }
    }
    void poll();
    const interval = window.setInterval(() => void poll(), 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  async function runNow() {
    setBusy(true);
    setMessage("");
    try {
      const result = await runCollectorOnce();
      setMessage(result.state === "idle" ? "当前没有到期任务" : result.state === "saved" ? `${result.key}：已自动保存 ${result.count} 条资料` : `${result.key}：${result.error}`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "采集失败");
    } finally {
      setBusy(false);
    }
  }

  const total = (status?.counts ?? []).reduce((sum, row) => sum + row.count, 0);
  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 text-foreground">
    <div className="flex items-center gap-3"><Button variant="outline" size="icon" render={<Link href="/" aria-label="返回工作台" />}><ArrowLeft /></Button><Brand /></div>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold">数据采集</h1><p className="text-sm text-muted-foreground">页面打开时，浏览器在后台领取到期任务，直接查询来源并发送给服务器入库。</p></div><Button onClick={() => void runNow()} disabled={busy}><RefreshCw />{busy ? "采集中…" : "立即运行一项"}</Button></div>
    {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
    {loadError && <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>}
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader><CardTitle>已入库资料</CardTitle><CardDescription>按来源 ID 自动去重</CardDescription></CardHeader><CardContent className="text-3xl font-semibold">{total}</CardContent></Card><Card><CardHeader><CardTitle>Wikidata</CardTitle><CardDescription>运营商、线路和车站</CardDescription></CardHeader><CardContent className="text-3xl font-semibold">{status?.counts.find((row) => row.source === "wikidata")?.count ?? 0}</CardContent></Card><Card><CardHeader><CardTitle>OpenStreetMap</CardTitle><CardDescription>局部车站位置</CardDescription></CardHeader><CardContent className="text-3xl font-semibold">{status?.counts.find((row) => row.source === "osm")?.count ?? 0}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>采集任务</CardTitle><CardDescription>无需登录或逐条确认。公共 Overpass 服务繁忙时任务会延后重试；页面关闭后浏览器采集暂停。</CardDescription></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>任务</TableHead><TableHead>来源</TableHead><TableHead>上次成功</TableHead><TableHead>条数</TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{(status?.jobs ?? []).map((job) => <TableRow key={job.key}><TableCell className="font-medium">{job.key}</TableCell><TableCell>{job.source}</TableCell><TableCell className="text-muted-foreground">{job.last_success ? new Date(job.last_success).toLocaleString("zh-CN") : "尚未运行"}</TableCell><TableCell>{job.last_count}</TableCell><TableCell>{job.last_error ? <Badge variant="destructive" title={job.last_error}>重试中</Badge> : <Badge variant="secondary">正常</Badge>}</TableCell></TableRow>)}</TableBody></Table>{!status && <p className="py-5 text-sm text-muted-foreground">正在加载采集状态…</p>}</CardContent></Card>
    <p className="text-xs text-muted-foreground">资料来自 <a className="underline" href="https://www.wikidata.org/" target="_blank" rel="noreferrer">Wikidata（CC0）</a> 和 <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors（ODbL）</a>。资料更新取决于浏览器页面是否有人打开。</p>
  </main>;
}
