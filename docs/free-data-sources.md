# 日本铁路数据源核查（2026-11-17）

首发范围是日本，JR 与其他运营商均纳入实体模型。免费访问不等于无限调用、缓存或再分发；每个数据集需核对条款、地区覆盖和更新义务。

| 来源 | 资料用途 | 当前结论 |
| --- | --- | --- |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access/en) | 运营商、车站、线路、车型名称和别名 | CC0 候选基础层；抽检质量，保留 QID 与字段来源。[Wikibase API](https://www.mediawiki.org/wiki/Wikibase/API) 可搜索实体及读取声明。 |
| [OSM / Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) | 站点点位、设施和局部几何 | ODbL；公共实例不稳定，范围与频率须限制，展示内容须[署名](https://wiki.openstreetmap.org/wiki/Attribution)。 |
| [ODPT](https://developer.odpt.org/) | 具体运营商开放的静态/动态数据 | [免费注册](https://www.odpt.org/overview/)取得 key，逐数据集检查[许可](https://developer.odpt.org/terms/data_basic_license.html)及[动态数据展示规则](https://developer.odpt.org/terms/data_basic_use_guideline.html)。不能假设所有 JR 数据都覆盖。 |
| [国土数值信息 N02](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html) | 全国铁路线路/站点几何及运营主体候选 | 官方最新为 2025 年版，页面标明 2020 年后的版本采用 CC BY 4.0；须[署名并说明加工](https://nlftp.mlit.go.jp/ksj/other/agreement.html)。仓库的 `npm run data:check-mlit` 可发现最新下载文件与版本。 |
| [駅データ.jp](https://www.ekidata.jp/faq.php) | 车站、线路关系候选 | 可评估下载文件；在线 API 已停止，不能作为在线依赖。 |
| [Teraren 站点与线路 API](https://train.teraren.com/doc) | 日本站点、线路、邻近站搜索 | 官方 API 文档称免费，但文档也提示新干线站点或线路细节可能缺失；[条款](https://train.teraren.com/terms)对复制、公开和再利用有限制。当前只做候选评估，不镜像入库。 |
| [东京 Metro 新闻 RSS](https://www.tokyometro.jp/rssinfo/index.html) | 官方公告标题与链接 | 官方提供 RSS，但提示 URL/服务可能变更；当前执行环境访问站点为 403，暂不部署采集器。 |
| [JR 西日本新闻 RSS](https://www.westjr.co.jp/guide/site_policy.html) | 官方公告标题与链接 | 官方条款限定个人非营利用途，当前不用于本站公共功能。 |

接入顺序：Wikidata 小样本 → Overpass 局部坐标核验 → N02 版本化基础资料导入 → ODPT 按许可逐数据集接入。时刻表与动态独立于资料库；缺少授权和生成时间时不展示“实时”。中国铁路数据接入暂缓。

## 官方采集器边界

`scripts/check-mlit-n02.mjs` 只抓取 N02 官方目录的版本元数据，不下载或解析数据包。它限制到国土交通省域名，给请求设置超时、可恢复错误重试、页面大小上限和结构断言；页面结构变化会失败并报告，不会静默使用过期资料。下一步下载和导入数据包时，需保存版本、原始 URL、校验值和署名文本。

Wikidata 与 Overpass 的采集由浏览器页面主动发起，再将选中的结果提交服务端待核验库；没有 Vercel 定时任务。Wikidata 实测允许跨域访问；Overpass 公共节点虽允许跨域，但本次测试出现 502 和超时。国土交通省目录未提供浏览器跨域响应，因此只能由用户手动运行目录检查或主动触发服务端导入，不能由浏览器直接抓取。
