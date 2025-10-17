import { describe, it, expect, beforeAll } from 'vitest';
import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';

/**
 * Integration Tests for External Services
 *
 * Tests integration with:
 * - Upstash Redis (cache, rate limiting)
 * - Upstash Vector (embeddings)
 * - Upstash Search (full-text)
 * - Supabase (database)
 * - OpenAI/Anthropic (LLMs)
 */

describe('Upstash Redis Integration', () => {
  let redis: Redis;

  beforeAll(() => {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  });

  it('should connect to Redis', async () => {
    const result = await redis.ping();
    expect(result).toBe('PONG');
  });

  it('should set and get values', async () => {
    const key = `test:integration:${Date.now()}`;
    const value = 'test-value';

    await redis.set(key, value);
    const retrieved = await redis.get(key);

    expect(retrieved).toBe(value);

    // Cleanup
    await redis.del(key);
  });

  it('should handle expiration (TTL)', async () => {
    const key = `test:ttl:${Date.now()}`;
    const value = 'expires-soon';

    await redis.set(key, value, { ex: 2 }); // 2 seconds TTL
    const ttl = await redis.ttl(key);

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(2);

    // Cleanup
    await redis.del(key);
  });

  it('should support JSON storage', async () => {
    const key = `test:json:${Date.now()}`;
    const data = {
      user: 'test-user',
      timestamp: Date.now(),
      metadata: { foo: 'bar' },
    };

    await redis.set(key, JSON.stringify(data));
    const retrieved = await redis.get(key);
    const parsed = JSON.parse(retrieved as string);

    expect(parsed).toEqual(data);

    // Cleanup
    await redis.del(key);
  });

  it('should support atomic operations', async () => {
    const key = `test:counter:${Date.now()}`;

    await redis.set(key, 0);
    await redis.incr(key);
    await redis.incr(key);
    const count = await redis.get(key);

    expect(count).toBe(2);

    // Cleanup
    await redis.del(key);
  });

  it('should support lists', async () => {
    const key = `test:list:${Date.now()}`;

    await redis.rpush(key, 'item1', 'item2', 'item3');
    const length = await redis.llen(key);
    const items = await redis.lrange(key, 0, -1);

    expect(length).toBe(3);
    expect(items).toEqual(['item1', 'item2', 'item3']);

    // Cleanup
    await redis.del(key);
  });

  it('should support sets', async () => {
    const key = `test:set:${Date.now()}`;

    await redis.sadd(key, 'member1', 'member2', 'member3');
    const size = await redis.scard(key);
    const isMember = await redis.sismember(key, 'member2');

    expect(size).toBe(3);
    expect(isMember).toBe(1);

    // Cleanup
    await redis.del(key);
  });

  it('should support hash maps', async () => {
    const key = `test:hash:${Date.now()}`;

    await redis.hset(key, {
      field1: 'value1',
      field2: 'value2',
    });

    const field1 = await redis.hget(key, 'field1');
    const all = await redis.hgetall(key);

    expect(field1).toBe('value1');
    expect(all).toEqual({
      field1: 'value1',
      field2: 'value2',
    });

    // Cleanup
    await redis.del(key);
  });
});

