# ThesisLens PRD

## 1. Product Summary

ThesisLens is an AI-assisted U.S. equity research website built on Financial Modeling Prep (FMP) data. It turns structured financial, market, analyst, event, filing, insider, and congressional datasets into an explainable investment research workspace.

The product is not a table browser and not a clone of Quiver Quantitative. Quiver is a useful reference for presenting alternative data, but ThesisLens should be a deeper interpretation layer over FMP Premium data: it helps investors understand what changed, why it matters, and what questions they should answer before forming an investment thesis.

Core product promise:

> ThesisLens helps serious investors move from scattered market data to evidence-backed investment theses.

Positioning:

- For individual investors and small research teams focused on U.S. equities.
- Combines company fundamentals, valuation, analyst expectations, events, filings, news, insider/congressional activity, technical context, and peer comparison.
- Uses AI to summarize and explain evidence, not to make unsupported buy/sell predictions.

## 2. Background and Rationale

FMP Premium provides a broad U.S. equity data foundation:

- Real-time market data.
- Up to 30 years of historical data.
- Full fundamentals and ratios.
- Intraday charts.
- Technical indicators.
- Corporate calendars.
- Custom DCF calculator.
- Company profiles, financial statements, key metrics, ratios, financial scores, owner earnings, enterprise value, analyst estimates, price targets, ratings, news, SEC filings, insider trades, and congressional trades.

FMP Ultimate appears to add capabilities such as earnings call transcripts, ETF and mutual fund holdings, 13F institutional holdings, 1-minute intraday charting, full historical access, and bulk/batch delivery. ThesisLens MVP should be designed around Premium-confirmed capabilities, while keeping a future upgrade path for Ultimate-only datasets.

The opportunity is that most finance websites expose data as disconnected pages:

- A quote page.
- A financials page.
- A news page.
- A ratings page.
- A filings page.
- A chart page.

The investor still has to synthesize everything manually. ThesisLens should perform this synthesis and make the reasoning inspectable.

## 3. Product Principles

1. Evidence before opinion

   Every generated insight must be traceable to one or more structured data points, source documents, or time-stamped events.

2. Explain change, not just state

   Static values are less useful than deltas. The product should emphasize what changed in the last 24 hours, 7 days, quarter, year, and over multi-year periods.

3. Separate signal from noise

   News and events should be ranked by potential investment relevance, not displayed chronologically only.

4. Build a thesis, not a recommendation

   ThesisLens should help users reason about quality, valuation, expectations, risk, and catalysts. It should not present itself as financial advice or a price-prediction engine.

5. Make uncertainty visible

   Data staleness, missing endpoints, inferred metrics, and AI confidence should be visible.

6. U.S. equities first

   Even if FMP supports global datasets, the product should focus on U.S. stocks for the initial product to reduce data complexity and increase depth.

## 4. Target Users

### 4.1 Primary Persona: Serious Individual Investor

Profile:

- Invests in U.S. stocks.
- Reads financial statements, earnings reports, analyst estimates, and news.
- Wants faster synthesis without losing evidence.
- May maintain a watchlist of 20-100 companies.

Needs:

- Understand whether a company is high quality.
- See if valuation is stretched or attractive relative to history and peers.
- Know what changed recently.
- Identify upcoming catalysts and risks.
- Compare a company against peers.
- Generate a research memo quickly.

### 4.2 Secondary Persona: Small Fund / Research Team Analyst

Profile:

- Covers a sector or set of U.S. equities.
- Needs repeatable research workflows.
- Wants screeners, alerts, and watchlist-level summaries.

Needs:

- Batch review watchlist changes.
- Identify unusual events and revisions.
- Export or save investment memos.
- Compare several stocks on the same framework.

### 4.3 Tertiary Persona: Advanced Retail Trader

Profile:

- Uses fundamentals, catalysts, and technical context.
- Focuses on shorter time windows around earnings, news, and price moves.

