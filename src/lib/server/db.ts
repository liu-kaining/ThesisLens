import { createHash, randomBytes, randomUUID } from "crypto";
import { Pool } from "pg";
import {
  isDataModuleKey,
  moduleExpiresAt,
  type DataModuleKey
} from "@/lib/data-modules";
import { SYSTEM_UNIVERSES, type SystemUniverseId } from "@/lib/universes";
import type { EnrichedResearch, ResearchMemo } from "@/lib/types";

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

export type AccessCodeRecord = {
  id: string;
  codeHash: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
};

export type AccessCodePublicRecord = Omit<AccessCodeRecord, "codeHash"> & {
  active: boolean;
};

export type PersistedResearchSnapshotRecord = {
  symbol: string;
  research: EnrichedResearch;
  dataMode: string;
  completenessScore: number;
  refreshedAt: string;
  savedAt: string;
};

export type SystemUniverseRecord = {
  id: SystemUniverseId;
  name: string;
  description: string;
  sourceType: "index_constituents" | "etf_holdings";
  sourceSymbol?: string | null;
  priority: number;
  memberCount: number;
  activeCount: number;
  refreshedAt?: string | null;
  updatedAt: string;
};

export type SystemUniverseMemberRecord = {
  id: string;
  universeId: SystemUniverseId;
  symbol: string;
  name?: string | null;
  sector?: string | null;
  industry?: string | null;
  weight?: number | null;
  rank?: number | null;
  source?: string | null;
  active: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  removedAt?: string | null;
};

export type SystemUniverseMemberInput = {
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  weight?: number | null;
  rank?: number | null;
  source?: string;
  raw?: Record<string, unknown>;
};

export type CompanyDataModuleStateRecord = {
  symbol: string;
  moduleKey: DataModuleKey;
  status: "live" | "stale" | "unavailable" | "mock";
  refreshedAt?: string | null;
  expiresAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  attemptCount: number;
  updatedAt: string;
};

export type DataSyncJobRecord = {
  id: string;
  symbol: string;
  moduleKey: DataModuleKey;
  priority: number;
  source: string;
  status: "queued" | "running" | "completed" | "failed";
  scheduledFor: string;
  startedAt?: string | null;
  completedAt?: string | null;
  attempts: number;
  maxAttempts: number;
  lastError?: string | null;
  updatedAt: string;
};

const memoryWatchlist = new Map<string, WatchlistItemRecord>();
const memoryTheses = new Map<string, SavedThesisRecord>();
const memoryPortfolio = new Map<string, PortfolioHoldingRecord>();
const memoryAlerts = new Map<string, AlertRuleRecord>();

const memoryAccessCodes = new Map<string, AccessCodeRecord>();
const memoryResearchSnapshots = new Map<string, PersistedResearchSnapshotRecord>();
const memoryCompanyDataModules = new Map<string, CompanyDataModuleStateRecord>();
const memoryDataSyncJobs = new Map<string, DataSyncJobRecord>();
const memorySystemUniverses = new Map<SystemUniverseId, SystemUniverseRecord>();
const memorySystemUniverseMembers = new Map<SystemUniverseId, Map<string, SystemUniverseMemberRecord>>();

function hashAccessCode(code: string) {
  return createHash("sha256").update(code.trim()).digest("hex");
}

function generateAccessCode() {
  return randomBytes(6).toString("base64url").toUpperCase();
}

function publicAccessCode(record: AccessCodeRecord): AccessCodePublicRecord {
  const active = !record.revokedAt && new Date(record.expiresAt).getTime() > Date.now();
  return {
    id: record.id,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt ?? null,
    active
  };
}

function parseJsonValue<T>(value: unknown): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : (value as T);
}

function researchCompletenessScore(research: EnrichedResearch) {
  const modules = research.snapshot.dataStatus.modules ?? [];
  const liveModules = modules.filter((module) => module.status === "live").length;
  const populatedCollections = [
    research.snapshot.financials,
    research.snapshot.metrics,
    research.snapshot.analystEstimates,
    research.snapshot.news,
    research.snapshot.filings,
    research.snapshot.insiders,
    research.snapshot.congress,
    research.snapshot.technicals,
    research.snapshot.peers,
    research.snapshot.upcomingEvents,
    research.evidence,
    research.signals,
    research.scores
  ].filter((collection) => collection.length > 0).length;

  return liveModules * 10 + populatedCollections;
}

function ensureMemorySystemUniverseDefinitions() {
  const now = new Date().toISOString();
  for (const definition of SYSTEM_UNIVERSES) {
    const existing = memorySystemUniverses.get(definition.id);
    if (!existing) {
      memorySystemUniverses.set(definition.id, {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        sourceType: definition.sourceType,
        sourceSymbol: definition.sourceSymbol ?? null,
        priority: definition.priority,
        memberCount: 0,
        activeCount: 0,
        refreshedAt: null,
        updatedAt: now
      });
    }
  }
}

function normalizeUniverseSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function publicUniverseMember(
  universeId: SystemUniverseId,
  input: SystemUniverseMemberInput,
  now: string,
  existing?: SystemUniverseMemberRecord
): SystemUniverseMemberRecord {
  const symbol = normalizeUniverseSymbol(input.symbol);

  return {
    id: `${universeId}-${symbol}`,
    universeId,
    symbol,
    name: input.name?.trim() || null,
    sector: input.sector?.trim() || null,
    industry: input.industry?.trim() || null,
    weight: input.weight ?? null,
    rank: input.rank ?? null,
    source: input.source ?? null,
    active: true,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    removedAt: null
  };
}

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

        CREATE TABLE IF NOT EXISTS system_universes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          source_type TEXT NOT NULL,
          source_symbol TEXT,
          priority INTEGER NOT NULL DEFAULT 100,
          member_count INTEGER NOT NULL DEFAULT 0,
          active_count INTEGER NOT NULL DEFAULT 0,
          refreshed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS system_universe_members (
          id TEXT PRIMARY KEY,
          universe_id TEXT NOT NULL REFERENCES system_universes(id) ON DELETE CASCADE,
          symbol TEXT NOT NULL,
          name TEXT,
          sector TEXT,
          industry TEXT,
          weight NUMERIC,
          rank INTEGER,
          source TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          removed_at TIMESTAMPTZ,
          raw_json JSONB,
          UNIQUE (universe_id, symbol)
        );

        CREATE INDEX IF NOT EXISTS system_universe_members_universe_active_rank_idx
          ON system_universe_members (universe_id, active, rank);
        CREATE INDEX IF NOT EXISTS system_universe_members_symbol_idx
          ON system_universe_members (symbol);

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

        CREATE TABLE IF NOT EXISTS company_research_snapshots (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL UNIQUE,
          research_json JSONB NOT NULL,
          data_mode TEXT NOT NULL,
          completeness_score INTEGER NOT NULL DEFAULT 0,
          refreshed_at TIMESTAMPTZ NOT NULL,
          saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS company_research_snapshots_symbol_refreshed_idx
          ON company_research_snapshots (symbol, refreshed_at DESC);

        CREATE TABLE IF NOT EXISTS company_data_modules (
          symbol TEXT NOT NULL,
          module_key TEXT NOT NULL,
          status TEXT NOT NULL,
          refreshed_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          last_success_at TIMESTAMPTZ,
          last_error TEXT,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (symbol, module_key)
        );

        CREATE INDEX IF NOT EXISTS company_data_modules_expires_idx
          ON company_data_modules (expires_at, status);

        CREATE TABLE IF NOT EXISTS data_sync_jobs (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          module_key TEXT NOT NULL,
          priority INTEGER NOT NULL DEFAULT 50,
          source TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 5,
          last_error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (symbol, module_key)
        );

        CREATE INDEX IF NOT EXISTS data_sync_jobs_claim_idx
          ON data_sync_jobs (status, scheduled_for, priority DESC);

        CREATE TABLE IF NOT EXISTS access_codes (
          id TEXT PRIMARY KEY,
          code_hash TEXT NOT NULL UNIQUE,
          created_by TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS access_codes_active_idx
          ON access_codes (expires_at, revoked_at);
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
      for (const universe of SYSTEM_UNIVERSES) {
        await pg.query(
          `
          INSERT INTO system_universes (id, name, description, source_type, source_symbol, priority)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            source_type = EXCLUDED.source_type,
            source_symbol = EXCLUDED.source_symbol,
            priority = EXCLUDED.priority,
            updated_at = NOW()
          `,
          [
            universe.id,
            universe.name,
            universe.description,
            universe.sourceType,
            universe.sourceSymbol ?? null,
            universe.priority
          ]
        );
      }
      await pg.query(
        `
        DELETE FROM saved_theses
        WHERE id IN (
          'demo-thesis-msft',
          'demo-thesis-nvda',
          'memory-thesis-msft',
          'memory-thesis-nvda'
        );
        DELETE FROM portfolio_holdings
        WHERE id IN (
          'demo-holding-aapl',
          'demo-holding-msft',
          'memory-holding-aapl',
          'memory-holding-msft'
        );
        DELETE FROM alert_rules
        WHERE id IN (
          'demo-alert-msft-expectations',
          'demo-alert-nvda-valuation',
          'memory-alert-msft',
          'memory-alert-nvda'
        );
        `
      );

      return true;
    } catch {
      return false;
    }
  })();

  const ready = await schemaReady;
  if (!ready) schemaReady = null;
  return ready;
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
  } catch (error) {
    throw new Error("Failed to save watchlist item", { cause: error });
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
  } catch (error) {
    throw new Error("Failed to remove watchlist item", { cause: error });
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

export async function saveCompanyResearchSnapshot(
  research: EnrichedResearch
): Promise<PersistedResearchSnapshotRecord> {
  const symbol = research.snapshot.profile.symbol.trim().toUpperCase();
  const now = new Date().toISOString();
  const refreshedAt = research.snapshot.dataStatus.refreshedAt || now;
  const record: PersistedResearchSnapshotRecord = {
    symbol,
    research,
    dataMode: research.snapshot.dataStatus.mode,
    completenessScore: researchCompletenessScore(research),
    refreshedAt,
    savedAt: now
  };
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    memoryResearchSnapshots.set(symbol, record);
    await saveCompanyDataModuleStates(companyModuleStatesFromResearch(research));
    return record;
  }

  try {
    const rows = await pg.query<{ saved_at: Date }>(
      `
      INSERT INTO company_research_snapshots
        (id, symbol, research_json, data_mode, completeness_score, refreshed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (symbol)
      DO UPDATE SET
        research_json = EXCLUDED.research_json,
        data_mode = EXCLUDED.data_mode,
        completeness_score = EXCLUDED.completeness_score,
        refreshed_at = EXCLUDED.refreshed_at,
        saved_at = NOW(),
        updated_at = NOW()
      RETURNING saved_at
      `,
      [
        `company-research-${symbol}`,
        symbol,
        JSON.stringify(research),
        record.dataMode,
        record.completenessScore,
        refreshedAt
      ]
    );
    const savedRecord = {
      ...record,
      savedAt: rows.rows[0]?.saved_at?.toISOString() ?? now
    };
    await saveCompanyDataModuleStates(companyModuleStatesFromResearch(research));
    return savedRecord;
  } catch {
    memoryResearchSnapshots.set(symbol, record);
    await saveCompanyDataModuleStates(companyModuleStatesFromResearch(research));
    return record;
  }
}

