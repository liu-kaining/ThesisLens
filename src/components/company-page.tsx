import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  BookOpenText,
  Building2,
  FileText,
  LineChart,
  Scale,
  ShieldQuestion,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";
import { FinancialChart, PriceChart } from "@/components/charts";
import { SearchBox } from "@/components/search-box";
import {
  dateShort,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio
} from "@/lib/format";
import {
  dataModeLabel,
  evidenceSourceLabel,
  scoreTypeLabel,
} from "@/lib/labels";
import type {
  CompanyScore,
  Direction,
  EnrichedResearch,
  Evidence,
  ResearchSnapshot,
} from "@/lib/types";

type CompanyPageProps = {
  research: EnrichedResearch;
};

export function CompanyPage({ research }: CompanyPageProps) {
  const { snapshot, evidence, scores } = research;
  const latestFinancial = snapshot.financials[0];
  const latestMetric = snapshot.metrics[0];
  const estimate = snapshot.analystEstimates[0];

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            返回总览
          </Link>
          <div className="w-full lg:max-w-md">
            <SearchBox compact />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-md border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-ink px-2.5 py-1 text-sm font-semibold text-white">
                  {snapshot.profile.symbol}
                </span>
                <span className="rounded border border-line px-2.5 py-1 text-xs font-semibold text-muted">
                  {snapshot.profile.exchange}
                </span>
                <span className="rounded border border-line px-2.5 py-1 text-xs font-semibold text-muted">
                  {snapshot.profile.sector}
                </span>
                <span className="rounded border border-line px-2.5 py-1 text-xs font-semibold text-muted">
                  {dataModeLabel(snapshot.dataStatus.mode)}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                {snapshot.profile.name}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">{snapshot.profile.description}</p>
            </div>
            <div className="grid min-w-72 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <Metric label="价格" value={formatCurrency(snapshot.quote.price, false)} />
              <Metric
                label="日内涨跌"
                value={formatPercent(snapshot.quote.changesPercentage)}
                tone={snapshot.quote.changesPercentage >= 0 ? "positive" : "negative"}
              />
              <Metric label="市值" value={formatCurrency(snapshot.quote.marketCap)} />
              <Metric label="成交量" value={formatNumber(snapshot.quote.volume)} />
            </div>
          </div>
          <DataStatusPanel modules={snapshot.dataStatus.modules ?? []} />
          {snapshot.dataStatus.warnings.length > 0 ? (
            <div className="mt-5 rounded-md border border-amber bg-[#fff7e8] p-3 text-sm text-amber">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  {snapshot.dataStatus.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="核心数据快照" />
            <QuickFacts snapshot={snapshot} />
          </div>

          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <SectionTitle icon={<Scale className="h-4 w-4" />} title="计算指标（仅供排序）" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {scores.slice(0, 8).map((score) => (
                <ScoreCard key={score.id} score={score} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel icon={<BarChart3 className="h-4 w-4" />} title="基本面质量">
            <FinancialChart data={snapshot.financials} />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Metric label="收入" value={formatCurrency(latestFinancial?.revenue)} />
              <Metric label="自由现金流" value={formatCurrency(latestFinancial?.freeCashFlow)} />
              <Metric label="营业利润率" value={formatPercent(latestMetric?.operatingMargin)} />
              <Metric label="Piotroski" value={`${snapshot.scores.piotroskiScore ?? "N/A"}/9`} />
            </div>
          </Panel>

          <Panel icon={<BadgeDollarSign className="h-4 w-4" />} title="估值框架">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="P/E" value={formatRatio(latestMetric?.peRatio ?? snapshot.quote.pe, "x")} />
              <Metric label="EV/EBITDA" value={formatRatio(latestMetric?.evToEbitda, "x")} />
              <Metric label="DCF 公允价值" value={formatCurrency(snapshot.valuation.dcf, false)} />
              <Metric label="一致目标价" value={formatCurrency(snapshot.priceTarget.targetConsensus, false)} />
              <Metric label="历史 PE 分位" value={formatPercent(snapshot.valuation.historicalPePercentile, 0)} />
              <Metric label="行业 PE" value={formatRatio(snapshot.valuation.industryPe, "x")} />
            </div>
            <p className="mt-4 rounded-md border border-line bg-canvas p-3 text-sm leading-6 text-muted">
              估值不是单点答案。ThesisLens 会把市场价格、模型价值、分析师目标价、
              倍数和相对位置放在一起比较，而不是把任何一个估值数当成真理。
            </p>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Panel icon={<TrendingUp className="h-4 w-4" />} title="分析师预期">
            <div className="grid gap-3">
              <Metric label="远期 EPS 预期" value={estimate?.estimatedEpsAvg?.toFixed(2) ?? "N/A"} />
              <Metric label="EPS 修正" value={formatPercent(estimate?.epsRevisionPercent)} />
              <Metric label="收入修正" value={formatPercent(estimate?.revenueRevisionPercent)} />
              <Metric label="评级" value={snapshot.rating.rating || "N/A"} />
            </div>
          </Panel>

          <Panel icon={<FileText className="h-4 w-4" />} title="事件与 SEC 文件">
            <Timeline
              items={[
                ...snapshot.upcomingEvents.map((event) => ({
                  id: event.id,
                  date: event.date,
                  title: event.title,
                  detail: event.description ?? event.type
                })),
                ...snapshot.filings.slice(0, 4).map((filing) => ({
                  id: filing.id,
                  date: filing.filingDate,
                  title: filing.formType,
                  detail: filing.title,
                  url: filing.url
                }))
              ]}
            />
          </Panel>

          <Panel icon={<Users className="h-4 w-4" />} title="内幕与国会交易">
            <div className="flex flex-col gap-3">
	              {snapshot.insiders.slice(0, 2).map((item) => (
	                <MiniEvent
	                  key={item.id}
	                  title={`${item.reportingName} ${item.transactionType}`}
	                  detail={[
                      item.role || "内幕人士",
                      item.securityName || null,
                      item.shares ? `${formatNumber(item.shares)} 股` : null,
                      item.price ? `${formatCurrency(item.price, false)}/股` : null,
                      item.value ? formatCurrency(item.value) : null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
	                  date={item.transactionDate}
                    url={item.sourceUrl}
	                />
	              ))}
	              {snapshot.congress.slice(0, 2).map((item) => (
	                <MiniEvent
	                  key={item.id}
	                  title={`${item.chamber} ${item.transactionType}`}
	                  detail={[
                      item.representativeName,
                      item.assetDescription || snapshot.profile.symbol,
                      item.amountLabel || amountRangeLabel(item.amountMin, item.amountMax),
                      item.owner || null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
	                  date={item.transactionDate}
                    url={item.sourceUrl}
	                />
	              ))}
              {!snapshot.insiders.length && !snapshot.congress.length ? (
                <p className="text-sm text-muted">当前没有载入近期行为披露。</p>
              ) : null}
              <p className="rounded-md border border-line bg-canvas p-3 text-xs leading-5 text-muted">
                国会交易披露存在延迟，只能作为背景信息，不能当作实时交易意图，
                也不能单独构成投资结论。
              </p>
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel icon={<LineChart className="h-4 w-4" />} title="技术面背景">
            <PriceChart data={snapshot.technicals} />
          </Panel>

          <Panel icon={<Building2 className="h-4 w-4" />} title="同行位置">
            <div className="overflow-hidden rounded-md border border-line">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-3">同行</th>
                    <th className="px-3 py-3">P/E</th>
                    <th className="px-3 py-3">营业利润率</th>
                    <th className="px-3 py-3">1Y</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.peers.map((peer) => (
                    <tr key={peer.symbol} className="border-t border-line">
                      <td className="px-3 py-3">
                        <Link href={`/stocks/${peer.symbol}`} className="font-semibold text-steel hover:text-ink">
                          {peer.symbol}
                        </Link>
                        <p className="max-w-36 truncate text-xs text-muted">{peer.name}</p>
                      </td>
                      <td className="px-3 py-3">{formatRatio(peer.peRatio, "x")}</td>
                      <td className="px-3 py-3">{formatPercent(peer.operatingMargin)}</td>
                      <td className="px-3 py-3">{formatPercent(peer.priceChange1Y)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Panel icon={<BookOpenText className="h-4 w-4" />} title="客观数据摘要" className="h-full">
            <ObjectiveDataSummary snapshot={snapshot} scores={scores} />
          </Panel>

          <Panel
            icon={<ShieldQuestion className="h-4 w-4" />}
            title="证据账本"
            className="h-full"
            contentClassName="flex min-h-[720px] flex-1 lg:min-h-0"
          >
            <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
              {evidence.slice(0, 18).map((item) => (
                <EvidenceRow key={item.id} evidence={item} />
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="text-steel">{icon}</span>
      {title}
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
  className = "",
  contentClassName = ""
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`flex flex-col rounded-md border border-line bg-white p-5 shadow-sm ${className}`}>
      <SectionTitle icon={icon} title={title} />
      <div className={`mt-4 ${contentClassName}`}>{children}</div>
    </div>
  );
}

function DataStatusPanel({ modules }: { modules: NonNullable<ResearchSnapshot["dataStatus"]["modules"]> }) {
  if (!modules.length) return null;

  return (
    <div className="mt-5 rounded-md border border-line bg-canvas p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">数据接入状态</h2>
        <span className="text-xs text-muted">绿色为已接入 FMP 实时数据，黄色为暂不可用或未接入</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {modules.map((module) => (
          <div
            key={module.key}
            title={module.detail}
            className={`rounded border p-3 ${
              module.status === "live"
                ? "border-moss bg-[#f2f6ec]"
                : module.status === "mock"
                  ? "border-amber bg-[#fff7e8]"
                  : "border-line bg-white"
            }`}
          >
            <p className="text-xs font-semibold text-ink">{module.label}</p>
            <p
              className={`mt-1 text-xs ${
                module.status === "live"
                  ? "text-moss"
                  : module.status === "mock"
                    ? "text-amber"
                    : "text-muted"
              }`}
            >
              {module.status === "live" ? "已接入" : module.status === "mock" ? "示例" : "暂无实时数据"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: Direction;
}) {
  return (
    <div className="rounded-md border border-line bg-canvas p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-1 break-words text-lg font-semibold ${
          tone === "positive" ? "text-moss" : tone === "negative" ? "text-brick" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickFacts({ snapshot }: { snapshot: ResearchSnapshot }) {
  const latestFinancial = snapshot.financials[0];
  const latestMetric = snapshot.metrics[0];
  const latestTechnical = snapshot.technicals.at(-1);
  const nextEvent = snapshot.upcomingEvents[0];
  const latestFiling = snapshot.filings[0];

  const facts = [
    ["价格", formatCurrency(snapshot.quote.price, false), `日内 ${formatPercent(snapshot.quote.changesPercentage)}`],
    ["市值", formatCurrency(snapshot.quote.marketCap), `成交量 ${formatNumber(snapshot.quote.volume)}`],
    ["收入", formatCurrency(latestFinancial?.revenue), latestFinancial ? `${latestFinancial.fiscalYear} 财年` : "N/A"],
    ["自由现金流", formatCurrency(latestFinancial?.freeCashFlow), "最近财年"],
    ["营业利润率", formatPercent(latestMetric?.operatingMargin), "FMP ratios"],
    ["一致目标价", formatCurrency(snapshot.priceTarget.targetConsensus, false), snapshot.priceTarget.updatedAt ? dateShort(snapshot.priceTarget.updatedAt) : "N/A"],
    ["下一财报", nextEvent ? dateShort(nextEvent.date) : "N/A", nextEvent?.description ?? "暂无未来事件"],
    ["最新 SEC", latestFiling ? `${latestFiling.formType} · ${dateShort(latestFiling.filingDate)}` : "N/A", latestFiling?.title ?? "暂无文件"],
    ["行为披露", `${snapshot.insiders.length} 内幕 / ${snapshot.congress.length} 国会`, "仅披露事实"],
    ["最新技术日", latestTechnical ? dateShort(latestTechnical.date) : "N/A", latestTechnical ? `收盘 ${formatCurrency(latestTechnical.close, false)}` : "N/A"]
  ];

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {facts.map(([label, value, detail]) => (
        <div key={label} className="rounded-md border border-line p-3">
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="mt-1 break-words text-base font-semibold text-ink">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{detail}</p>
        </div>
      ))}
    </div>
  );
}

function ScoreCard({ score }: { score: CompanyScore }) {
  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{scoreTypeLabel(score.scoreType)}</p>
        <span className="text-xl font-semibold text-steel">{score.score}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full bg-steel" style={{ width: `${score.score}%` }} />
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {score.drivers.slice(0, 2).map((driver) => (
          <div key={driver.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted">{driver.label}</span>
            <span className="font-semibold text-ink">{driver.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline({
  items
}: {
  items: Array<{ id: string; date: string; title: string; detail: string; url?: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.slice(0, 6).map((item) => (
        <MiniEvent key={item.id} title={item.title} detail={item.detail} date={item.date} url={item.url} />
      ))}
    </div>
  );
}

function MiniEvent({
  title,
  detail,
  date,
  url
}: {
  title: string;
  detail: string;
  date: string;
  url?: string;
}) {
  const content = (
    <div className="rounded-md border border-line p-3 transition hover:border-steel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{detail}</p>
        </div>
        {url ? <ArrowUpRight className="h-4 w-4 flex-none text-muted" /> : null}
      </div>
      <p className="mt-2 text-xs font-medium text-muted">{dateShort(date)}</p>
    </div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}

function ObjectiveDataSummary({ snapshot, scores }: { snapshot: ResearchSnapshot; scores: CompanyScore[] }) {
  const latestFinancial = snapshot.financials[0];
  const latestMetric = snapshot.metrics[0];
  const latestTechnical = snapshot.technicals.at(-1);
  const score = (type: CompanyScore["scoreType"]) =>
    scores.find((item) => item.scoreType === type)?.score ?? "N/A";

  return (
    <div className="grid gap-4">
      <DataBlock
        title="数据时间与覆盖"
        rows={[
          ["FMP 刷新时间", dateShort(snapshot.dataStatus.refreshedAt)],
          ["数据模式", dataModeLabel(snapshot.dataStatus.mode)],
          ["财务期数", `${snapshot.financials.length}`],
          ["新闻/公告", `${snapshot.news.length}`],
          ["SEC 文件", `${snapshot.filings.length}`],
          ["行为披露", `${snapshot.insiders.length + snapshot.congress.length}`]
        ]}
      />

      <DataBlock
        title="行情与基础指标"
        rows={[
          ["价格", formatCurrency(snapshot.quote.price, false)],
          ["日内涨跌", formatPercent(snapshot.quote.changesPercentage)],
          ["市值", formatCurrency(snapshot.quote.marketCap)],
          ["成交量", formatNumber(snapshot.quote.volume)],
          ["P/E", formatRatio(snapshot.quote.pe, "x")],
          ["52 周高/低", `${formatCurrency(snapshot.quote.yearHigh, false)} / ${formatCurrency(snapshot.quote.yearLow, false)}`]
        ]}
      />

      <DataBlock
        title="财务与质量数据"
        rows={[
          ["最近财年", latestFinancial ? `${latestFinancial.fiscalYear}` : "N/A"],
          ["收入", formatCurrency(latestFinancial?.revenue)],
          ["净利润", formatCurrency(latestFinancial?.netIncome)],
          ["自由现金流", formatCurrency(latestFinancial?.freeCashFlow)],
          ["毛利率", formatPercent(latestMetric?.grossMargin)],
          ["营业利润率", formatPercent(latestMetric?.operatingMargin)],
          ["ROE", formatPercent(latestMetric?.roe)],
          ["Piotroski / Altman", `${snapshot.scores.piotroskiScore ?? "N/A"} / ${snapshot.scores.altmanZScore ?? "N/A"}`]
        ]}
      />

      <DataBlock
        title="估值与预期数据"
        rows={[
          ["DCF / Levered DCF", `${formatCurrency(snapshot.valuation.dcf, false)} / ${formatCurrency(snapshot.valuation.leveredDcf, false)}`],
          ["一致目标价", formatCurrency(snapshot.priceTarget.targetConsensus, false)],
          ["目标价高/低", `${formatCurrency(snapshot.priceTarget.targetHigh, false)} / ${formatCurrency(snapshot.priceTarget.targetLow, false)}`],
          ["评级", snapshot.rating.rating || "N/A"],
          ["质量/估值/预期计算分", `${score("quality")} / ${score("valuation")} / ${score("expectations")}`],
          ["最新技术日期", latestTechnical ? dateShort(latestTechnical.date) : "N/A"],
          ["RSI / 50 日均线", `${latestTechnical?.rsi?.toFixed(0) ?? "N/A"} / ${formatCurrency(latestTechnical?.sma50, false)}`]
        ]}
      />

      <CompactTable
        title="分析师预期明细"
        headers={["财年", "EPS 预期", "收入预期", "覆盖数", "EPS 修正"]}
        rows={snapshot.analystEstimates.slice(0, 4).map((item) => [
          `${item.fiscalYear}`,
          item.estimatedEpsAvg?.toFixed(2) ?? "N/A",
          formatCurrency(item.estimatedRevenueAvg),
          `${item.analysts ?? "N/A"}`,
          formatPercent(item.epsRevisionPercent)
        ])}
      />

      <CompactTable
        title="近期事件与文件"
        headers={["日期", "类型", "标题", "说明"]}
        rows={[
          ...snapshot.upcomingEvents.slice(0, 3).map((item) => [
            dateShort(item.date),
            "财报",
            item.title,
            item.description ?? "N/A"
          ]),
          ...snapshot.filings.slice(0, 5).map((item) => [
            dateShort(item.filingDate),
            item.formType,
            item.title,
            item.url ? <ExternalLink href={item.url}>原文</ExternalLink> : "N/A"
          ])
        ]}
      />

      <CompactTable
        title="近期内幕与国会披露"
        headers={["日期", "来源", "主体", "类型", "金额/数量", "详情"]}
        rows={[
          ...snapshot.insiders.slice(0, 5).map((item) => [
            dateShort(item.transactionDate),
            "内幕",
            item.reportingName,
            item.transactionType,
            [item.shares ? `${formatNumber(item.shares)} 股` : null, item.value ? formatCurrency(item.value) : null]
              .filter(Boolean)
              .join(" / ") || "N/A",
            item.sourceUrl ? <ExternalLink href={item.sourceUrl}>查看</ExternalLink> : "N/A"
          ]),
          ...snapshot.congress.slice(0, 5).map((item) => [
            dateShort(item.transactionDate),
            item.chamber,
            item.representativeName,
            item.transactionType,
            item.amountLabel || amountRangeLabel(item.amountMin, item.amountMax) || "N/A",
            item.sourceUrl ? <ExternalLink href={item.sourceUrl}>查看</ExternalLink> : "N/A"
          ])
        ]}
      />

      <CompactTable
        title="最新新闻与公告"
        headers={["日期", "来源", "标题"]}
        rows={snapshot.news.slice(0, 6).map((item) => [
          dateShort(item.publishedAt),
          item.publisher,
          item.url ? <ExternalLink href={item.url}>{item.title}</ExternalLink> : item.title
        ])}
      />
    </div>
  );
}

function amountRangeLabel(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `${formatCurrency(min, false)} - ${formatCurrency(max, false)}`;
  if (min !== undefined) return formatCurrency(min, false);
  return "";
}

function DataBlock({ title, rows }: { title: string; rows: Array<[string, React.ReactNode]> }) {
  return (
    <div className="rounded-md border border-line p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded border border-line bg-canvas px-3 py-2">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactTable({
  title,
  headers,
  rows
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="rounded-md border border-line p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {rows.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="border-b border-line px-3 py-2 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-line last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top text-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">暂无可展示数据。</p>
      )}
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-steel hover:text-ink">
      {children}
    </a>
  );
}

function EvidenceRow({ evidence }: { evidence: Evidence }) {
  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{evidence.label}</p>
          <p className="mt-1 break-words text-sm text-muted">
            {typeof evidence.value === "number"
              ? evidence.unit === "USD"
                ? formatCurrency(evidence.value)
                : evidence.unit === "%"
                  ? formatPercent(evidence.value)
                  : formatNumber(evidence.value)
              : String(evidence.value ?? "N/A")}
          </p>
        </div>
        <span className="rounded bg-canvas px-2 py-1 text-[11px] font-semibold text-muted">
          {evidenceSourceLabel(evidence.source)}
        </span>
      </div>
      {evidence.timestamp ? <p className="mt-2 text-xs text-muted">{dateShort(evidence.timestamp)}</p> : null}
    </div>
  );
}