Needs:

- Event calendar.
- Price/news/technical interaction.
- Insider/congressional activity.
- Momentum and risk context.

## 5. Problem Statements

1. Investors can find data, but it is hard to understand what matters.

2. Company research requires too many disconnected tabs.

3. Financial metrics are often presented without history, peer context, or implication.

4. AI finance tools often provide vague commentary without data grounding.

5. Screeners usually filter metrics but do not explain why a result is interesting.

6. Watchlists often show price moves but not fundamental, estimate, filing, or event changes.

## 6. Product Goals

### 6.1 MVP Goals

- Build a powerful U.S. stock research page that synthesizes FMP Premium datasets into a coherent investment view.
- Provide an evidence-backed AI investment memo for each stock.
- Allow users to search U.S. stocks and inspect company quality, valuation, expectations, events, behavior signals, technical context, and peer position.
- Create enough structure to later add watchlists, alerts, and screeners without redesigning the data model.

### 6.2 Long-Term Goals

- Become a daily research workspace for U.S. equity investors.
- Provide watchlist-level "what changed" briefings.
- Provide thesis tracking over time.
- Provide explainable screeners based on quality, valuation, revision, event, and behavior signals.
- Add portfolio-level exposure and risk analysis.
- Add Ultimate-only datasets if upgraded, such as 13F, ETF holdings, and earnings call transcripts.

## 7. Non-Goals

For MVP, ThesisLens will not:

- Provide direct buy/sell/hold investment advice.
- Execute trades or connect brokerages.
- Cover all global equities.
- Build a social network.
- Build a real-time trading terminal.
- Depend on FMP Ultimate-only datasets.
- Guarantee complete institutional ownership coverage unless FMP access is validated.
- Redistribute raw FMP datasets as downloadable datasets.

## 8. Data Scope

### 8.1 Primary FMP Data Domains for MVP

1. Search and directory

   - Stock symbol search.
   - Company name search.
   - CIK/CUSIP/ISIN search.
   - Company screener.
   - Stock list.
   - Available exchanges/sectors/industries/countries.

2. Company information

   - Profile.
   - Profile by CIK.
   - Company notes.
   - Peer comparison.
   - Delisted companies.
   - Employee count and historical employee count.
   - Market cap, batch market cap, historical market cap.
   - Share float and all shares float.
   - Mergers and acquisitions.
   - Executives.
   - Executive compensation and benchmark.

3. Financial statements and fundamentals

   - Income statement.
   - Balance sheet.
   - Cash flow statement.
   - Latest financial statements.
   - TTM statements.
   - Key metrics.
   - Financial ratios.
   - TTM key metrics and ratios.
   - Financial scores.
   - Owner earnings.
   - Enterprise values.
   - Income, balance sheet, cash flow, and full statement growth.
   - Financial report dates.
   - 10-K JSON/XLSX.
   - Revenue product segmentation.
   - Revenue geographic segmentation.
   - As-reported statements.

4. Market data and charts

   - Quote.
   - Quote short.
   - Batch quote.
   - Exchange quotes.
   - Aftermarket trade and quote.
   - Price change.
   - Historical EOD light/full.
   - Intraday chart intervals supported by Premium access.
   - Technical indicators: SMA, EMA, WMA, DEMA, TEMA, RSI, standard deviation, Williams, ADX.

5. Analyst and valuation

   - Analyst estimates.
   - Ratings snapshot.
   - Historical ratings.
   - Price target summary.
   - Price target consensus.
   - Stock grades.
   - Historical stock grades.
   - Grades consensus.
   - DCF valuation.
   - Levered DCF.
   - Custom DCF endpoints if available under Premium.

6. Events and news

   - Earnings report.
   - Earnings calendar.
   - Dividends and dividends calendar.
   - Splits and splits calendar.
   - IPO calendar/disclosures/prospectus.
   - FMP articles.
   - General news.
   - Stock news.
   - Press releases and press release search.