function companyModuleStatesFromResearch(
  research: EnrichedResearch
): CompanyDataModuleStateRecord[] {
  const symbol = research.snapshot.profile.symbol.trim().toUpperCase();
  const now = new Date().toISOString();

  return (research.snapshot.dataStatus.modules ?? [])
    .filter((module) => isDataModuleKey(module.key))
    .map((module) => {
      const refreshedAt =
        module.refreshedAt ?? research.snapshot.dataStatus.refreshedAt ?? now;
      const successful = module.status === "live" || module.status === "mock";

      return {
        symbol,
        moduleKey: module.key,
        status: module.status,
        refreshedAt,
        expiresAt: module.expiresAt ?? moduleExpiresAt(module.key, refreshedAt),
        lastSuccessAt: successful ? refreshedAt : null,
        lastError:
          module.status === "stale" || module.status === "unavailable"
            ? module.detail
            : null,
        attemptCount: successful ? 0 : 1,
        updatedAt: now
      };
    });
}

export async function getCompanyResearchSnapshot(
  symbol: string
): Promise<PersistedResearchSnapshotRecord | null> {
  const normalized = symbol.trim().toUpperCase();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return memoryResearchSnapshots.get(normalized) ?? null;
  }

  try {
    const rows = await pg.query<{
      symbol: string;
      research_json: unknown;
      data_mode: string;
      completeness_score: number;
      refreshed_at: Date;
      saved_at: Date;
    }>(
      `
      SELECT symbol, research_json, data_mode, completeness_score, refreshed_at, saved_at
      FROM company_research_snapshots
      WHERE symbol = $1
      LIMIT 1
      `,
      [normalized]
    );
    const row = rows.rows[0];
    if (!row) return memoryResearchSnapshots.get(normalized) ?? null;

    return {
      symbol: row.symbol,
      research: parseJsonValue<EnrichedResearch>(row.research_json),
      dataMode: row.data_mode,
      completenessScore: Number(row.completeness_score),
      refreshedAt: row.refreshed_at.toISOString(),
      savedAt: row.saved_at.toISOString()
    };
  } catch {
    return memoryResearchSnapshots.get(normalized) ?? null;
  }
}

export async function getCompanyResearchSnapshotStats() {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return {
      count: memoryResearchSnapshots.size,
      latestSavedAt: Array.from(memoryResearchSnapshots.values()).sort((a, b) =>
        b.savedAt.localeCompare(a.savedAt)
      )[0]?.savedAt
    };
  }

  try {
    const rows = await pg.query<{
      count: string;
      latest_saved_at: Date | null;
    }>(
      `
      SELECT COUNT(*)::TEXT AS count, MAX(saved_at) AS latest_saved_at
      FROM company_research_snapshots
      `
    );
    const row = rows.rows[0];
    return {
      count: Number(row?.count ?? 0),
      latestSavedAt: row?.latest_saved_at?.toISOString()
    };
  } catch {
    return {
      count: memoryResearchSnapshots.size,
      latestSavedAt: undefined
    };
  }
}

