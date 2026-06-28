# ThesisLens

ThesisLens 是一个由 Financial Modeling Prep（FMP）数据驱动的美股研究工作台。
它不只是展示数据表，而是把公司基本面、估值、分析师预期、SEC 文件、新闻公告、
内幕交易、国会交易、技术面和同行数据组织成可追溯的研究流程。

当前版本使用确定性规则生成分数、信号和研究摘要，不调用外部大模型，也不会在
实时模式中用示例金融数据填补缺失值。产品仅用于研究和教育，不构成投资建议。

## 功能总览

### 登录与权限

- 支持管理员口令登录，登录状态保存在签名的 HttpOnly Cookie 中。
- 管理员可以生成有有效期的动态访问口令，普通访问者使用动态口令登录。
- 动态口令失效后，对应访问会话最迟在口令到期时失效。
- 普通访问者看不到管理员和设置入口，也不能访问管理员 API。
- 后台 Worker 使用独立的内部令牌，只能访问内部任务 API 和必要的只读规划数据。
- 登录接口包含 Redis 支持的尝试次数限制。

当前权限模型适合私有、单租户部署。公开多用户服务仍需增加独立账户、数据归属、
审计日志和租户隔离。

### 总览

路由：`/`

- 展示观察列表的日内平均涨跌。
- 展示当前有效数据模块数量和未来财报事件数量。
- 汇总观察列表中的价格、变化信号和研究候选。
- 所有统计仅描述当前观察列表，不冒充全市场判断。

### 股票搜索

- 支持按股票代码或公司名称联想搜索。
- 优先返回 NASDAQ、NYSE、AMEX、CBOE 和 OTC 的美股标的。
- 支持从总览、导航栏和观察列表直接进入公司研究页。
- 实时 FMP 请求失败时返回空结果，不注入内置示例公司。

### 公司研究页

路由示例：`/stocks/AAPL`

公司页是 ThesisLens 的核心工作区，包括：

- 公司资料：名称、交易所、行业、简介、CEO、员工数和 IPO 日期。
- 实时行情：价格、日内涨跌、成交量、市值、P/E 和 52 周高低点。
- 数据接入状态：逐模块展示实时、快照、暂无数据和最近更新时间。
- 基本面：最多 6 个财年的收入、利润、现金流、资产、负债和每股数据。
- 财务比率：毛利率、营业利润率、净利率、ROE、ROIC、流动比率和负债权益比。
- 财务健康：FMP Piotroski F-Score 和 Altman Z-Score。
- 估值：DCF、Levered DCF、企业价值和分析师一致目标价。
- 分析师预期：年度收入/EPS 预期、覆盖分析师数量和 FMP 评级。
- 事件：未来财报日期、新闻、公司公告和近期 SEC 文件。
- 行为披露：内幕交易和美国国会交易，支持跳转原始披露链接。
- 技术面：展示历史价格、SMA50 和 14 日 RSI；快照同时计算并保存 SMA200。
- 同行比较：同行 P/E、营业利润率和一年价格变化。
- 客观数据摘要：集中展示原始财务、估值、预期、事件和行为数据。
- 证据账本：记录每个规则分数和信号所引用的数据来源。

分数只有在底层证据充分时才会生成。缺少财务、估值或预期数据时，页面显示
`N/A`，不会使用默认分数制造结论。

### 观察列表

路由：`/watchlist`

- 通过代码或公司名称联想添加研究标的。
- 可以为标的填写研究备注。
- 支持删除二次确认。
- 展示价格、日内涨跌、综合研究分和当前最重要的信号。
- 展示价格、基本面、预期、事件、SEC、行为和技术面变化标签。
- 总览默认使用观察列表作为个人研究范围。

### 系统研究池

路由：`/universes`

系统预置并由 FMP 定期同步以下研究池：

- S&P 500 成分股。
- QQQ 持仓，异常时使用 Nasdaq 成分列表作为安全回退。
- SPY 持仓，异常时使用 S&P 500 成分列表作为安全回退。
- 道琼斯工业指数成分股。
- Nasdaq 成分股。

研究池支持分页。同步器会拒绝明显异常的成分数量，避免一次错误响应把正常研究池
清空或缩减成 ETF 自身。

### 选股器

路由：`/screens`

- 可以在观察列表或任一系统研究池之间切换分析范围。
- 高质量公司：筛选基本面质量和现金流证据较强的公司。
- 预期动量：筛选分析师预期和目标价证据改善的公司。
- 估值问题：比较价格、DCF、目标价和估值证据。
- 事件风险：聚合财报、SEC、公告和新闻事件。
- 数据不足的标的不参与相应规则筛选，不使用中性默认分代替真实数据。

### 市场横截面

路由：`/market`

- 在选定研究范围内比较价格、市值、P/E 和质量分。
- 按行业统计标的数量、平均涨跌、平均质量和平均估值。
- 缺少评分的公司不会以 0 分拉低行业平均值。