7. SEC filings and classifications

   - Latest 8-K.
   - Latest SEC filings.
   - Filings by form type.
   - Filings by symbol.
   - Filings by CIK.
   - Filings by name.
   - Company search by symbol/CIK.
   - SEC company full profile.
   - SIC/industry classification.

8. Insider and congressional activity

   - Latest insider trading.
   - Search insider trades.
   - Search by reporting name.
   - Transaction types.
   - Insider statistics.
   - Acquisition ownership.
   - Latest Senate disclosures.
   - Latest House disclosures.
   - Senate trades by symbol/name.
   - House trades by symbol/name.

9. Market and macro context

   - Index quotes and constituents.
   - S&P 500, Nasdaq, Dow constituents and historical constituents.
   - Sector and industry performance.
   - Sector and industry PE.
   - Biggest gainers, biggest losers, most active stocks.
   - Treasury rates.
   - Economic indicators.
   - Economic calendar.
   - Market risk premium.

### 8.2 Future / Validate Later

These exist in FMP docs but should be treated as access-gated until tested:

- Earnings call transcripts.
- 13F institutional ownership.
- ETF and mutual fund holdings.
- 1-minute intraday charting.
- Bulk and batch endpoints.
- Full historical access beyond Premium boundaries.

## 9. Core Product Concepts

### 9.1 Company Research Workspace

The company page is the central product surface. It should answer:

- What is this company?
- What changed recently?
- Is the business high quality?
- Is valuation attractive or stretched?
- Are expectations improving or deteriorating?
- What are the near-term catalysts and risks?
- What are insiders and politicians doing?
- How does it compare to peers and industry?
- What should I investigate next?

### 9.2 Signal Cards

A signal card is a compact, evidence-backed insight.

Example:

- Title: "Analyst EPS estimates revised upward"
- Category: Expectations
- Severity: Medium positive
- Evidence:
  - FY2026 EPS estimate increased 6.2% over 30 days.
  - Price target consensus increased from $X to $Y.
- Interpretation:
  - The market may be repricing future earnings power.
- Follow-up:
  - Check whether revenue estimates rose too or only margin assumptions changed.

### 9.3 AI Investment Memo

The memo is generated from curated structured facts and recent events. It should include:

- Business summary.
- Current setup.
- Quality assessment.
- Growth assessment.
- Valuation assessment.
- Expectations and analyst revisions.
- Catalysts and event calendar.
- Risk factors from filings/news.
- Insider/congressional activity.
- Bull case.
- Bear case.
- Key questions to answer.
- Evidence table.

The AI must not invent data. It receives a normalized facts payload and should cite each claim to a data point.

### 9.4 What Changed Feed

A chronological and ranked feed of meaningful changes for a stock or watchlist.

Possible events:

- Price moved outside historical volatility range.
- Earnings date approaching.
- EPS/revenue estimates changed.
- New price target consensus.
- New analyst grade.
- New 8-K/10-K/10-Q filing.
- Press release published.
- Insider purchase/sale filed.
- Senate/House trade disclosed.
- Technical signal changed.
- Valuation percentile crossed a threshold.

### 9.5 Explainable Scoring

Scores should be decomposed into visible components. A user should never see only "Quality: 82" without knowing why.

Initial score families:

- Quality score.
- Growth score.
- Profitability score.
- Balance sheet score.
- Cash flow score.
- Valuation score.
- Expectations score.
- Momentum/technical score.
- Event risk score.
- Behavior signal score.

## 10. MVP Feature Requirements

### 10.1 Stock Search

Requirements:

- Search by ticker or company name.
- Restrict initial results to U.S. listed equities where possible.
- Show ticker, company name, exchange, sector, industry, market cap.
- Navigate to company research page.

Acceptance criteria:

- User can search "AAPL" and "Apple".
- Results load in under 1 second when cached.
- Empty and error states are clear.