export async function saveCompanyDataModuleStates(
  states: CompanyDataModuleStateRecord[]
) {
  if (!states.length) return;
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    for (const state of states) {
      memoryCompanyDataModules.set(`${state.symbol}:${state.moduleKey}`, state);
    }
    return;
  }

  try {
    for (const state of states) {
      await pg.query(
        `
        INSERT INTO company_data_modules
          (symbol, module_key, status, refreshed_at, expires_at, last_success_at,
           last_error, attempt_count, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (symbol, module_key)
        DO UPDATE SET
          status = EXCLUDED.status,
          refreshed_at = COALESCE(EXCLUDED.refreshed_at, company_data_modules.refreshed_at),
          expires_at = COALESCE(EXCLUDED.expires_at, company_data_modules.expires_at),
          last_success_at = COALESCE(EXCLUDED.last_success_at, company_data_modules.last_success_at),
          last_error = EXCLUDED.last_error,
          attempt_count = EXCLUDED.attempt_count,
          updated_at = NOW()
        `,
        [
          state.symbol,
          state.moduleKey,
          state.status,
          state.refreshedAt ?? null,
          state.expiresAt ?? null,
          state.lastSuccessAt ?? null,
          state.lastError ?? null,
          state.attemptCount
        ]
      );
    }
  } catch {
    for (const state of states) {
      memoryCompanyDataModules.set(`${state.symbol}:${state.moduleKey}`, state);
    }
  }
}

export async function getCompanyDataModuleStates(
  symbol: string
): Promise<CompanyDataModuleStateRecord[]> {
  const normalized = symbol.trim().toUpperCase();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memoryCompanyDataModules.values()).filter(
      (state) => state.symbol === normalized
    );
  }

  try {
    const rows = await pg.query<{
      symbol: string;
      module_key: DataModuleKey;
      status: CompanyDataModuleStateRecord["status"];
      refreshed_at: Date | null;
      expires_at: Date | null;
      last_success_at: Date | null;
      last_error: string | null;
      attempt_count: number;
      updated_at: Date;
    }>(
      `
      SELECT symbol, module_key, status, refreshed_at, expires_at, last_success_at,
        last_error, attempt_count, updated_at
      FROM company_data_modules
      WHERE symbol = $1
      ORDER BY module_key
      `,
      [normalized]
    );

    const persisted = rows.rows.map((row) => ({
      symbol: row.symbol,
      moduleKey: row.module_key,
      status: row.status,
      refreshedAt: row.refreshed_at?.toISOString() ?? null,
      expiresAt: row.expires_at?.toISOString() ?? null,
      lastSuccessAt: row.last_success_at?.toISOString() ?? null,
      lastError: row.last_error,
      attemptCount: Number(row.attempt_count),
      updatedAt: row.updated_at.toISOString()
    }));
    if (persisted.length > 0) return persisted;
    return Array.from(memoryCompanyDataModules.values()).filter(
      (state) => state.symbol === normalized
    );
  } catch {
    return Array.from(memoryCompanyDataModules.values()).filter(
      (state) => state.symbol === normalized
    );
  }
}