### 财报日历

路由：`/calendar`

- 汇总当前研究范围内未来 180 天的财报事件。
- 可以在观察列表和系统研究池之间切换。
- 显示日期、公司、EPS 预期和收入预期等已取得字段。

### 投资组合

路由：`/portfolio`

- 手工录入股票代码、持仓股数、平均成本和备注。
- 自动计算市值、持仓权重、成本、未实现盈亏和盈亏比例。
- 聚合行业暴露、加权质量、加权估值和加权事件风险。
- 聚合分数只使用具备相应数据的持仓，缺失数据不会按 0 分处理。

### Thesis 管理

路由：`/theses`

- 保存股票研究 thesis、标题和正文。
- 支持 `active`、`watching`、`closed` 状态。
- 支持删除前二次确认。
- Thesis 数据持久化到 PostgreSQL。

### 提醒规则

路由：`/alerts`

支持创建和删除以下规则：

- 质量分阈值。
- 估值分阈值。
- 预期分阈值。
- 价格变化阈值。
- 事件风险。

当前版本会根据最新持久化快照计算规则状态。它还不是独立的邮件、短信或推送通知
服务。

### 管理员与设置

路由：`/admin`、`/settings`

- 管理员可以查看和重建动态访问口令。
- 可以配置动态口令有效期。
- 设置页展示 FMP、PostgreSQL、Redis 和鉴权配置状态。
- 普通访问者不能看到或访问这些页面。

### 健康检查与内部 API

- `/api/health`：检查 PostgreSQL、Redis、鉴权、FMP、研究快照、任务队列和研究池。
- `/api/internal/fmp-health`：查看 FMP 端点状态和最近错误。
- `/api/internal/refresh/[symbol]`：按模块刷新公司数据。
- `/api/internal/recompute/[symbol]`：重新计算公司规则分数和信号。
- `/api/internal/sync/enqueue`：规划到期模块任务。
- `/api/internal/sync/run`：领取并执行持久化任务。
- `/api/internal/universes/sync`：同步系统研究池。

内部 API 只能使用 `INTERNAL_API_TOKEN` 调用，浏览器管理员会话也不能直接调用。

## 模块如何联动

1. 在观察列表加入股票后，它会成为总览、默认选股器、市场页和日历页的个人研究范围。
2. 进入公司页时，系统优先读取 PostgreSQL 中最近一次成功快照，不会等待所有 FMP
   接口完成才显示页面。
3. 如果某些数据模块已经到期，页面访问会把这些模块加入持久化任务队列。
4. Worker 每个周期优先刷新观察列表，同时轮转刷新系统研究池中的公司。
5. FMP 返回成功数据后，系统只合并对应模块，不覆盖其他仍然有效的模块。
6. 规则引擎根据最新快照重算证据、分数、信号和研究摘要。
7. 组合、选股器、市场、日历和提醒读取同一份公司研究快照，因此数据口径保持一致。

## 数据存储与更新

### PostgreSQL

PostgreSQL 持久化：

- 最新公司研究快照。
- 每个数据模块的状态、刷新时间、过期时间和最近错误。
- 数据同步任务及重试状态。
- 系统研究池和成分股。
- 观察列表。
- Thesis。
- 投资组合持仓。
- 提醒规则。
- 动态访问口令哈希。
- 规则研究摘要。

当前实现保存每家公司最新的合并快照，不是完整的逐日历史版本仓库。财务报表自身
包含多个历史财年，但“某一天看到的完整研究快照”尚未按天永久归档。

### Redis

- 缓存公司研究结果，减少重复数据库读取和 FMP 请求。
- 保存登录限流计数。
- Redis 短暂失联时会降级到进程内缓存，并在退避后自动重连。
- 生产环境配置了 Redis 时，Redis 失联会反映在健康检查中。

### 增量刷新策略

默认模块有效期：

| 模块 | 默认有效期 |
| --- | ---: |
| 行情 | 5 分钟 |
| 新闻与公告 | 15 分钟 |
| SEC 文件 | 30 分钟 |
| 技术面 | 1 小时 |
| 内幕交易 | 3 小时 |
| 分析师预期 | 6 小时 |
| 财报日历 | 6 小时 |
| 估值与目标价 | 12 小时 |
| 国会交易 | 12 小时 |
| 财务报表与比率 | 24 小时 |
| 财务健康分 | 24 小时 |
| 公司资料 | 7 天 |
| 同行数据 | 7 天 |

系统研究池默认每 24 小时同步一次。Worker 默认每 5 分钟运行一个增量周期，并按
优先级处理到期模块。

### FMP 不可用时