### 10.2 Company Header

Requirements:

- Show ticker, name, exchange, sector, industry, market cap, price, day change, volume.
- Show short company description.
- Show last refreshed timestamp.
- Show data availability flags.

Acceptance criteria:

- Header loads with profile and quote data.
- Missing data does not break page layout.

### 10.3 Today Conclusion Panel

Requirements:

- Display 3-5 most important current signals.
- Include signal direction, confidence, data source, and timestamp.
- Include a short AI-generated explanation.

Acceptance criteria:

- Each conclusion references evidence.
- Conclusions degrade gracefully if AI is unavailable.

### 10.4 Fundamental Quality Module

Requirements:

- Show multi-year revenue, gross margin, operating margin, net margin, ROIC/ROE where available, free cash flow, owner earnings, debt metrics, current ratio, share count trend.
- Show Piotroski and Altman where available through financial scores or computed metrics.
- Show quality score with component breakdown.

Acceptance criteria:

- User can see whether quality improved or deteriorated over 1Y, 3Y, 5Y.
- Score shows drivers and warnings.

### 10.5 Valuation Module

Requirements:

- Show current valuation multiples.
- Compare to company historical ranges.
- Compare to peer group and industry/sector where data is available.
- Show DCF/levered DCF data.
- Show valuation score and percentile.

Acceptance criteria:

- User can see whether valuation is cheap/fair/expensive relative to history and peers.
- DCF is presented as one input, not a definitive value.

### 10.6 Expectations Module

Requirements:

- Show analyst estimates for revenue and EPS.
- Show estimate revisions over available periods.
- Show price target summary/consensus.
- Show ratings and grades history.
- Generate "expectation trend" signal.

Acceptance criteria:

- User can understand whether expectations are rising, falling, or stable.
- Explain whether price has already moved in the same direction.

### 10.7 Events and News Module

Requirements:

- Show upcoming earnings/dividend/split events.
- Show recent press releases and stock news.
- Show recent SEC filings, especially 8-K, 10-K, 10-Q, S-1, DEF 14A, and forms with likely market relevance.
- Rank events by relevance.

Acceptance criteria:

- User sees upcoming events and recent filings in a unified timeline.
- Material events are visually distinct from routine news.

### 10.8 Insider and Congressional Module

Requirements:

- Show recent insider transactions.
- Show insider statistics when available.
- Show recent Senate/House trades by symbol.
- Show transaction type, date, value/amount range, person, role, and source link when available.

Acceptance criteria:

- User can distinguish routine sales from potentially meaningful purchases.
- Congressional data is labeled as delayed disclosure data, not real-time trading intent.

### 10.9 Technical Context Module

Requirements:

- Show price chart.
- Show moving averages, RSI, volatility, trend state, volume anomaly.
- Use FMP technical indicator endpoints where useful.
- Summarize technical context in plain language.

Acceptance criteria:

- Technical summary is secondary to thesis, not dominant.
- User can see if price action confirms or conflicts with fundamental signals.

### 10.10 Peer and Industry Module

Requirements:

- Show peers.
- Compare core valuation, growth, margin, profitability, leverage, and price performance.
- Show sector/industry performance and PE context.

Acceptance criteria:

- User can quickly see whether the company is an outlier.

### 10.11 AI Investment Memo

Requirements:

- Generate an evidence-backed memo.
- Memo must include bull case, bear case, risk factors, and key questions.
- Memo must show source evidence list.
- Memo must not claim certainty.

Acceptance criteria:

- AI output references structured facts.
- AI output can be regenerated after data refresh.
- If AI fails, page still works with deterministic modules.

## 11. Post-MVP Feature Requirements

### 11.1 Watchlist

- User can create and manage watchlists.
- Watchlist shows daily "what changed".
- Each stock has change badges for price, fundamentals, estimates, events, filings, insider/congress, and technicals.

