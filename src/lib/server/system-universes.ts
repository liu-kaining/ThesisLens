import { SYSTEM_UNIVERSES, getSystemUniverseDefinition, type SystemUniverseId } from "@/lib/universes";
import {
  getSystemUniverseMembers,
  getSystemUniverses,
  syncSystemUniverseMembers,
  type SystemUniverseMemberInput
} from "@/lib/server/db";
import { getFmpUniverseMembers } from "@/lib/server/fmp";

const MINIMUM_LIVE_UNIVERSE_MEMBERS: Record<SystemUniverseId, number> = {
  sp500: 350,
  qqq_holdings: 70,
  spy_holdings: 350,
  dowjones: 20,
  nasdaq: 70
};

export async function syncSystemUniverse(universeId: SystemUniverseId) {
  const definition = getSystemUniverseDefinition(universeId);
  if (!definition) throw new Error(`Unknown system universe: ${universeId}`);

  const members = await getFmpUniverseMembers(universeId);
  const universes = await getSystemUniverses();
  const previousCount =
    universes.find((universe) => universe.id === universeId)?.activeCount ?? 0;
  if (!isPlausibleSystemUniverseUpdate(universeId, members.length, previousCount)) {
    throw new Error(
      `Rejected implausible ${universeId} membership update: received ${members.length}, previous ${previousCount}`
    );
  }
  const inputs: SystemUniverseMemberInput[] = members.map((member) => ({
    symbol: member.symbol,
    name: member.name,
    sector: member.sector,
    industry: member.industry,
    weight: member.weight ?? null,
    rank: member.rank ?? null,
    source: member.source,
    raw: member.raw
  }));

  return syncSystemUniverseMembers(universeId, inputs);
}

export function isPlausibleSystemUniverseUpdate(
  universeId: SystemUniverseId,
  incomingCount: number,
  previousCount: number
) {
  if (process.env.FMP_USE_MOCKS === "true") return incomingCount > 0;
  if (incomingCount < MINIMUM_LIVE_UNIVERSE_MEMBERS[universeId]) return false;
  if (previousCount > 0 && incomingCount < previousCount * 0.6) return false;
  return true;
}

export async function syncAllSystemUniverses() {
  const results = [];

  for (const universe of SYSTEM_UNIVERSES) {
    try {
      const synced = await syncSystemUniverse(universe.id);
      results.push({
        id: universe.id,
        ok: true,
        activeCount: synced.activeCount,
        memberCount: synced.memberCount,
        refreshedAt: synced.refreshedAt
      });
    } catch (error) {
      results.push({
        id: universe.id,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown universe sync error"
      });
    }
  }

  return {
    ok: results.every((result) => result.ok),
    syncedAt: new Date().toISOString(),
    results
  };
}

export async function getSystemUniverseModel(memberLimit = 25) {
  const universes = await getSystemUniverses();
  const membersByUniverse = await Promise.all(
    universes.map(async (universe) => ({
      universeId: universe.id,
      members: await getSystemUniverseMembers(universe.id, memberLimit)
    }))
  );

  return {
    generatedAt: new Date().toISOString(),
    universes,
    membersByUniverse
  };
}

export async function getSystemUniversePage(
  universeId: SystemUniverseId,
  requestedPage = 1,
  requestedPageSize = 50
) {
  const pageSize = Math.max(1, Math.min(100, Math.floor(requestedPageSize)));
  const universes = await getSystemUniverses();
  const selectedUniverse =
    universes.find((universe) => universe.id === universeId) ??
    universes.find((universe) => universe.id === "sp500") ??
    universes[0];

  if (!selectedUniverse) {
    return {
      generatedAt: new Date().toISOString(),
      universes,
      selectedUniverse: null,
      members: [],
      pagination: {
        page: 1,
        pageSize,
        pageCount: 0,
        totalCount: 0,
        from: 0,
        to: 0
      }
    };
  }

  const totalCount = selectedUniverse.activeCount;
  const pageCount = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const page =
    pageCount === 0
      ? 1
      : Math.min(Math.max(1, Math.floor(requestedPage)), pageCount);
  const offset = (page - 1) * pageSize;
  const members = await getSystemUniverseMembers(selectedUniverse.id, pageSize, offset);

  return {
    generatedAt: new Date().toISOString(),
    universes,
    selectedUniverse,
    members,
    pagination: {
      page,
      pageSize,
      pageCount,
      totalCount,
      from: members.length === 0 ? 0 : offset + 1,
      to: offset + members.length
    }
  };
}

export async function getSystemUniversePreheatSymbols(limit = 25) {
  const universes = await getSystemUniverses();
  const preferred = ["qqq_holdings", "spy_holdings", "sp500", "dowjones", "nasdaq"];
  const ordered = [...universes].sort((a, b) => {
    const aIndex = preferred.indexOf(a.id);
    const bIndex = preferred.indexOf(b.id);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex) || a.priority - b.priority;
  });
  const seen = new Set<string>();
  const symbols: string[] = [];

  for (const universe of ordered) {
    if (symbols.length >= limit) break;
    const members = await getSystemUniverseMembers(universe.id, limit);
    for (const member of members) {
      if (symbols.length >= limit) break;
      if (seen.has(member.symbol)) continue;
      seen.add(member.symbol);
      symbols.push(member.symbol);
    }
  }

  return symbols;
}
