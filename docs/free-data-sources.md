# 日本铁路数据源核查（2026-11-17）

首发范围是日本，JR 与其他运营商均纳入实体模型。免费访问不等于无限调用、缓存或再分发；每个数据集需核对条款、地区覆盖和更新义务。

| 来源 | 资料用途 | 当前结论 |
| --- | --- | --- |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access/en) | 运营商、车站、线路、车型名称和别名 | CC0 候选基础层；抽检质量，保留 QID 与字段来源。[Wikibase API](https://www.mediawiki.org/wiki/Wikibase/API) 可搜索实体及读取声明。 |
| [OSM / Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) | 站点点位、设施和局部几何 | ODbL；公共实例不稳定，范围与频率须限制，展示内容须[署名](https://wiki.openstreetmap.org/wiki/Attribution)。 |
| [ODPT](https://developer.odpt.org/) | 具体运营商开放的静态/动态数据 | [免费注册](https://www.odpt.org/overview/)取得 key，逐数据集检查[许可](https://developer.odpt.org/terms/data_basic_license.html)及[动态数据展示规则](https://developer.odpt.org/terms/data_basic_use_guideline.html)。不能假设所有 JR 数据都覆盖。 |
| [国土数值信息 N02](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_1.html) | 全国铁路线路/站点几何及运营主体候选 | 版本化下载；核对年份、原始资料和使用条款。 |
| [駅データ.jp](https://www.ekidata.jp/faq.php) | 车站、线路关系候选 | 可评估下载文件；在线 API 已停止，不能作为在线依赖。 |

接入顺序：Wikidata 小样本 → Overpass 局部坐标核验 → 版本化日本基础资料导入 → ODPT 按许可逐数据集接入。时刻表与动态独立于资料库；缺少授权和生成时间时不展示“实时”。中国铁路数据接入暂缓。