### 11.2 Research Screens

Suggested screens:

- High quality pullbacks.
- Improving estimates, unchanged price.
- Insider buying with improving fundamentals.
- Cheap relative to history, stable fundamentals.
- Expensive but improving faster than peers.
- Earnings in next 14 days with high estimate dispersion.
- SEC event watch.
- Congressional activity watch.

### 11.3 Thesis Tracker

- User can save thesis notes.
- System tracks whether thesis drivers improve or deteriorate.
- AI periodically asks whether the thesis should be revised.

### 11.4 Portfolio View

- User can enter holdings manually.
- Show sector exposure, valuation exposure, quality distribution, event calendar, and risk concentrations.

### 11.5 Ultimate Data Expansion

If upgraded:

- 13F institutional ownership.
- ETF and mutual fund holder/exposure.
- Earnings call transcripts.
- Transcript AI analysis.
- Institutional buying/selling screens.

## 12. Page Information Architecture

### 12.1 Main Navigation

- Dashboard
- Search
- Watchlist
- Screens
- Market
- Calendar
- Settings

### 12.2 Dashboard

Sections:

- Market overview.
- Today's important market events.
- Watchlist changes.
- Interesting research candidates.
- Recent AI memos.

### 12.3 Company Page

Suggested tabs:

- Overview
- Fundamentals
- Valuation
- Expectations
- Events
- Insider & Congress
- Technicals
- Peers
- Filings
- AI Memo

Default Overview layout:

1. Header.
2. Today conclusion panel.
3. Score grid.
4. What changed timeline.
5. Valuation vs quality chart.
6. Upcoming catalysts.
7. AI memo preview.

## 13. Scoring Framework

### 13.1 Quality Score

Inputs:

- Revenue stability and growth.
- Gross/operating/net margin trend.
- ROE/ROIC/ROA.
- Free cash flow conversion.
- Owner earnings.
- Balance sheet leverage.
- Interest coverage if available.
- Current ratio.
- Share dilution/buybacks.
- Piotroski score.
- Altman Z-score.

Output:

- 0-100 score.
- Component explanations.
- Positive and negative drivers.

### 13.2 Valuation Score

Inputs:

- P/E, forward P/E if available, EV/EBITDA, P/S, P/B, FCF yield.
- DCF and levered DCF.
- Historical percentile over 5Y/10Y where data exists.
- Peer percentile.
- Industry and sector PE.
- Market risk premium and rates context.

Output:

- Cheap / fair / expensive label.
- 0-100 attractiveness score.
- "Cheap for a reason" warning if quality or expectations are deteriorating.

### 13.3 Expectations Score

Inputs:

- Revenue estimate revisions.
- EPS estimate revisions.
- Price target changes.
- Ratings/grades changes.
- Recent earnings surprise if available.
- Price response vs estimate revision.

Output:

- Improving / stable / deteriorating.
- Revision strength.
- Market reaction mismatch.

### 13.4 Event Risk Score

Inputs:

- Upcoming earnings date.
- Recent 8-K and material filings.
- Press release density.
- News sentiment proxy if implemented.
- Price volatility.
- Insider/congressional activity.

Output:

- Low / medium / high event risk.
- Top event drivers.

### 13.5 Behavior Signal Score

Inputs:

- Insider buys vs sells.
- Insider role and ownership type.
- Transaction value.
- Repetition across insiders.
- Senate/House trade activity.
- Acquisition ownership data.

Output:

- Constructive / neutral / caution.
- "Informational only" disclaimer.

## 14. AI Product Requirements

### 14.1 AI Grounding

The AI layer must receive a curated facts object, not raw unbounded web content.

Required fact types:

- Company metadata.
- Current quote.
- Historical returns.
- Financial metrics and changes.
- Valuation metrics and percentiles.
- Analyst estimates and revisions.
- News and press release summaries.
- SEC filing metadata.
- Insider/congressional transaction summaries.
- Peer comparison.
- Score drivers.

