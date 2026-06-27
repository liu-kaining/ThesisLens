import Redis from "ioredis";

type CacheHealth =
  | {
      enabled: false;
      connected: false;
      mode: "memory";
    }
  | {
      enabled: true;
      connected: boolean;
      mode: "redis" | "memory";
      error?: string;
    };

let redis: Redis | null = null;
let redisRetryAt = 0;
const memoryCache = new Map<string, { expiresAt: number; value: string }>();
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();

function isRedisEnabled() {
  return (
    Boolean(process.env.REDIS_URL) &&
    process.env.REDIS_DISABLED !== "true" &&
    Date.now() >= redisRetryAt
  );
}

function markRedisUnavailable(client?: Redis | null) {
  const failedClient = client ?? redis;
  failedClient?.disconnect();
  if (!failedClient || failedClient === redis) {
    redisRetryAt = Date.now() + 5_000;
    redis = null;
  }
}

function getRedis() {
  if (!isRedisEnabled()) return null;
  if (!redis) {
    const client = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 800
    });
    client.on("error", () => {
      markRedisUnavailable(client);
    });
    redis = client;
  }
  return redis;
}

export async function getCacheHealth(): Promise<CacheHealth> {
  const client = getRedis();
  if (!client) {
    return {
      enabled: Boolean(process.env.REDIS_URL),
      connected: false,
      mode: "memory"
    };
  }

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    await client.ping();
    return {
      enabled: true,
      connected: true,
      mode: "redis"
    };
  } catch (error) {
    markRedisUnavailable(client);
    return {
      enabled: true,
      connected: false,
      mode: "memory",
      error: error instanceof Error ? error.message : "Unknown Redis error"
    };
  }
}

export async function getJsonCache<T>(key: string): Promise<T | null> {
  const client = getRedis();

  if (client) {
    try {
      if (client.status === "wait") {
        await client.connect();
      }
      const cached = await client.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch {
      markRedisUnavailable(client);
    }
  }

  const memory = memoryCache.get(key);
  if (!memory || memory.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return JSON.parse(memory.value) as T;
}

export async function setJsonCache<T>(key: string, value: T, ttlSeconds: number) {
  const serialized = JSON.stringify(value);
  const client = getRedis();

  if (client) {
    try {
      if (client.status === "wait") {
        await client.connect();
      }
      await client.set(key, serialized, "EX", ttlSeconds);
      return;
    } catch {
      markRedisUnavailable(client);
    }
  }

  memoryCache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value: serialized
  });
}

export async function deleteCache(key: string) {
  memoryCache.delete(key);
  const client = getRedis();
  if (!client) return;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    await client.del(key);
  } catch {
    markRedisUnavailable(client);
  }
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
) {
  const client = getRedis();

  if (client) {
    try {
      if (client.status === "wait") {
        await client.connect();
      }
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSeconds);
      const ttl = await client.ttl(key);
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterSeconds: Math.max(1, ttl)
      };
    } catch {
      markRedisUnavailable(client);
    }
  }

  const now = Date.now();
  const existing = memoryRateLimits.get(key);
  const state =
    !existing || existing.expiresAt <= now
      ? { count: 0, expiresAt: now + windowSeconds * 1000 }
      : existing;
  state.count += 1;
  memoryRateLimits.set(key, state);

  return {
    allowed: state.count <= limit,
    remaining: Math.max(0, limit - state.count),
    retryAfterSeconds: Math.max(1, Math.ceil((state.expiresAt - now) / 1000))
  };
}

export async function resetRateLimit(key: string) {
  memoryRateLimits.delete(key);
  const client = getRedis();
  if (!client) return;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    await client.del(key);
  } catch {
    markRedisUnavailable(client);
  }
}

export async function getCacheStats() {
  const health = await getCacheHealth();
  return {
    ...health,
    memoryKeys: memoryCache.size
  };
}
