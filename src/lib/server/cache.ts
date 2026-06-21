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
let redisDisabled = false;
const memoryCache = new Map<string, { expiresAt: number; value: string }>();

function isRedisEnabled() {
  return Boolean(process.env.REDIS_URL) && process.env.REDIS_DISABLED !== "true" && !redisDisabled;
}

function getRedis() {
  if (!isRedisEnabled()) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 800
    });
    redis.on("error", () => {
      redisDisabled = true;
      redis?.disconnect();
      redis = null;
    });
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
    redisDisabled = true;
    client.disconnect();
    redis = null;
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
      redisDisabled = true;
      client.disconnect();
      redis = null;
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
      redisDisabled = true;
      client.disconnect();
      redis = null;
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
    redisDisabled = true;
    client.disconnect();
    redis = null;
  }
}

export async function getCacheStats() {
  const health = await getCacheHealth();
  return {
    ...health,
    memoryKeys: memoryCache.size
  };
}