export async function enqueueDataSyncJobs(
  jobs: Array<{
    symbol: string;
    moduleKey: DataModuleKey;
    priority: number;
    source: string;
  }>
) {
  if (!jobs.length) return [];
  const now = new Date().toISOString();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    for (const job of jobs) {
      const symbol = job.symbol.trim().toUpperCase();
      const id = `${symbol}:${job.moduleKey}`;
      const existing = memoryDataSyncJobs.get(id);
      if (existing?.status === "running") continue;
      const failedCooldownActive =
        existing?.status === "failed" &&
        existing.attempts >= existing.maxAttempts &&
        Date.now() - new Date(existing.updatedAt).getTime() < 24 * 60 * 60 * 1000;
      if (failedCooldownActive) continue;
      if (
        existing?.status === "failed" &&
        new Date(existing.scheduledFor).getTime() > Date.now()
      ) {
        continue;
      }
      memoryDataSyncJobs.set(id, {
        id,
        symbol,
        moduleKey: job.moduleKey,
        priority: Math.max(existing?.priority ?? 0, job.priority),
        source: job.source,
        status: "queued",
        scheduledFor: now,
        attempts:
          existing?.status === "completed" ||
          (existing?.status === "failed" &&
            existing.attempts >= existing.maxAttempts &&
            Date.now() - new Date(existing.updatedAt).getTime() >=
              24 * 60 * 60 * 1000)
            ? 0
            : existing?.attempts ?? 0,
        maxAttempts: existing?.maxAttempts ?? 5,
        updatedAt: now
      });
    }
    return jobs;
  }

  try {
    for (const job of jobs) {
      const symbol = job.symbol.trim().toUpperCase();
      await pg.query(
        `
        INSERT INTO data_sync_jobs
          (id, symbol, module_key, priority, source, status, scheduled_for)
        VALUES ($1, $2, $3, $4, $5, 'queued', NOW())
        ON CONFLICT (symbol, module_key)
        DO UPDATE SET
          priority = GREATEST(data_sync_jobs.priority, EXCLUDED.priority),
          source = EXCLUDED.source,
          status = CASE
            WHEN data_sync_jobs.status = 'running' THEN 'running'
            WHEN data_sync_jobs.status = 'failed' AND data_sync_jobs.scheduled_for > NOW()
              THEN 'failed'
            WHEN data_sync_jobs.status = 'failed'
              AND data_sync_jobs.attempts >= data_sync_jobs.max_attempts
              AND data_sync_jobs.updated_at > NOW() - INTERVAL '24 hours'
              THEN 'failed'
            ELSE 'queued'
          END,
          scheduled_for = CASE
            WHEN data_sync_jobs.status = 'running' THEN data_sync_jobs.scheduled_for
            WHEN data_sync_jobs.status = 'failed' AND data_sync_jobs.scheduled_for > NOW()
              THEN data_sync_jobs.scheduled_for
            WHEN data_sync_jobs.status = 'failed'
              AND data_sync_jobs.attempts >= data_sync_jobs.max_attempts
              AND data_sync_jobs.updated_at > NOW() - INTERVAL '24 hours'
              THEN data_sync_jobs.scheduled_for
            ELSE NOW()
          END,
          attempts = CASE
            WHEN data_sync_jobs.status = 'completed' THEN 0
            WHEN data_sync_jobs.status = 'failed'
              AND data_sync_jobs.attempts >= data_sync_jobs.max_attempts
              AND data_sync_jobs.updated_at <= NOW() - INTERVAL '24 hours'
              THEN 0
            ELSE data_sync_jobs.attempts
          END,
          completed_at = NULL,
          updated_at = NOW()
        `,
        [`${symbol}:${job.moduleKey}`, symbol, job.moduleKey, job.priority, job.source]
      );
    }
  } catch (error) {
    throw new Error("Failed to enqueue data sync jobs", { cause: error });
  }

  return jobs;
}

export async function claimDataSyncJobs(limit = 30): Promise<DataSyncJobRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const now = new Date();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    const claimed = Array.from(memoryDataSyncJobs.values())
      .filter(
        (job) =>
          (job.status === "queued" || job.status === "failed") &&
          new Date(job.scheduledFor).getTime() <= now.getTime() &&
          job.attempts < job.maxAttempts
      )
      .sort(
        (a, b) =>
          b.priority - a.priority ||
          a.scheduledFor.localeCompare(b.scheduledFor)
      )
      .slice(0, safeLimit)
      .map((job) => ({
        ...job,
        status: "running" as const,
        startedAt: now.toISOString(),
        attempts: job.attempts + 1,
        updatedAt: now.toISOString()
      }));
    for (const job of claimed) memoryDataSyncJobs.set(job.id, job);
    return claimed;
  }

  try {
    const rows = await pg.query<{
      id: string;
      symbol: string;
      module_key: DataModuleKey;
      priority: number;
      source: string;
      status: DataSyncJobRecord["status"];
      scheduled_for: Date;
      started_at: Date | null;
      completed_at: Date | null;
      attempts: number;
      max_attempts: number;
      last_error: string | null;
      updated_at: Date;
    }>(
      `
      WITH candidates AS (
        SELECT id
        FROM data_sync_jobs
        WHERE (
          status IN ('queued', 'failed')
          AND scheduled_for <= NOW()
          AND attempts < max_attempts
        ) OR (
          status = 'running'
          AND started_at < NOW() - INTERVAL '15 minutes'
          AND attempts < max_attempts
        )
        ORDER BY priority DESC, scheduled_for ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $1
      )
      UPDATE data_sync_jobs AS jobs
      SET status = 'running',
          started_at = NOW(),
          attempts = jobs.attempts + 1,
          last_error = NULL,
          updated_at = NOW()
      FROM candidates
      WHERE jobs.id = candidates.id
      RETURNING jobs.*
      `,
      [safeLimit]
    );

    return rows.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      moduleKey: row.module_key,
      priority: Number(row.priority),
      source: row.source,
      status: row.status,
      scheduledFor: row.scheduled_for.toISOString(),
      startedAt: row.started_at?.toISOString() ?? null,
      completedAt: row.completed_at?.toISOString() ?? null,
      attempts: Number(row.attempts),
      maxAttempts: Number(row.max_attempts),
      lastError: row.last_error,
      updatedAt: row.updated_at.toISOString()
    }));
  } catch (error) {
    throw new Error("Failed to claim data sync jobs", { cause: error });
  }
}

