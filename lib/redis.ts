import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for event storage and caching
 * Used for AG-UI event streaming and rate limiting
 */
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = redisUrl && redisToken;

export const redis = isRedisConfigured
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

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
 * In-memory fallback for when Redis is not configured
 */
const inMemoryEvents = new Map<string, unknown[]>();

/**
 * Store an AG-UI event
 */
export async function storeEvent(
  sessionId: string,
  event: unknown
) {
  if (!redis) {
    // Fallback to in-memory storage
    console.log('[Redis] Using in-memory storage for event:', { sessionId, event });
    if (!inMemoryEvents.has(sessionId)) {
      inMemoryEvents.set(sessionId, []);
    }
    inMemoryEvents.get(sessionId)!.push(event);
    console.log('[Redis] In-memory event count:', inMemoryEvents.get(sessionId)!.length);
    return;
  }

  const key = eventKeys.events(sessionId);
  const eventStr = JSON.stringify(event);
  console.log('[Redis] Storing event to Redis:', { 
    sessionId, 
    key, 
    eventType: (event as any)?.type,
    eventPreview: eventStr.substring(0, 150)
  });
  await redis.rpush(key, eventStr);
  await redis.expire(key, TTL.AGUI_EVENT);
  const listLength = await redis.llen(key);
  console.log('[Redis] Event stored successfully, total events in list:', listLength);
}

/**
 * Get all events for a session
 */
export async function getEvents(sessionId: string) {
  if (!redis) {
    // Fallback to in-memory storage
    return inMemoryEvents.get(sessionId) || [];
  }

  const key = eventKeys.events(sessionId);
  const events = await redis.lrange(key, 0, -1);
  // Upstash Redis automatically deserializes JSON, no need to parse again
  return events;
}

/**
 * Get events since a specific index
 */
export async function getEventsSince(sessionId: string, sinceIndex: number) {
  if (!redis) {
    // Fallback to in-memory storage
    const allEvents = inMemoryEvents.get(sessionId) || [];
    const newEvents = allEvents.slice(sinceIndex);
    console.log('[Redis] Getting events from in-memory:', { sessionId, sinceIndex, totalEvents: allEvents.length, newEvents: newEvents.length });
    return newEvents;
  }

  const key = eventKeys.events(sessionId);
  console.log('[Redis] Getting events from Redis:', { sessionId, key, sinceIndex });
  const events = await redis.lrange(key, sinceIndex, -1);
  console.log('[Redis] Retrieved events:', { 
    count: events.length, 
    firstEventSample: typeof events[0] === 'string' ? events[0].substring(0, 100) : JSON.stringify(events[0]).substring(0, 100)
  });
  // Upstash Redis automatically deserializes JSON, no need to parse again
  return events;
}

/**
 * Clear events for a session
 */
export async function clearEvents(sessionId: string) {
  if (!redis) {
    // Fallback to in-memory storage
    inMemoryEvents.delete(sessionId);
    return;
  }

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
  if (!redis) {
    return;
  }

  const key = eventKeys.metadata(sessionId);
  await redis.set(key, JSON.stringify(metadata), {
    ex: TTL.AGUI_EVENT,
  });
}

/**
 * Get session metadata
 */
export async function getSessionMetadata(sessionId: string) {
  if (!redis) {
    return null;
  }

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
  if (!redis) {
    // Allow all requests if Redis is not configured
    return { allowed: true, remaining: limit };
  }

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
  if (!redis) {
    return;
  }

  await redis.set(key, JSON.stringify(value), { ex: ttl });
}

/**
 * Get a cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  const value = await redis.get(key);
  return value ? JSON.parse(value as string) : null;
}

/**
 * Delete a cached value
 */
export async function deleteCached(key: string): Promise<void> {
  if (!redis) {
    return;
  }

  await redis.del(key);
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) {
    return;
  }

  // Note: This is expensive, use sparingly
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
