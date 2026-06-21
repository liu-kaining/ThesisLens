import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  BookOpenText,
  Building2,
  CheckCircle2,
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
  confidenceLabel,
  dataModeLabel,
  evidenceSourceLabel,
  scoreTypeLabel,
  signalCategoryLabel
} from "@/lib/labels";
import type {
  CompanyScore,
  Direction,
  EnrichedResearch,
  Evidence,
  ResearchMemo,
  ResearchSnapshot,
  Signal
} from "@/lib/types";

type CompanyPageProps = {
  research: EnrichedResearch;
};

const directionClass: Record<Direction, string> = {
  positive: "border-moss bg-[#f2f6ec] text-moss",
  negative: "border-brick bg-[#fff1ef] text-brick",
  neutral: "border-line bg-white text-muted",
  mixed: "border-amber bg-[#fff7e8] text-amber"
};

export function CompanyPage({ research }: CompanyPageProps) {
  const { snapshot, evidence, scores, signals, memo } = research;
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
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="今日结论" />
            <div className="mt-4 grid gap-3">
              {signals.slice(0, 4).map((signal) => (
                <SignalCard key={signal.id} signal={signal} evidence={evidence} />
              ))}
            </div>
          </div>

          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <SectionTitle icon={<Scale className="h-4 w-4" />} title="评分矩阵" />
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
                  detail={`${item.role || "内幕人士"} · ${formatCurrency(item.value)}`}
                  date={item.transactionDate}
                />
              ))}
              {snapshot.congress.slice(0, 2).map((item) => (
                <MiniEvent
                  key={item.id}
                  title={`${item.chamber} ${item.transactionType}`}
                  detail={`${item.representativeName} · ${item.assetDescription || snapshot.profile.symbol}`}
                  date={item.transactionDate}
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

        <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Panel icon={<BookOpenText className="h-4 w-4" />} title="规则研究备忘录">
            <Memo memo={memo} evidence={evidence} />
          </Panel>

          <Panel icon={<ShieldQuestion className="h-4 w-4" />} title="证据账本">
            <div className="flex max-h-[720px] flex-col gap-3 overflow-auto pr-1">
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
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-sm">
      <SectionTitle icon={icon} title={title} />
      <div className="mt-4">{children}</div>
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

function SignalCard({ signal, evidence }: { signal: Signal; evidence: Evidence[] }) {
  const linked = evidence.filter((item) => signal.evidenceIds.includes(item.id)).slice(0, 3);
  const sources = Array.from(new Set(linked.map((item) => evidenceSourceLabel(item.source))));

  return (
    <article className="rounded-md border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`rounded border px-2 py-1 text-xs ${directionClass[signal.direction]}`}>
            {signalCategoryLabel(signal.category)}
          </span>
          <h3 className="mt-3 text-base font-semibold text-ink">{signal.title}</h3>
        </div>
        <span className="rounded bg-canvas px-2 py-1 text-xs font-semibold text-muted">
          置信度 {Math.round(signal.confidence * 100)}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{signal.summary}</p>
      {linked.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {linked.map((item) => (
            <span key={item.id} className="rounded border border-line px-2 py-1 text-xs text-muted">
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{dateShort(signal.computedAt)}</span>
        {sources.length > 0 ? <span>来源：{sources.join(", ")}</span> : null}
      </div>
    </article>
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

function Memo({ memo, evidence }: { memo: ResearchMemo; evidence: Evidence[] }) {
  const sections = [
    ["发生了什么变化", memo.whatChanged],
    ["基本面质量", memo.businessQuality],
    ["估值", memo.valuation],
    ["分析师预期", memo.expectations],
    ["催化剂与风险", memo.catalystsAndRisks],
    ["行为信号", memo.behaviorSignals],
    ["多头 case", memo.bullCase],
    ["空头 case", memo.bearCase]
  ] as const;

  return (
    <div>
      <div className="rounded-md border border-line bg-canvas p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <Sparkles className="h-4 w-4" />
          <span>规则生成 · {dateShort(memo.generatedAt)}</span>
          <span className="rounded border border-line px-2 py-1 normal-case tracking-normal">
            仅用于研究，不构成投资建议
          </span>
        </div>
        <p className="text-sm leading-6 text-ink">{memo.executiveSummary}</p>
      </div>

      <div className="mt-4 grid gap-3">
        {sections.map(([title, section]) => {
          const sectionEvidence = evidence.filter((item) => section.evidenceIds.includes(item.id)).slice(0, 4);

          return (
            <div key={title} className="rounded-md border border-line p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <span className="rounded bg-canvas px-2 py-1 text-xs text-muted">
                  {confidenceLabel(section.confidence)}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted">{section.summary}</p>
              {sectionEvidence.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sectionEvidence.map((item) => (
                    <span key={item.id} className="rounded border border-line px-2 py-1 text-xs text-muted">
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-line p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">需要回答的问题</h3>
        <div className="flex flex-col gap-2">
          {memo.keyQuestions.map((question) => (
            <div key={question} className="flex gap-2 text-sm leading-6 text-muted">
              <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-moss" />
              {question}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {evidence
          .filter((item) => memo.evidenceIds.includes(item.id))
          .slice(0, 10)
          .map((item) => (
            <span key={item.id} className="rounded border border-line px-2 py-1 text-xs text-muted">
              {item.label}
            </span>
          ))}
      </div>
    </div>
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