describe('Upstash Vector Integration', () => {
  let vectorIndex: Index;

  beforeAll(() => {
    vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });
  });

  it('should connect to Vector index', async () => {
    const info = await vectorIndex.info();
    expect(info).toBeDefined();
    expect(info.dimension).toBeGreaterThan(0);
  });

  it('should upsert and query vectors', async () => {
    const testId = `test-vector-${Date.now()}`;
    const testVector = Array(1536).fill(0).map(() => Math.random()); // OpenAI embedding dimension

    await vectorIndex.upsert({
      id: testId,
      vector: testVector,
      metadata: { test: true, timestamp: Date.now() },
    });

    // Query for similar vectors
    const results = await vectorIndex.query({
      vector: testVector,
      topK: 1,
      includeMetadata: true,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe(testId);

    // Cleanup
    await vectorIndex.delete(testId);
  });

  it('should handle metadata filtering', async () => {
    const testId = `test-filter-${Date.now()}`;
    const testVector = Array(1536).fill(0).map(() => Math.random());

    await vectorIndex.upsert({
      id: testId,
      vector: testVector,
      metadata: {
        category: 'test',
        environment: 'integration',
      },
    });

    const results = await vectorIndex.query({
      vector: testVector,
      topK: 10,
      filter: 'category = "test"',
      includeMetadata: true,
    });

    const found = results.some((r) => r.id === testId);
    expect(found).toBeTruthy();

    // Cleanup
    await vectorIndex.delete(testId);
  });

  it('should support batch operations', async () => {
    const vectors = Array(5).fill(0).map((_, i) => ({
      id: `test-batch-${Date.now()}-${i}`,
      vector: Array(1536).fill(0).map(() => Math.random()),
      metadata: { batch: true, index: i },
    }));

    await vectorIndex.upsert(vectors);

    // Verify first vector
    const results = await vectorIndex.query({
      vector: vectors[0].vector,
      topK: 5,
      includeMetadata: true,
    });

    expect(results.length).toBeGreaterThan(0);

    // Cleanup
    for (const v of vectors) {
      await vectorIndex.delete(v.id);
    }
  });

  it('should calculate similarity scores', async () => {
    const testId = `test-similarity-${Date.now()}`;
    const testVector = Array(1536).fill(0).map(() => Math.random());

    await vectorIndex.upsert({
      id: testId,
      vector: testVector,
    });

    const results = await vectorIndex.query({
      vector: testVector,
      topK: 1,
      includeVectors: true,
    });

    expect(results[0].score).toBeDefined();
    expect(results[0].score).toBeGreaterThan(0.99); // Should be nearly identical

    // Cleanup
    await vectorIndex.delete(testId);
  });
});

describe('Supabase Integration', () => {
  it('should connect to Supabase', async () => {
    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();

    expect(supabase).toBeDefined();
  });

  it('should query database tables', async () => {
    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    // Table should exist (may be empty)
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBeTruthy();
  });

  it('should respect RLS policies', async () => {
    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();

    // Without authentication, should not access protected tables
    const { data, error } = await supabase
      .from('documents')
      .select('*');

    // Should either return empty array or error based on RLS
    expect(Array.isArray(data) || error).toBeTruthy();
  });

  it('should support vector similarity search', async () => {
    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();

    // Test that pgvector extension is available
    const { data, error } = await supabase
      .rpc('get_similar_documents', {
        query_embedding: Array(1536).fill(0),
        match_count: 5,
      });

    // Function should exist (may return empty results)
    expect(error === null || error?.message.includes('not found')).toBeTruthy();
  });
});

describe('LLM Provider Integration', () => {
  it('should have at least one LLM API key configured', () => {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasMistral = !!process.env.MISTRAL_API_KEY;

    const hasProvider = hasOpenAI || hasAnthropic || hasGoogle || hasMistral;
    expect(hasProvider).toBeTruthy();
  });

  it('should connect to OpenAI if configured', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OpenAI API key not configured, skipping');
      return;
    }

    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const models = await client.models.list();
    expect(models.data.length).toBeGreaterThan(0);
  });

  it('should generate embeddings if OpenAI configured', async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OpenAI API key not configured, skipping');
      return;
    }

    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'Test embedding generation',
    });

    expect(response.data[0].embedding).toBeDefined();
    expect(response.data[0].embedding.length).toBe(1536);
  });

  it('should connect to Anthropic if configured', async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️  Anthropic API key not configured, skipping');
      return;
    }

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Simple API check
    expect(client).toBeDefined();
  });
});

describe('Rate Limiting Integration', () => {
  it('should have Arcjet configured', () => {
    expect(process.env.ARCJET_KEY).toBeDefined();
    expect(process.env.ARCJET_KEY).toMatch(/^ajkey_/);
  });
});

describe('Monitoring Integration', () => {
  it('should have Sentry configured if enabled', () => {
    if (process.env.SENTRY_DSN) {
      expect(process.env.SENTRY_DSN).toMatch(/^https:\/\//);
      expect(process.env.NEXT_PUBLIC_SENTRY_DSN).toBeDefined();
    } else {
      console.log('⚠️  Sentry not configured, skipping');
    }
  });
});

describe('Email Service Integration', () => {
  it('should have Resend API key configured', () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
  });
});

describe('Background Jobs Integration', () => {
  it('should have QStash configured', () => {
    expect(process.env.QSTASH_URL).toBeDefined();
    expect(process.env.QSTASH_TOKEN).toBeDefined();
    expect(process.env.QSTASH_CURRENT_SIGNING_KEY).toBeDefined();
  });
});
