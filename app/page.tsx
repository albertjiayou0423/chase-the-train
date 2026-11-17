"use client";

import { useMemo, useState } from "react";
import { Bookmark, Camera, Search, TrainFront, TrainTrack } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const entries = [
  { type: "车站", name: "北京站", detail: "北京市 · 东城区", code: "BJS" },
  { type: "车站", name: "上海虹桥站", detail: "上海市 · 闵行区", code: "SHA" },
  { type: "线路", name: "京沪高速铁路", detail: "北京南 — 上海虹桥", code: "1,318 km" },
  { type: "线路", name: "京广高速铁路", detail: "北京西 — 广州南", code: "2,298 km" },
  { type: "车型", name: "复兴号 CR400AF", detail: "高速动车组 · 中国", code: "CR400AF" },
  { type: "车型", name: "和谐号 CRH380A", detail: "高速动车组 · 中国", code: "CRH380A" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const visible = useMemo(() => entries.filter((item) =>
    (filter === "全部" || item.type === filter) &&
    `${item.name} ${item.detail} ${item.code}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [filter, query]);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b"><div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6"><div className="flex items-center gap-2 font-semibold"><TrainFront className="size-5 text-primary" /><span>Chase The Train</span></div><Badge>界面预览 · 示例数据</Badge></div></header>
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <div className="space-y-1"><h1 className="text-2xl font-semibold tracking-tight">铁路工作台</h1><p className="text-sm text-muted-foreground">查询资料，整理乘车与拍车记录。</p></div>
      <Tabs defaultValue="library" className="gap-5"><TabsList className="max-w-full overflow-x-auto"><TabsTrigger value="library" className="data-active:text-primary"><Search />资料库</TabsTrigger><TabsTrigger value="rides" className="data-active:text-primary"><TrainTrack />乘车记录</TabsTrigger><TabsTrigger value="sightings" className="data-active:text-primary"><Camera />拍车记录</TabsTrigger><TabsTrigger value="favorites" className="data-active:text-primary"><Bookmark />收藏</TabsTrigger></TabsList>
        <TabsContent value="library" className="space-y-4">
          <Card><CardHeader><CardTitle>资料查询</CardTitle><CardDescription>按名称、地点或编号搜索。当前仅有 6 条示例资料。</CardDescription><CardAction><Badge variant="outline">非实时</Badge></CardAction></CardHeader><CardContent className="space-y-4"><InputGroup className="h-10"><InputGroupAddon><Search className="text-primary" /></InputGroupAddon><InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索车站、线路、车型…" aria-label="搜索资料" /></InputGroup><Tabs value={filter} onValueChange={(value) => setFilter(String(value))}><TabsList>{["全部", "车站", "线路", "车型"].map((item) => <TabsTrigger key={item} value={item} className="data-active:text-primary">{item}</TabsTrigger>)}</TabsList></Tabs></CardContent></Card>
          <Card><CardHeader><CardTitle>查询结果 <span className="text-muted-foreground">({visible.length})</span></CardTitle><CardDescription>示例内容用于验证界面布局与搜索交互。</CardDescription></CardHeader><CardContent>{visible.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>类型</TableHead><TableHead>名称</TableHead><TableHead>地点 / 区间 / 属性</TableHead><TableHead>标识</TableHead></TableRow></TableHeader><TableBody>{visible.map((item) => <TableRow key={item.name}><TableCell><Badge variant="secondary">{item.type}</Badge></TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-muted-foreground">{item.detail}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{item.code}</TableCell></TableRow>)}</TableBody></Table></div> : <Empty><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>没有匹配的资料</EmptyTitle><EmptyDescription>更换关键词或资料类型后重试。</EmptyDescription></EmptyHeader></Empty>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="rides"><WorkspaceEmpty icon={<TrainTrack />} title="暂无乘车记录" description="登录与记录功能尚未接入。后续可在这里保存日期、车次和起终点。" /></TabsContent>
        <TabsContent value="sightings"><WorkspaceEmpty icon={<Camera />} title="暂无拍车记录" description="照片上传和拍车记录功能尚未接入。" /></TabsContent>
        <TabsContent value="favorites"><WorkspaceEmpty icon={<Bookmark />} title="暂无收藏" description="收藏功能尚未接入。后续可保存车站、线路和车型。" /></TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">数据状态：当前为本地示例资料；尚未接入铁路数据源、账户或实时列车信息。</p>
    </main>
  </div>;
}

function WorkspaceEmpty({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <Card><CardContent><Empty><EmptyHeader><EmptyMedia variant="icon">{icon}</EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader></Empty></CardContent></Card>;
}
