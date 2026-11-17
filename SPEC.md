# Chase The Train — 产品与技术规格（v0.1）

日期：2026-11-17。状态：首版开发规格。后端数据风险详见 [可行性验证](docs/backend-feasibility.md)。

## 产品定位

面向铁路迷的资料探索、乘车记录和拍车收藏平台。界面默认深色，品牌主色与强调色为 `#0B49F4`；以搜索、车站/线路/车型资料与个人记录为中心，简洁、清楚地标明资料来源和更新时间。简体中文优先，响应式支持手机和桌面。

## 首版用户任务

1. 搜索车站、线路和车型，查看简介、属性、图片及资料来源。
2. 记录一次乘车：日期、车次文本、起终点、车型、备注和照片。记录默认仅自己可见。
3. 记录一次拍车：日期、车站、车次或车辆、照片、备注；可主动公开。
4. 收藏车站、线路、车型，查看自己的记录时间线和统计。
5. 浏览公开作品、提交资料纠错、举报不当内容。

## 版本范围

### V0：当前仓库

Next.js App Router、Turbopack、Tailwind CSS、shadcn/ui 组件、响应式 UI 基础；展示信息为明确标注的示例内容。此阶段不连接虚构的实时数据。

### V1：可用产品

- 账号与个人资料；邮箱登录。角色为用户、审核员、管理员。
- 车站、线路、车型资料库；搜索、筛选、详情页、收藏。
- 乘车记录、拍车记录、照片上传；私密/公开设置；个人时间线和基础统计。
- 公开内容流、评论、点赞、举报、审核队列和资料纠错工作流。
- 数据来源、更新时间和许可信息随资料展示；管理员可以导入、回滚资料版本。

### V2：有数据授权后

合规地图、静态时刻表、按运营方 feed 提供的实时动态、路线探索和活动功能。每项按地区单独启用。

## 不在 V1 的功能

购票、余票、12306 账号绑定、未经授权的时刻表抓取、声称实时的预测列车位置、后台持续 GPS 跟踪。

## 界面结构

首页是工具工作台，直接显示资料搜索、类型筛选和结果列表；乘车记录、拍车记录与收藏是同级任务标签页。示例与未接入的数据源必须清楚标明。详情页统一显示来源、更新时间与纠错入口。移动端保留可用的搜索与列表，不使用宣传式首屏。

## 技术方案

- Web：Next.js 16 App Router、TypeScript、Turbopack、Tailwind CSS、shadcn/ui。
- API：首版在 Next.js Route Handlers 中按领域分模块；业务扩大时可拆为独立服务。
- 数据：PostgreSQL；需要地图检索时加 PostGIS。全文检索先用 PostgreSQL。
- 媒体：兼容 S3 的对象存储，短期签名上传、缩略图任务、EXIF 位置清理。
- 部署：Vercel 承载 Web/API；数据库和对象存储按首发地区与地图合规要求选择。生产环境配置使用环境变量。

## 数据模型（核心）

`users(id, email, display_name, role, created_at)`；`stations(id, name, aliases, region, source_id)`；`lines(id, name, kind, source_id)`；`rolling_stock(id, model, manufacturer, kind, source_id)`；`rides(id, owner_id, ride_date, train_label, origin_station_id, destination_station_id, rolling_stock_id, visibility, notes)`；`sightings(id, owner_id, sighted_at, station_id, train_label, rolling_stock_id, visibility, notes)`；`media(id, owner_id, object_key, mime_type, width, height)`；`favorites(owner_id, target_type, target_id)`；`posts(id, owner_id, content, visibility, status)`；`reports(id, reporter_id, target_type, target_id, status)`；`sources(id, name, url, license, retrieved_at, valid_until)`。

所有实体使用稳定内部 ID；外部车站/线路 ID 存映射表。时间戳统一 UTC，展示按用户时区。资料变更有审核与版本历史；删除账号和私密记录时清理关联媒体。

## API 草案

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/v1/search?q=&type=` | 搜索车站、线路、车型 |
| GET | `/api/v1/stations/:id` | 车站详情与来源 |
| GET | `/api/v1/lines/:id` | 线路详情 |
| GET | `/api/v1/rolling-stock/:id` | 车型详情 |
| GET/POST | `/api/v1/me/rides` | 我的乘车记录 |
| GET/POST | `/api/v1/me/sightings` | 我的拍车记录 |
| GET/POST | `/api/v1/me/favorites` | 收藏 |
| POST | `/api/v1/media/upload-url` | 签名上传 |
| GET | `/api/v1/feed` | 已审核的公开内容 |
| POST | `/api/v1/reports` | 举报 |
| POST | `/api/v1/corrections` | 资料纠错 |

写操作需要登录、CSRF 防护与服务端授权；列表使用游标分页。每条资料响应包含 `source` 和 `updated_at`。用户记录默认 `private`。上传图片限制类型、体积并移除位置信息；公开内容进入审核流程。

## 验收标准

- 匿名用户可搜索并浏览资料，来源与更新时间可见。
- 登录用户可创建、修改、删除自己的乘车和拍车记录；其他用户不能读取私密记录。
- 公开内容经过审核后出现在社区；举报可进入审核队列。
- 手机和桌面界面均可完成主要任务，键盘可操作，文本有清晰对比度。
- 无授权数据源时，时刻表、实时位置和余票入口不出现；示例数据有明显标记。
- `npm run build` 成功，Vercel 可从仓库根目录构建。

## 待确认的产品决策

首发地域、公开地图服务商、资料种子来源、账号登录方式、社区开放范围。这些不影响 V0 UI 框架，但决定 V1 的数据接入与上线方式。
