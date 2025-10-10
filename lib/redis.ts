import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for event storage and caching
 * Used for AG-UI event streaming and rate limiting
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Event store keys for AG-UI protocol
 */
export const eventKeys = {
  session: (sessionId: string) => `agui:session:${sessionId}`,
  events: (sessionId: string) => `agui:events:${sessionId}`,
  metadata: (sessionId: string) => `agui:metadata:${sessionId}`,
};

/**
 * Cache keys for application data
 */
export const cacheKeys = {
  user: (userId: string) => `cache:user:${userId}`,
  organization: (orgId: string) => `cache:org:${orgId}`,
  session: (sessionId: string) => `cache:session:${sessionId}`,
  document: (documentId: string) => `cache:document:${documentId}`,
};

/**
 * Rate limiting keys
 */
export const rateLimitKeys = {
  api: (orgId: string) => `ratelimit:api:${orgId}`,
  agent: (orgId: string) => `ratelimit:agent:${orgId}`,
  upload: (orgId: string) => `ratelimit:upload:${orgId}`,
};

/**
 * Default TTL values (in seconds)
 */
export const TTL = {
  AGUI_EVENT: 60 * 60, // 1 hour for AG-UI events
  SESSION_CACHE: 60 * 30, // 30 minutes for session cache
  USER_CACHE: 60 * 15, // 15 minutes for user cache
  ORG_CACHE: 60 * 60, // 1 hour for organization cache
  RATE_LIMIT: 60, // 1 minute for rate limiting windows
} as const;

/**
 * Store an AG-UI event
 */
export async function storeEvent(
  sessionId: string,
  event: {
    type: string;
    data: unknown;
    timestamp: number;
  }
) {
  const key = eventKeys.events(sessionId);
  await redis.rpush(key, JSON.stringify(event));
  await redis.expire(key, TTL.AGUI_EVENT);
}

/**
 * Get all events for a session
 */
export async function getEvents(sessionId: string) {
  const key = eventKeys.events(sessionId);
  const events = await redis.lrange(key, 0, -1);
  return events.map((event) => JSON.parse(event as string));
}

/**
 * Get events since a specific index
 */
export async function getEventsSince(sessionId: string, sinceIndex: number) {
  const key = eventKeys.events(sessionId);
  const events = await redis.lrange(key, sinceIndex, -1);
  return events.map((event) => JSON.parse(event as string));
}

/**
 * Clear events for a session
 */
export async function clearEvents(sessionId: string) {
  const key = eventKeys.events(sessionId);
  await redis.del(key);
}

/**
 * Store session metadata
 */
export async function storeSessionMetadata(
  sessionId: string,
  metadata: Record<string, unknown>
) {
  const key = eventKeys.metadata(sessionId);
  await redis.set(key, JSON.stringify(metadata), {
    ex: TTL.AGUI_EVENT,
  });
}

/**
 * Get session metadata
 */
export async function getSessionMetadata(sessionId: string) {
  const key = eventKeys.metadata(sessionId);
  const metadata = await redis.get(key);
  return metadata ? JSON.parse(metadata as string) : null;
}

/**
 * Check rate limit using sliding window
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number = TTL.RATE_LIMIT
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - window * 1000;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const count = await redis.zcard(key);

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Add current request
  await redis.zadd(key, { score: now, member: `${now}` });
  await redis.expire(key, window);

  return { allowed: true, remaining: limit - count - 1 };
}

/**
 * Cache a value with TTL
 */
export async function cache<T>(
  key: string,
  value: T,
  ttl: number = TTL.SESSION_CACHE
): Promise<void> {
  await redis.set(key, JSON.stringify(value), { ex: ttl });
}

/**
 * Get a cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value as string) : null;
}

/**
 * Delete a cached value
 */
export async function deleteCached(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Note: This is expensive, use sparingly
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
