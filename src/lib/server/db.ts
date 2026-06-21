import { randomUUID } from "crypto";
import { Pool } from "pg";
import type { ResearchMemo } from "@/lib/types";

const DEMO_USER_ID = "demo-user";
const DEMO_WATCHLIST_ID = "demo-watchlist";

export type WatchlistItemRecord = {
  id: string;
  symbol: string;
  notes?: string | null;
  createdAt: string;
};

export type WatchlistRecord = {
  id: string;
  name: string;
  items: WatchlistItemRecord[];
};

export type SavedThesisRecord = {
  id: string;
  symbol: string;
  title: string;
  thesisText: string;
  status: "active" | "watching" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type PortfolioHoldingRecord = {
  id: string;
  symbol: string;
  shares: number;
  averageCost?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertRuleRecord = {
  id: string;
  symbol: string;
  alertType: "quality_score" | "valuation_score" | "expectations_score" | "price_move" | "event_risk";
  threshold?: number | null;
  direction: "above" | "below" | "any";
  note?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const memoryWatchlist = new Map<string, WatchlistItemRecord>([
  [
    "AAPL",
    {
      id: "memory-aapl",
      symbol: "AAPL",
      notes: "Quality and capital return anchor.",
      createdAt: new Date().toISOString()
    }
  ],
  [
    "MSFT",
    {
      id: "memory-msft",
      symbol: "MSFT",
      notes: "AI/cloud estimate revision monitor.",
      createdAt: new Date().toISOString()
    }
  ],
  [
    "NVDA",
    {
      id: "memory-nvda",
      symbol: "NVDA",
      notes: "Exceptional growth with valuation sensitivity.",
      createdAt: new Date().toISOString()
    }
  ]
]);

const memoryTheses = new Map<string, SavedThesisRecord>([
  [
    "memory-thesis-msft",
    {
      id: "memory-thesis-msft",
      symbol: "MSFT",
      title: "AI cloud operating leverage",
      thesisText:
        "Monitor whether Azure and AI infrastructure growth converts into durable margin expansion without valuation overreach.",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    "memory-thesis-nvda",
    {
      id: "memory-thesis-nvda",
      symbol: "NVDA",
      title: "Demand durability vs valuation",
      thesisText:
        "The thesis depends on whether AI accelerator demand remains strong enough to defend elevated expectations.",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

const memoryPortfolio = new Map<string, PortfolioHoldingRecord>([
  [
    "AAPL",
    {
      id: "memory-holding-aapl",
      symbol: "AAPL",
      shares: 12,
      averageCost: 172.5,
      notes: "Core quality exposure",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    "MSFT",
    {
      id: "memory-holding-msft",
      symbol: "MSFT",
      shares: 8,
      averageCost: 405,
      notes: "Cloud/AI compounder",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

const memoryAlerts = new Map<string, AlertRuleRecord>([
  [
    "memory-alert-msft",
    {
      id: "memory-alert-msft",
      symbol: "MSFT",
      alertType: "expectations_score",
      threshold: 70,
      direction: "above",
      note: "Notify when expectation momentum becomes very strong.",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    "memory-alert-nvda",
    {
      id: "memory-alert-nvda",
      symbol: "NVDA",
      alertType: "valuation_score",
      threshold: 45,
      direction: "below",
      note: "Watch for valuation stress.",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

let pool: Pool | null = null;
let schemaReady: Promise<boolean> | null = null;

function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL) && process.env.DATABASE_DISABLED !== "true";
}

function getPool() {
  if (!isDatabaseEnabled()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
      connectionTimeoutMillis: 800,
      idleTimeoutMillis: 10_000
    });
  }
  return pool;
}

async function ensureSchema() {
  if (!isDatabaseEnabled()) return false;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const pg = getPool();
    if (!pg) return false;

    try {
      await pg.query(`
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

        CREATE TABLE IF NOT EXISTS research_memos (
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
      `);

      await pg.query(
        `
        INSERT INTO users (id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
        `,
        [DEMO_USER_ID, "demo@thesislens.local", "Demo Investor"]
      );
      await pg.query(
        `
        INSERT INTO watchlists (id, user_id, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
        `,
        [DEMO_WATCHLIST_ID, DEMO_USER_ID, "Core Research"]
      );
      for (const item of memoryWatchlist.values()) {
        await pg.query(
          `
          INSERT INTO watchlist_items (id, watchlist_id, symbol, notes)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (watchlist_id, symbol) DO NOTHING
          `,
          [item.id, DEMO_WATCHLIST_ID, item.symbol, item.notes ?? null]
        );
      }
      for (const thesis of memoryTheses.values()) {
        await pg.query(
          `
          INSERT INTO saved_theses (id, user_id, symbol, title, thesis_text, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
          `,
          [thesis.id, DEMO_USER_ID, thesis.symbol, thesis.title, thesis.thesisText, thesis.status]
        );
      }
      for (const holding of memoryPortfolio.values()) {
        await pg.query(
          `
          INSERT INTO portfolio_holdings (id, user_id, symbol, shares, average_cost, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, symbol) DO NOTHING
          `,
          [
            holding.id,
            DEMO_USER_ID,
            holding.symbol,
            holding.shares,
            holding.averageCost ?? null,
            holding.notes ?? null
          ]
        );
      }
      for (const alert of memoryAlerts.values()) {
        await pg.query(
          `
          INSERT INTO alert_rules (id, user_id, symbol, alert_type, threshold, direction, note, enabled)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
          `,
          [
            alert.id,
            DEMO_USER_ID,
            alert.symbol,
            alert.alertType,
            alert.threshold ?? null,
            alert.direction,
            alert.note ?? null,
            alert.enabled
          ]
        );
      }

      return true;
    } catch {
      return false;
    }
  })();

  return schemaReady;
}

export async function getDatabaseHealth() {
  const pg = getPool();
  if (!pg) {
    return {
      enabled: false,
      connected: false,
      mode: "memory"
    };
  }

  try {
    await pg.query("SELECT 1");
    return {
      enabled: true,
      connected: true,
      mode: "postgres"
    };
  } catch (error) {
    return {
      enabled: true,
      connected: false,
      mode: "memory",
      error: error instanceof Error ? error.message : "Unknown database error"
    };
  }
}

export async function getWatchlist(): Promise<WatchlistRecord> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return {
      id: "memory-watchlist",
      name: "Core Research",
      items: Array.from(memoryWatchlist.values())
    };
  }

  try {
    const rows = await pg.query<{
      id: string;
      name: string;
      item_id: string | null;
      symbol: string | null;
      notes: string | null;
      item_created_at: Date | null;
    }>(
      `
      SELECT
        w.id,
        w.name,
        wi.id AS item_id,
        wi.symbol,
        wi.notes,
        wi.created_at AS item_created_at
      FROM watchlists w
      LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.id
      WHERE w.id = $1
      ORDER BY wi.created_at ASC
      `,
      [DEMO_WATCHLIST_ID]
    );

    return {
      id: rows.rows[0]?.id ?? DEMO_WATCHLIST_ID,
      name: rows.rows[0]?.name ?? "Core Research",
      items: rows.rows
        .filter((row) => row.item_id && row.symbol)
        .map((row) => ({
          id: row.item_id as string,
          symbol: row.symbol as string,
          notes: row.notes,
          createdAt: (row.item_created_at ?? new Date()).toISOString()
        }))
    };
  } catch {
    return {
      id: "memory-watchlist",
      name: "Core Research",
      items: Array.from(memoryWatchlist.values())
    };
  }
}

export async function addWatchlistItem(symbol: string, notes?: string): Promise<WatchlistRecord> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized || normalized.length > 12) return getWatchlist();

  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;
  const item: WatchlistItemRecord = {
    id: randomUUID(),
    symbol: normalized,
    notes: notes?.trim() || null,
    createdAt: new Date().toISOString()
  };

  if (!pg) {
    memoryWatchlist.set(normalized, item);
    return getWatchlist();
  }

  try {
    await pg.query(
      `
      INSERT INTO watchlist_items (id, watchlist_id, symbol, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (watchlist_id, symbol)
      DO UPDATE SET notes = EXCLUDED.notes
      `,
      [item.id, DEMO_WATCHLIST_ID, item.symbol, item.notes ?? null]
    );
  } catch {
    memoryWatchlist.set(normalized, item);
  }

  return getWatchlist();
}

export async function removeWatchlistItem(symbol: string): Promise<WatchlistRecord> {
  const normalized = symbol.trim().toUpperCase();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryWatchlist.delete(normalized);
    return getWatchlist();
  }

  try {
    await pg.query("DELETE FROM watchlist_items WHERE watchlist_id = $1 AND symbol = $2", [
      DEMO_WATCHLIST_ID,
      normalized
    ]);
  } catch {
    memoryWatchlist.delete(normalized);
  }

  return getWatchlist();
}

export async function saveResearchMemo(memo: ResearchMemo) {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;
  if (!pg) return;

  try {
    await pg.query(
      `
      INSERT INTO research_memos (id, symbol, model, facts_hash, memo_json, evidence_ids, generated_at, created_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        `${memo.symbol}-${memo.factsHash}`,
        memo.symbol,
        memo.model,
        memo.factsHash,
        JSON.stringify(memo),
        JSON.stringify(memo.evidenceIds),
        memo.generatedAt,
        DEMO_USER_ID
      ]
    );
  } catch {
    // Persistence should never block research rendering.
  }
}

export async function getSavedTheses(): Promise<SavedThesisRecord[]> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memoryTheses.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  try {
    const rows = await pg.query<{
      id: string;
      symbol: string;
      title: string;
      thesis_text: string;
      status: SavedThesisRecord["status"];
      created_at: Date;
      updated_at: Date;
    }>(
      `
      SELECT id, symbol, title, thesis_text, status, created_at, updated_at
      FROM saved_theses
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
      [DEMO_USER_ID]
    );

    return rows.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      title: row.title,
      thesisText: row.thesis_text,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
  } catch {
    return Array.from(memoryTheses.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export async function addSavedThesis(input: {
  symbol: string;
  title: string;
  thesisText: string;
  status?: SavedThesisRecord["status"];
}): Promise<SavedThesisRecord[]> {
  const symbol = input.symbol.trim().toUpperCase();
  const title = input.title.trim();
  const thesisText = input.thesisText.trim();
  const status = input.status ?? "active";

  if (!symbol || !title || !thesisText) return getSavedTheses();

  const thesis: SavedThesisRecord = {
    id: randomUUID(),
    symbol,
    title,
    thesisText,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryTheses.set(thesis.id, thesis);
    return getSavedTheses();
  }

  try {
    await pg.query(
      `
      INSERT INTO saved_theses (id, user_id, symbol, title, thesis_text, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [thesis.id, DEMO_USER_ID, thesis.symbol, thesis.title, thesis.thesisText, thesis.status]
    );
  } catch {
    memoryTheses.set(thesis.id, thesis);
  }

  return getSavedTheses();
}

export async function deleteSavedThesis(id: string): Promise<SavedThesisRecord[]> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryTheses.delete(id);
    return getSavedTheses();
  }

  try {
    await pg.query("DELETE FROM saved_theses WHERE id = $1 AND user_id = $2", [id, DEMO_USER_ID]);
  } catch {
    memoryTheses.delete(id);
  }

  return getSavedTheses();
}

export async function getPortfolioHoldings(): Promise<PortfolioHoldingRecord[]> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memoryPortfolio.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  try {
    const rows = await pg.query<{
      id: string;
      symbol: string;
      shares: string;
      average_cost: string | null;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `
      SELECT id, symbol, shares, average_cost, notes, created_at, updated_at
      FROM portfolio_holdings
      WHERE user_id = $1
      ORDER BY symbol ASC
      `,
      [DEMO_USER_ID]
    );

    return rows.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      shares: Number(row.shares),
      averageCost: row.average_cost === null ? null : Number(row.average_cost),
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
  } catch {
    return Array.from(memoryPortfolio.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
}

export async function upsertPortfolioHolding(input: {
  symbol: string;
  shares: number;
  averageCost?: number | null;
  notes?: string;
}): Promise<PortfolioHoldingRecord[]> {
  const symbol = input.symbol.trim().toUpperCase();
  const shares = Number(input.shares);
  if (!symbol || !Number.isFinite(shares) || shares <= 0) return getPortfolioHoldings();

  const holding: PortfolioHoldingRecord = {
    id: randomUUID(),
    symbol,
    shares,
    averageCost:
      input.averageCost === undefined || input.averageCost === null || Number.isNaN(input.averageCost)
        ? null
        : Number(input.averageCost),
    notes: input.notes?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryPortfolio.set(symbol, holding);
    return getPortfolioHoldings();
  }

  try {
    await pg.query(
      `
      INSERT INTO portfolio_holdings (id, user_id, symbol, shares, average_cost, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, symbol)
      DO UPDATE SET shares = EXCLUDED.shares, average_cost = EXCLUDED.average_cost, notes = EXCLUDED.notes, updated_at = NOW()
      `,
      [holding.id, DEMO_USER_ID, holding.symbol, holding.shares, holding.averageCost ?? null, holding.notes ?? null]
    );
  } catch {
    memoryPortfolio.set(symbol, holding);
  }

  return getPortfolioHoldings();
}

export async function deletePortfolioHolding(symbol: string): Promise<PortfolioHoldingRecord[]> {
  const normalized = symbol.trim().toUpperCase();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryPortfolio.delete(normalized);
    return getPortfolioHoldings();
  }

  try {
    await pg.query("DELETE FROM portfolio_holdings WHERE user_id = $1 AND symbol = $2", [
      DEMO_USER_ID,
      normalized
    ]);
  } catch {
    memoryPortfolio.delete(normalized);
  }

  return getPortfolioHoldings();
}

export async function getAlertRules(): Promise<AlertRuleRecord[]> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memoryAlerts.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  try {
    const rows = await pg.query<{
      id: string;
      symbol: string;
      alert_type: AlertRuleRecord["alertType"];
      threshold: string | null;
      direction: AlertRuleRecord["direction"];
      note: string | null;
      enabled: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `
      SELECT id, symbol, alert_type, threshold, direction, note, enabled, created_at, updated_at
      FROM alert_rules
      WHERE user_id = $1
      ORDER BY symbol ASC, created_at DESC
      `,
      [DEMO_USER_ID]
    );

    return rows.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      alertType: row.alert_type,
      threshold: row.threshold === null ? null : Number(row.threshold),
      direction: row.direction,
      note: row.note,
      enabled: row.enabled,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
  } catch {
    return Array.from(memoryAlerts.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
}

export async function addAlertRule(input: {
  symbol: string;
  alertType: AlertRuleRecord["alertType"];
  threshold?: number | null;
  direction?: AlertRuleRecord["direction"];
  note?: string;
}): Promise<AlertRuleRecord[]> {
  const symbol = input.symbol.trim().toUpperCase();
  if (!symbol) return getAlertRules();

  const alert: AlertRuleRecord = {
    id: randomUUID(),
    symbol,
    alertType: input.alertType,
    threshold:
      input.threshold === undefined || input.threshold === null || Number.isNaN(Number(input.threshold))
        ? null
        : Number(input.threshold),
    direction: input.direction ?? "any",
    note: input.note?.trim() || null,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryAlerts.set(alert.id, alert);
    return getAlertRules();
  }

  try {
    await pg.query(
      `
      INSERT INTO alert_rules (id, user_id, symbol, alert_type, threshold, direction, note, enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        alert.id,
        DEMO_USER_ID,
        alert.symbol,
        alert.alertType,
        alert.threshold ?? null,
        alert.direction,
        alert.note ?? null,
        alert.enabled
      ]
    );
  } catch {
    memoryAlerts.set(alert.id, alert);
  }

  return getAlertRules();
}

export async function deleteAlertRule(id: string): Promise<AlertRuleRecord[]> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryAlerts.delete(id);
    return getAlertRules();
  }

  try {
    await pg.query("DELETE FROM alert_rules WHERE id = $1 AND user_id = $2", [id, DEMO_USER_ID]);
  } catch {
    memoryAlerts.delete(id);
  }

  return getAlertRules();
}