export async function finishDataSyncJobs(
  jobs: DataSyncJobRecord[],
  result: { ok: boolean; error?: string }
) {
  if (!jobs.length) return;
  const now = new Date();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  for (const job of jobs) {
    const retryDelaySeconds = Math.min(3600, 60 * 2 ** Math.max(0, job.attempts - 1));
    const scheduledFor = new Date(now.getTime() + retryDelaySeconds * 1000);

    if (!pg) {
      memoryDataSyncJobs.set(job.id, {
        ...job,
        status: result.ok ? "completed" : "failed",
        completedAt: result.ok ? now.toISOString() : null,
        scheduledFor: result.ok ? job.scheduledFor : scheduledFor.toISOString(),
        attempts: result.ok ? 0 : job.attempts,
        lastError: result.ok ? null : result.error ?? "Unknown sync error",
        updatedAt: now.toISOString()
      });
      continue;
    }

    try {
      await pg.query(
        `
        UPDATE data_sync_jobs
        SET status = $2,
            completed_at = $3,
            scheduled_for = $4,
            last_error = $5,
            attempts = CASE WHEN $2 = 'completed' THEN 0 ELSE attempts END,
            updated_at = NOW()
        WHERE id = $1
        `,
        [
          job.id,
          result.ok ? "completed" : "failed",
          result.ok ? now : null,
          result.ok ? job.scheduledFor : scheduledFor,
          result.ok ? null : result.error ?? "Unknown sync error"
        ]
      );
    } catch (error) {
      throw new Error(`Failed to finish data sync job ${job.id}`, {
        cause: error
      });
    }
  }
}

export async function getDataSyncJobStats() {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    const jobs = Array.from(memoryDataSyncJobs.values());
    return {
      queued: jobs.filter((job) => job.status === "queued").length,
      running: jobs.filter((job) => job.status === "running").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      completed: jobs.filter((job) => job.status === "completed").length
    };
  }

  try {
    const rows = await pg.query<{ status: string; count: string }>(
      `
      SELECT status, COUNT(*)::TEXT AS count
      FROM data_sync_jobs
      GROUP BY status
      `
    );
    const counts = Object.fromEntries(
      rows.rows.map((row) => [row.status, Number(row.count)])
    );
    return {
      queued: counts.queued ?? 0,
      running: counts.running ?? 0,
      failed: counts.failed ?? 0,
      completed: counts.completed ?? 0
    };
  } catch {
    return { queued: 0, running: 0, failed: 0, completed: 0 };
  }
}

export async function getSystemUniverses(): Promise<SystemUniverseRecord[]> {
  ensureMemorySystemUniverseDefinitions();
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memorySystemUniverses.values()).sort((a, b) => a.priority - b.priority);
  }

  try {
    const rows = await pg.query<{
      id: SystemUniverseId;
      name: string;
      description: string | null;
      source_type: SystemUniverseRecord["sourceType"];
      source_symbol: string | null;
      priority: number;
      member_count: number;
      active_count: number;
      refreshed_at: Date | null;
      updated_at: Date;
    }>(
      `
      SELECT id, name, description, source_type, source_symbol, priority,
        member_count, active_count, refreshed_at, updated_at
      FROM system_universes
      ORDER BY priority ASC, name ASC
      `
    );

    return rows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      sourceType: row.source_type,
      sourceSymbol: row.source_symbol,
      priority: Number(row.priority),
      memberCount: Number(row.member_count),
      activeCount: Number(row.active_count),
      refreshedAt: row.refreshed_at?.toISOString() ?? null,
      updatedAt: row.updated_at.toISOString()
    }));
  } catch {
    return Array.from(memorySystemUniverses.values()).sort((a, b) => a.priority - b.priority);
  }
}