### 14.2 AI Output Rules

The AI must:

- Cite internal evidence IDs for important claims.
- Avoid buy/sell/hold recommendations.
- Clearly label uncertainty.
- Distinguish data facts from interpretation.
- Surface questions, not just conclusions.
- Keep summaries concise and actionable.

The AI must not:

- Fabricate missing metrics.
- Claim access to data not available.
- Predict future returns as certainty.
- Present investment advice.

### 14.3 AI Memo Structure

1. Executive snapshot.
2. What changed.
3. Business quality.
4. Growth and profitability.
5. Valuation.
6. Expectations.
7. Catalysts and risks.
8. Insider/congress activity.
9. Bull case.
10. Bear case.
11. Key questions.
12. Evidence list.

## 15. Monetization and Packaging

Potential tiers:

1. Free / Preview

   - Limited company pages.
   - Delayed refresh.
   - Limited AI memos.

2. Pro

   - Watchlists.
   - Full company research.
   - Daily change brief.
   - AI memos.
   - Screens.

3. Research

   - Larger watchlists.
   - More memo generation.
   - Export/share.
   - Portfolio view.

Important: Monetization must account for FMP licensing terms, especially data display and redistribution rules.

## 16. Metrics and Success Criteria

### 16.1 Product Metrics

- Search-to-company-page conversion.
- Company page dwell time.
- AI memo generation rate.
- Watchlist creation rate.
- Return visits per week.
- Number of saved theses.
- Screens used per session.

### 16.2 Quality Metrics

- Percentage of AI claims with evidence IDs.
- Data refresh success rate.
- API error rate.
- Median page load time.
- Cache hit rate.
- User feedback on memo usefulness.

### 16.3 MVP Success Criteria

The MVP is successful if:

- A user can research a stock in under 5 minutes and understand the main thesis drivers.
- AI memo is grounded and useful enough to save or revisit.
- Company page feels more insightful than a standard quote/news page.
- Core modules work for at least top 500 U.S. stocks.

## 17. Risks

1. Data licensing risk

   FMP may require a specific display or redistribution agreement.

2. API access uncertainty

   Some documented endpoints may require Ultimate or separate permissions.

3. AI hallucination risk

   Must enforce grounded generation and evidence references.

4. Over-scoring risk

   Users may over-trust scores. Scores must show drivers and limitations.

5. Data freshness risk

   Financial data, estimates, and filings update at different cadences.

6. Product complexity risk

   A full research terminal can become too broad. MVP must focus on company page first.

## 18. MVP Delivery Milestones

### Milestone 1: Data Foundation

- FMP client.
- Symbol search.
- Company profile/quote.
- Financial statements.
- Ratios/key metrics/scores.
- Basic caching.

### Milestone 2: Company Page v1

- Header.
- Fundamental quality.
- Valuation.
- Analyst expectations.
- News/events.
- Basic charts.

### Milestone 3: Signal Engine

- Score computation.
- What changed events.
- Evidence object model.
- Deterministic insight cards.

### Milestone 4: AI Memo

- Facts payload.
- AI memo prompt.
- Evidence citation.
- Memo persistence.

### Milestone 5: Insider/Congress and SEC Events

- Insider trades.
- Congressional trades.
- SEC filings.
- Event ranking.

### Milestone 6: Watchlist Preview

- Basic watchlist.
- Daily change feed.
- Alert-ready architecture.

## 19. Open Questions

1. Do we have a FMP API key ready for access validation?
2. Does current Premium access include 13F, ETF/MF holdings, earnings transcripts, or only docs visibility?
3. Will the site be private/internal at first or publicly launched?
4. Do we need user accounts in MVP?
5. Which AI provider and model tier should be used for memo generation?
6. Should memo generation happen on demand, in background, or both?
7. How much raw FMP data can be displayed under the current license?

