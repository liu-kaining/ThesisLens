CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cik TEXT,
  exchange TEXT,
  sector TEXT,
  industry TEXT,
  country TEXT,
  currency TEXT,
  description TEXT,
  website TEXT,
  ceo TEXT,
  image_url TEXT,
  ipo_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS companies_name_idx ON companies (name);
CREATE INDEX IF NOT EXISTS companies_cik_idx ON companies (cik);
CREATE INDEX IF NOT EXISTS companies_sector_industry_idx ON companies (sector, industry);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC,
  change NUMERIC,
  change_percent NUMERIC,
  volume NUMERIC,
  market_cap NUMERIC,
  day_low NUMERIC,
  day_high NUMERIC,
  year_low NUMERIC,
  year_high NUMERIC,
  timestamp TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotes_symbol_fetched_at_idx ON quotes (symbol, fetched_at);

CREATE TABLE IF NOT EXISTS financial_statements (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  statement_type TEXT NOT NULL,
  period TEXT NOT NULL,
  fiscal_year INTEGER,
  fiscal_period TEXT,
  date DATE,
  reported_currency TEXT,
  data_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, statement_type, period, fiscal_year, fiscal_period)
);

CREATE TABLE IF NOT EXISTS metric_points (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  period TEXT,
  fiscal_year INTEGER,
  fiscal_period TEXT,
  date DATE,
  source TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS metric_points_symbol_metric_date_idx
  ON metric_points (symbol, metric_type, metric_name, date);

CREATE TABLE IF NOT EXISTS analyst_estimates (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  period TEXT,
  fiscal_year INTEGER,
  fiscal_period TEXT,
  data_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings_events (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  rating_type TEXT,
  rating TEXT,
  score NUMERIC,
  firm TEXT,
  action TEXT,
  date DATE,
  data_json JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_targets (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  target_high NUMERIC,
  target_low NUMERIC,
  target_mean NUMERIC,
  target_median NUMERIC,
  consensus NUMERIC,
  date DATE,
  data_json JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  symbol TEXT,
  title TEXT NOT NULL,
  publisher TEXT,
  published_at TIMESTAMPTZ,
  url TEXT,
  image_url TEXT,
  summary TEXT,
  raw_json JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sec_filings (
  id TEXT PRIMARY KEY,
  symbol TEXT,
  cik TEXT,
  form_type TEXT,
  filing_date DATE,
  accepted_date TIMESTAMPTZ,
  report_date DATE,
  title TEXT,
  url TEXT,
  raw_json JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insider_transactions (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  reporting_name TEXT,
  role TEXT,
  transaction_type TEXT,
  transaction_date DATE,
  filing_date DATE,
  shares NUMERIC,
  price NUMERIC,
  value NUMERIC,
  ownership_type TEXT,
  source_url TEXT,
  raw_json JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS congressional_transactions (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  chamber TEXT,
  representative_name TEXT,
  party TEXT,
  state TEXT,
  transaction_type TEXT,
  transaction_date DATE,
  filing_date DATE,
  amount_min NUMERIC,
  amount_max NUMERIC,
  asset_description TEXT,
  raw_json JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  source TEXT NOT NULL,
  label TEXT NOT NULL,
  value_string TEXT,
  value_number NUMERIC,
  unit TEXT,
  period TEXT,
  timestamp TIMESTAMPTZ,
  url TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  category TEXT NOT NULL,
  direction TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence NUMERIC,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  score NUMERIC,
  evidence_ids JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS company_scores (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  score_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  label TEXT NOT NULL,
  drivers_json JSONB NOT NULL,
  evidence_ids JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT PRIMARY KEY,
  watchlist_id TEXT NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (watchlist_id, symbol)
);

CREATE TABLE IF NOT EXISTS saved_theses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  title TEXT NOT NULL,
  thesis_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  shares NUMERIC NOT NULL,
  average_cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  threshold NUMERIC,
  direction TEXT NOT NULL DEFAULT 'any',
  note TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_memos (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  model TEXT NOT NULL,
  facts_hash TEXT NOT NULL,
  memo_json JSONB NOT NULL,
  evidence_ids JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, email, name)
VALUES ('demo-user', 'demo@thesislens.local', 'Demo Investor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO watchlists (id, user_id, name)
VALUES ('demo-watchlist', 'demo-user', 'Core Research')
ON CONFLICT (id) DO NOTHING;

INSERT INTO watchlist_items (id, watchlist_id, symbol, notes)
VALUES
  ('demo-watchlist-aapl', 'demo-watchlist', 'AAPL', 'Quality and capital return anchor.'),
  ('demo-watchlist-msft', 'demo-watchlist', 'MSFT', 'AI/cloud estimate revision monitor.'),
  ('demo-watchlist-nvda', 'demo-watchlist', 'NVDA', 'Exceptional growth with valuation sensitivity.')
ON CONFLICT (watchlist_id, symbol) DO NOTHING;

INSERT INTO saved_theses (id, user_id, symbol, title, thesis_text, status)
VALUES
  ('demo-thesis-msft', 'demo-user', 'MSFT', 'AI cloud operating leverage', 'Monitor whether Azure and AI infrastructure growth converts into durable margin expansion without valuation overreach.', 'active'),
  ('demo-thesis-nvda', 'demo-user', 'NVDA', 'Demand durability vs valuation', 'The thesis depends on whether AI accelerator demand remains strong enough to defend elevated expectations.', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO portfolio_holdings (id, user_id, symbol, shares, average_cost, notes)
VALUES
  ('demo-holding-aapl', 'demo-user', 'AAPL', 12, 172.50, 'Core quality exposure'),
  ('demo-holding-msft', 'demo-user', 'MSFT', 8, 405.00, 'Cloud/AI compounder')
ON CONFLICT (user_id, symbol) DO NOTHING;

INSERT INTO alert_rules (id, user_id, symbol, alert_type, threshold, direction, note)
VALUES
  ('demo-alert-msft-expectations', 'demo-user', 'MSFT', 'expectations_score', 70, 'above', 'Notify when expectation momentum becomes very strong.'),
  ('demo-alert-nvda-valuation', 'demo-user', 'NVDA', 'valuation_score', 45, 'below', 'Watch for valuation stress.')
ON CONFLICT (id) DO NOTHING;