export async function getSystemUniverseMembers(
  universeId: SystemUniverseId,
  limit = 100,
  offset = 0
): Promise<SystemUniverseMemberRecord[]> {
  ensureMemorySystemUniverseDefinitions();
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memorySystemUniverseMembers.get(universeId)?.values() ?? [])
      .filter((member) => member.active)
      .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999) || a.symbol.localeCompare(b.symbol))
      .slice(safeOffset, safeOffset + safeLimit);
  }

  try {
    const rows = await pg.query<{
      id: string;
      universe_id: SystemUniverseId;
      symbol: string;
      name: string | null;
      sector: string | null;
      industry: string | null;
      weight: string | null;
      rank: number | null;
      source: string | null;
      active: boolean;
      first_seen_at: Date;
      last_seen_at: Date;
      removed_at: Date | null;
    }>(
      `
      SELECT id, universe_id, symbol, name, sector, industry, weight, rank, source,
        active, first_seen_at, last_seen_at, removed_at
      FROM system_universe_members
      WHERE universe_id = $1 AND active = TRUE
      ORDER BY COALESCE(rank, 999999) ASC, symbol ASC
      LIMIT $2 OFFSET $3
      `,
      [universeId, safeLimit, safeOffset]
    );

    return rows.rows.map((row) => ({
      id: row.id,
      universeId: row.universe_id,
      symbol: row.symbol,
      name: row.name,
      sector: row.sector,
      industry: row.industry,
      weight: row.weight === null ? null : Number(row.weight),
      rank: row.rank,
      source: row.source,
      active: row.active,
      firstSeenAt: row.first_seen_at.toISOString(),
      lastSeenAt: row.last_seen_at.toISOString(),
      removedAt: row.removed_at?.toISOString() ?? null
    }));
  } catch {
    return Array.from(memorySystemUniverseMembers.get(universeId)?.values() ?? [])
      .filter((member) => member.active)
      .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999) || a.symbol.localeCompare(b.symbol))
      .slice(safeOffset, safeOffset + safeLimit);
  }
}

export async function syncSystemUniverseMembers(
  universeId: SystemUniverseId,
  members: SystemUniverseMemberInput[]
): Promise<SystemUniverseRecord> {
  ensureMemorySystemUniverseDefinitions();
  const definition = SYSTEM_UNIVERSES.find((universe) => universe.id === universeId);
  if (!definition) throw new Error(`Unknown system universe: ${universeId}`);

  const now = new Date().toISOString();
  const deduped = Array.from(
    new Map(
      members
        .map((member) => ({ ...member, symbol: normalizeUniverseSymbol(member.symbol) }))
        .filter((member) => member.symbol && !member.symbol.includes("."))
        .map((member) => [member.symbol, member])
    ).values()
  );
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    const existingMembers = memorySystemUniverseMembers.get(universeId) ?? new Map<string, SystemUniverseMemberRecord>();
    const activeSymbols = new Set(deduped.map((member) => member.symbol));
    for (const [symbol, member] of existingMembers.entries()) {
      if (!activeSymbols.has(symbol) && member.active) {
        existingMembers.set(symbol, { ...member, active: false, removedAt: now });
      }
    }
    for (const member of deduped) {
      existingMembers.set(member.symbol, publicUniverseMember(universeId, member, now, existingMembers.get(member.symbol)));
    }
    memorySystemUniverseMembers.set(universeId, existingMembers);
    const universe: SystemUniverseRecord = {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      sourceType: definition.sourceType,
      sourceSymbol: definition.sourceSymbol ?? null,
      priority: definition.priority,
      memberCount: existingMembers.size,
      activeCount: deduped.length,
      refreshedAt: now,
      updatedAt: now
    };
    memorySystemUniverses.set(universeId, universe);
    return universe;
  }

  const client = await pg.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      INSERT INTO system_universes (id, name, description, source_type, source_symbol, priority, refreshed_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        source_type = EXCLUDED.source_type,
        source_symbol = EXCLUDED.source_symbol,
        priority = EXCLUDED.priority,
        refreshed_at = NOW(),
        updated_at = NOW()
      `,
      [
        definition.id,
        definition.name,
        definition.description,
        definition.sourceType,
        definition.sourceSymbol ?? null,
        definition.priority
      ]
    );
    await client.query(
      `
      UPDATE system_universe_members
      SET active = FALSE, removed_at = NOW()
      WHERE universe_id = $1 AND active = TRUE
      `,
      [universeId]
    );

    for (const member of deduped) {
      await client.query(
        `
        INSERT INTO system_universe_members
          (id, universe_id, symbol, name, sector, industry, weight, rank, source, active,
           first_seen_at, last_seen_at, removed_at, raw_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW(), NOW(), NULL, $10)
        ON CONFLICT (universe_id, symbol)
        DO UPDATE SET
          name = EXCLUDED.name,
          sector = EXCLUDED.sector,
          industry = EXCLUDED.industry,
          weight = EXCLUDED.weight,
          rank = EXCLUDED.rank,
          source = EXCLUDED.source,
          active = TRUE,
          last_seen_at = NOW(),
          removed_at = NULL,
          raw_json = EXCLUDED.raw_json
        `,
        [
          `${universeId}-${member.symbol}`,
          universeId,
          member.symbol,
          member.name?.trim() || null,
          member.sector?.trim() || null,
          member.industry?.trim() || null,
          member.weight ?? null,
          member.rank ?? null,
          member.source ?? null,
          member.raw ? JSON.stringify(member.raw) : null
        ]
      );
    }

    const counts = await client.query<{ member_count: number; active_count: number }>(
      `
      SELECT COUNT(*)::INTEGER AS member_count,
        COUNT(*) FILTER (WHERE active = TRUE)::INTEGER AS active_count
      FROM system_universe_members
      WHERE universe_id = $1
      `,
      [universeId]
    );
    const memberCount = Number(counts.rows[0]?.member_count ?? deduped.length);
    const activeCount = Number(counts.rows[0]?.active_count ?? deduped.length);
    await client.query(
      `
      UPDATE system_universes
      SET member_count = $2, active_count = $3, refreshed_at = NOW(), updated_at = NOW()
      WHERE id = $1
      `,
      [universeId, memberCount, activeCount]
    );
    await client.query("COMMIT");

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      sourceType: definition.sourceType,
      sourceSymbol: definition.sourceSymbol ?? null,
      priority: definition.priority,
      memberCount,
      activeCount,
      refreshedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createAccessCode(input: {
  ttlHours?: number;
  createdBy: string;
}): Promise<{ code: string; record: AccessCodePublicRecord }> {
  const ttlHours = clampAccessCodeTtl(input.ttlHours ?? 24);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  const code = generateAccessCode();
  const record: AccessCodeRecord = {
    id: randomUUID(),
    codeHash: hashAccessCode(code),
    createdBy: input.createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null
  };
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    const revokedAt = now.toISOString();
    for (const existing of memoryAccessCodes.values()) {
      if (!existing.revokedAt && new Date(existing.expiresAt).getTime() > now.getTime()) {
        existing.revokedAt = revokedAt;
      }
    }
    memoryAccessCodes.set(record.id, record);
    return { code, record: publicAccessCode(record) };
  }

  const client = await pg.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE access_codes SET revoked_at = NOW() WHERE revoked_at IS NULL AND expires_at > NOW()"
    );
    await client.query(
      `
      INSERT INTO access_codes (id, code_hash, created_by, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [record.id, record.codeHash, record.createdBy, record.expiresAt]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error("Failed to create access code", { cause: error });
  } finally {
    client.release();
  }

  return { code, record: publicAccessCode(record) };
}