- 已有公司继续显示 PostgreSQL 中最近一次成功快照。
- 对应模块标记为“本地快照，等待更新”。
- 新请求失败不会用示例财务数据覆盖真实快照。
- 网络错误按任务规则重试；达到上限后进入冷却期。
- FMP 正常返回空数组时记录为“已检查但无数据”，不会无限重试。

## 快速启动

### Docker Compose

推荐使用 Docker Compose：

```bash
cp .env.example .env
```

至少配置：

```dotenv
FMP_API_KEY=your_fmp_premium_key
FMP_USE_MOCKS=false
AUTH_SECRET=at_least_32_random_characters
ADMIN_PASSPHRASE=at_least_12_characters
INTERNAL_API_TOKEN=at_least_32_random_characters
```

启动：

```bash
docker compose up -d --build
```

打开：

```text
http://localhost:3009
```

查看状态：

```bash
docker compose ps
docker compose logs -f app worker
curl http://localhost:3009/api/health
```

停止：

```bash
docker compose down
```

默认不会删除 PostgreSQL 数据卷。只有明确需要清空全部持久化数据时才使用
`docker compose down -v`。

### 本地 Node.js

```bash
npm install
npm run dev
```

本地开发环境如果不使用 Docker，需要自行提供 PostgreSQL 和 Redis，或者显式设置
`DATABASE_DISABLED=true`、`REDIS_DISABLED=true` 使用仅供开发的内存模式。

## 常用命令

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run verify
npm run smoke
npm run fmp:check
npm run worker
```

针对 `3009` 端口执行生产冒烟：

```bash
SMOKE_BASE_URL=http://localhost:3009 npm run smoke
```

验证 FMP Premium 权限：

```bash
FMP_API_KEY=your_key npm run fmp:check
```

## Docker 服务

- `app`：Next.js Web 应用和 API。
- `worker`：研究池同步、模块任务规划和任务执行。
- `postgres`：持久化业务数据、公司快照和任务队列。
- `redis`：分布式缓存和登录限流。

PostgreSQL 和 Redis 都带健康检查。应用会等待它们健康后启动，Worker 会等待应用
健康后启动。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `FMP_API_KEY` | FMP Premium API Key |
| `FMP_USE_MOCKS` | 生产必须为 `false` |
| `FMP_MIN_REQUEST_INTERVAL_MS` | FMP 请求启动间隔，默认 80ms |
| `AUTH_SECRET` | 会话签名密钥，至少 32 字符 |
| `ADMIN_PASSPHRASE` | 管理员口令，至少 12 字符 |
| `AUTH_SECURE_COOKIES` | HTTPS 部署时设为 `true` |
| `INTERNAL_API_TOKEN` | Worker 内部令牌，至少 32 字符 |
| `DATABASE_URL` | PostgreSQL 连接地址 |
| `REDIS_URL` | Redis 连接地址 |
| `APP_HOST_PORT` | Docker 对外端口，默认 3009 |
| `NEXT_PUBLIC_APP_URL` | 应用公开访问地址 |
| `WORKER_REFRESH_INTERVAL_MS` | Worker 周期间隔，默认 300000ms |
| `WORKER_MAX_SYMBOLS` | 每轮最多规划的观察列表标的数 |
| `WORKER_UNIVERSE_SYNC_INTERVAL_MS` | 研究池同步间隔 |
| `WORKER_SYSTEM_BATCH_SIZE` | 每轮系统研究池标的数 |
| `WORKER_JOB_CLAIM_LIMIT` | 每轮领取任务上限 |
| `DOCKER_NODE_IMAGE` | Docker Node 基础镜像，默认 `node:22-alpine` |

完整示例见 `.env.example`。

## 数据真实性原则

- 生产模式必须使用 `FMP_USE_MOCKS=false`。
- 示例数据只允许在开发或测试时显式启用。
- 缺失数据展示为 `N/A`，不转换成默认投资分数。
- 分数和信号必须能追溯到证据账本。
- 国会和内幕交易属于延迟披露，只能作为研究背景。
- 技术指标由实际历史价格计算，不使用人为占位值。
- 首页和市场页只描述选定研究范围，不声称代表整个美股市场。

## 当前上线边界

当前版本已通过私有单租户部署验收，包括完整测试、生产构建、Docker 冒烟、真实
FMP、PostgreSQL、Redis、任务队列和权限边界检查。

公开商业部署前仍需完成：

- 多用户账户和数据隔离。
- 完整操作审计。
- PostgreSQL 自动备份和恢复演练。
- 外部监控、错误告警和日志平台。
- HTTPS 反向代理与安全 Cookie。
- FMP 数据展示和再分发授权确认。
- 如需研究历史变化，增加按日快照或事件级历史版本仓库。

## 文档

- [产品需求文档](docs/PRD.md)
- [技术设计](docs/TECHNICAL_DESIGN.md)
- [FMP 接口能力矩阵](docs/FMP_ACCESS_MATRIX.md)
- [验证记录](docs/VERIFICATION.md)
