"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Bookmark, Camera, Compass, MapPinned, Menu, Search, TrainFront, TrainTrack, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const records = [
  { type: "车站", name: "北京站", detail: "北京市 · 东城区", code: "BJS", tone: "orange" },
  { type: "车站", name: "上海虹桥站", detail: "上海市 · 闵行区", code: "SHA", tone: "blue" },
  { type: "线路", name: "京沪高速铁路", detail: "北京南 — 上海虹桥", code: "1,318 km", tone: "green" },
  { type: "线路", name: "京广高速铁路", detail: "北京西 — 广州南", code: "2,298 km", tone: "purple" },
  { type: "车型", name: "复兴号 CR400AF", detail: "高速动车组 · 中国", code: "CR400AF", tone: "red" },
  { type: "车型", name: "和谐号 CRH380A", detail: "高速动车组 · 中国", code: "CRH380A", tone: "slate" },
];
const filters = ["全部", "车站", "线路", "车型"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const [menuOpen, setMenuOpen] = useState(false);
  const visible = useMemo(() => records.filter((item) =>
    (filter === "全部" || item.type === filter) &&
    `${item.name} ${item.detail} ${item.code}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [filter, query]);

  return <div className="min-h-screen bg-[#f7f8f7] text-[#15211d]">
    <header className="sticky top-0 z-30 border-b border-[#e8ece9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="flex items-center gap-3 font-semibold tracking-tight" aria-label="Chase The Train 首页"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e65d46] text-white"><TrainFront className="size-5" /></span><span className="text-[17px]">Chase The Train<span className="text-[#e65d46]">.</span></span></a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#5b6862] md:flex" aria-label="主导航"><a href="#explore" className="hover:text-[#e65d46]">探索</a><a href="#library" className="hover:text-[#e65d46]">铁路资料库</a><a href="#journal" className="hover:text-[#e65d46]">我的记录</a><a href="#community" className="hover:text-[#e65d46]">社区</a></nav>
        <Badge variant="secondary" className="hidden bg-[#f2f5f2] text-[#69766f] md:inline-flex">项目预览</Badge>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>{menuOpen ? <X /> : <Menu />}</Button>
      </div>
      {menuOpen && <nav className="flex flex-col border-t bg-white px-5 py-3 text-sm md:hidden" aria-label="移动导航">{[["探索", "explore"], ["铁路资料库", "library"], ["我的记录", "journal"], ["社区", "community"]].map(([label, id]) => <a key={id} href={`#${id}`} className="rounded-lg px-3 py-2 hover:bg-[#f7f8f7]" onClick={() => setMenuOpen(false)}>{label}</a>)}</nav>}
    </header>

    <main id="top">
      <section className="relative overflow-hidden bg-[#14372e] text-white"><div className="hero-lines" aria-hidden="true" /><div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-18 md:grid-cols-[1.1fr_.9fr] md:px-8 md:py-28">
        <div className="max-w-2xl"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs text-[#d9e8df]"><span className="size-1.5 rounded-full bg-[#f49b79]" />为每一次追车，留下一处坐标</div><h1 className="text-[clamp(2.8rem,6vw,5.7rem)] font-semibold leading-[1.08] tracking-[-0.055em]">热爱铁路的人，<br /><span className="text-[#f29676]">总在路上。</span></h1><p className="mt-7 max-w-xl text-base leading-8 text-[#c1d4ca] md:text-lg">探索车站、线路与列车。收藏沿途风景，记录每一次乘车与相遇。你的铁路世界，从这里开始。</p><div className="mt-9 flex flex-wrap gap-3"><a href="#explore"><Button size="lg" className="rounded-full bg-[#f1785b] px-6 text-white hover:bg-[#e66a4d]">开始探索 <ArrowRight className="ml-1 size-4" /></Button></a><a href="#journal"><Button size="lg" variant="outline" className="rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/15 hover:text-white">了解记录功能</Button></a></div><div className="mt-12 flex items-center gap-7 border-t border-white/15 pt-6 text-xs text-[#bdd0c4]"><span>车站与线路</span><span>乘车与拍车</span><span>发现同好</span></div></div>
        <div className="relative hidden items-center justify-center md:flex" aria-hidden="true"><div className="w-full max-w-[420px] rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md"><div className="mb-8 flex items-center justify-between"><span className="text-sm font-medium text-white/80">一段值得收藏的旅程</span><span className="rounded-full bg-[#f29676] px-3 py-1 text-xs font-semibold text-[#17372e]">旅途记录</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div><p className="text-3xl font-semibold">北京南</p><p className="mt-1 text-xs text-white/60">BEIJING SOUTH</p></div><div className="route-track"><TrainFront className="size-5 text-[#f29676]" /></div><div className="text-right"><p className="text-3xl font-semibold">上海虹桥</p><p className="mt-1 text-xs text-white/60">SHANGHAI HONGQIAO</p></div></div><div className="mt-9 flex justify-between border-t border-white/15 pt-5 text-sm"><span className="text-white/60">一路向前</span><span className="font-medium">追逐下一站的风景 ↗</span></div></div></div>
      </div></section>

      <section id="explore" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-22"><div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow">EXPLORE THE RAILWAY</p><h2 className="section-title">从一个名字，驶向整个铁路世界。</h2><p className="mt-3 text-[#69766f]">搜索你熟悉的车站、途经的线路，或者心仪的列车。</p></div><span className="text-xs text-[#8b9690]">以下为界面示例资料 · 非实时信息</span></div><div className="mt-8 flex max-w-3xl items-center rounded-2xl border border-[#e3e9e4] bg-white px-4 shadow-[0_8px_30px_rgba(20,55,46,.04)] focus-within:border-[#e78167]"><Search className="size-5 shrink-0 text-[#829188]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：北京站、京沪高速铁路、复兴号…" className="h-14 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0" aria-label="搜索示例资料" /></div><div className="mt-6 flex gap-2" role="group" aria-label="资料筛选">{filters.map((name) => <Button key={name} type="button" variant={filter === name ? "default" : "outline"} size="sm" onClick={() => setFilter(name)} className={`rounded-full px-5 ${filter === name ? "bg-[#173b31] hover:bg-[#245244]" : "border-[#e1e7e2] bg-white text-[#53635a]"}`}>{name}</Button>)}</div><div id="library" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item) => <Card key={item.name} className="border-[#e5eae6] bg-white py-0 shadow-none transition hover:-translate-y-0.5 hover:border-[#cfdad1] hover:shadow-md"><CardContent className="flex min-h-34 items-start justify-between p-5"><div><Badge variant="secondary" className="bg-[#f2f5f2] text-[#56685e]">{item.type}</Badge><h3 className="mt-5 text-lg font-semibold tracking-tight">{item.name}</h3><p className="mt-1 text-sm text-[#86938b]">{item.detail}</p></div><span className={`item-mark ${item.tone}`}>{item.code}</span></CardContent></Card>)}{visible.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-[#d4ddd5] bg-white px-6 py-12 text-center text-[#6e7c73]">没有找到匹配的示例资料。试试其他关键词。</div>}</div><p className="mt-5 text-xs text-[#9ba69e]">资料库正在规划中。示例仅用于展示界面和搜索交互。</p></section>

      <section id="journal" className="border-y border-[#e9ede8] bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[.85fr_1.15fr] md:items-center md:px-8 md:py-22"><div><p className="eyebrow">YOUR RAILWAY STORY</p><h2 className="section-title">每一趟列车，<br />都是自己的故事。</h2><p className="mt-5 max-w-md leading-8 text-[#68776d]">把乘过的车、拍到的瞬间和喜欢的线路，整理成自己的铁路手账。私人记录由你决定何时分享。</p><div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#df654d]">个人记录功能规划中 <ArrowRight className="size-4" /></div></div><div className="grid gap-4 sm:grid-cols-2"><Feature icon={<TrainTrack />} title="乘车足迹" text="记下日期、车次和途经站点，回看走过的每段路。" /><Feature icon={<Camera />} title="拍车档案" text="归档列车照片、地点与瞬间，留住每次相遇。" /><Feature icon={<Bookmark />} title="心愿收藏" text="把想去的车站、想乘的线路收入自己的清单。" /><Feature icon={<MapPinned />} title="铁路地图" text="以地图串起熟悉的地点。地图服务待完成数据与合规验证。" /></div></div></section>
      <section id="community" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-22"><div className="rounded-[28px] bg-[#eef3ee] px-7 py-10 md:flex md:items-center md:justify-between md:px-12 md:py-14"><div><p className="eyebrow">TOGETHER ON THE TRACKS</p><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">一个人的旅途，也能遇见同路的人。</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#66776d]">分享照片与见闻，发现大家眼中的铁路。社区将在资料库和个人记录就绪后开放。</p></div><Compass className="mt-8 size-14 text-[#a5bbaa] md:mt-0 md:size-20" strokeWidth={1.2} /></div></section>
    </main><footer className="border-t border-[#e7ece7] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#8a968d] md:flex-row md:items-center md:justify-between md:px-8"><span className="font-semibold text-[#29463a]">Chase The Train<span className="text-[#e65d46]">.</span></span><span>为热爱铁路的每一个人而建 · 项目预览</span><a href="#top" className="hover:text-[#e65d46]">回到顶部 ↑</a></div></footer>
  </div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <Card className="border-[#e9ede9] bg-[#fafbf9] py-0 shadow-none"><CardContent className="p-6"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#e9f1ea] text-[#356047]">{icon}</span><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#7a8980]">{text}</p></CardContent></Card>;
}