export async function getAccessCodes(): Promise<AccessCodePublicRecord[]> {
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    return Array.from(memoryAccessCodes.values())
      .map(publicAccessCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
  }

  try {
    const rows = await pg.query<{
      id: string;
      created_by: string;
      created_at: Date;
      expires_at: Date;
      revoked_at: Date | null;
    }>(
      `
      SELECT id, created_by, created_at, expires_at, revoked_at
      FROM access_codes
      ORDER BY created_at DESC
      LIMIT 10
      `
    );

    return rows.rows.map((row) =>
      publicAccessCode({
        id: row.id,
        codeHash: "",
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString(),
        expiresAt: row.expires_at.toISOString(),
        revokedAt: row.revoked_at?.toISOString() ?? null
      })
    );
  } catch {
    return Array.from(memoryAccessCodes.values())
      .map(publicAccessCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
  }
}

export async function verifyAccessCode(code: string): Promise<AccessCodePublicRecord | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const codeHash = hashAccessCode(normalized);
  const ready = await ensureSchema();
  const pg = ready ? getPool() : null;

  if (!pg) {
    const match = Array.from(memoryAccessCodes.values()).find(
      (record) =>
        record.codeHash === codeHash &&
        !record.revokedAt &&
        new Date(record.expiresAt).getTime() > Date.now()
    );
    return match ? publicAccessCode(match) : null;
  }

  try {
    const rows = await pg.query<{
      id: string;
      created_by: string;
      created_at: Date;
      expires_at: Date;
      revoked_at: Date | null;
    }>(
      `
      SELECT id, created_by, created_at, expires_at, revoked_at
      FROM access_codes
      WHERE code_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [codeHash]
    );
    const row = rows.rows[0];
    if (!row) return null;
    return publicAccessCode({
      id: row.id,
      codeHash,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
      revokedAt: row.revoked_at?.toISOString() ?? null
    });
  } catch (error) {
    throw new Error("Failed to verify access code", { cause: error });
  }
}

function clampAccessCodeTtl(ttlHours: number) {
  if (!Number.isFinite(ttlHours)) return 24;
  return Math.max(1, Math.min(168, Math.round(ttlHours)));
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
  } catch (error) {
    throw new Error("Failed to save thesis", { cause: error });
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
  } catch (error) {
    throw new Error("Failed to delete thesis", { cause: error });
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
  } catch (error) {
    throw new Error("Failed to save portfolio holding", { cause: error });
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
  } catch (error) {
    throw new Error("Failed to delete portfolio holding", { cause: error });
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
  } catch (error) {
    throw new Error("Failed to save alert rule", { cause: error });
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
  } catch (error) {
    throw new Error("Failed to delete alert rule", { cause: error });
  }

  return getAlertRules();
}
