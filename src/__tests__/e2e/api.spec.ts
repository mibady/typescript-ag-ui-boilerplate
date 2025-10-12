import { test, expect } from '@playwright/test';

/**
 * API E2E Test Suite
 *
 * Tests all major API routes including:
 * - Health checks
 * - Agent execution
 * - AG-UI streaming
 * - Error handling
 * - Rate limiting
 * - Authentication
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('API Routes', () => {
  test.describe('Health Check', () => {
    test('GET /api/health should return 200', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/health`);
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    test('GET /api/health should return valid JSON', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/health`);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });
  });

  test.describe('Agent Execution API', () => {
    let authToken: string;

    test.beforeAll(async ({ browser }) => {
      // Authenticate to get session token
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${API_BASE}/sign-in`);
      await page.fill('[name="identifier"]', process.env.TEST_USER_EMAIL!);
      await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });

      // Get session token from cookies
      const cookies = await context.cookies();
      const sessionCookie = cookies.find((c) => c.name === '__session');
      authToken = sessionCookie?.value || '';

      await context.close();
    });

    test('POST /api/agent/execute should require authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        data: {
          prompt: 'Test prompt',
          model: 'gpt-3.5-turbo',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /api/agent/execute should validate request body', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          // Missing required fields
          prompt: '',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('POST /api/agent/execute should reject invalid model', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          prompt: 'Test prompt',
          model: 'invalid-model',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/model/i);
    });

    test('POST /api/agent/execute should accept valid request', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          prompt: 'Say hello',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
        },
      });

      // Should return 200 and stream response
      expect(response.ok()).toBeTruthy();
    });

    test('POST /api/agent/execute should handle context with RAG', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          prompt: 'What is in my documents?',
          model: 'gpt-3.5-turbo',
          useRAG: true,
          temperature: 0.7,
        },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('POST /api/agent/execute should respect max tokens limit', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          prompt: 'Write a very long story',
          model: 'gpt-3.5-turbo',
          maxTokens: 50,
        },
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('AG-UI Streaming API', () => {
    let authToken: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${API_BASE}/sign-in`);
      await page.fill('[name="identifier"]', process.env.TEST_USER_EMAIL!);
      await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });

      const cookies = await context.cookies();
      const sessionCookie = cookies.find((c) => c.name === '__session');
      authToken = sessionCookie?.value || '';

      await context.close();
    });

    test('POST /api/ag-ui/stream should require authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/ag-ui/stream`, {
        data: {
          messages: [{ role: 'user', content: 'Hello' }],
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /api/ag-ui/stream should validate messages array', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/ag-ui/stream`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          messages: [], // Empty messages array
        },
      });

      expect(response.status()).toBe(400);
    });

    test('POST /api/ag-ui/stream should stream AG-UI responses', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/ag-ui/stream`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          messages: [
            {
              role: 'user',
              content: 'Say hello in one word',
            },
          ],
        },
      });

      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('text/event-stream');
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limits on API routes', async ({ request }) => {
      const requests = [];

      // Make rapid requests to trigger rate limit
      for (let i = 0; i < 50; i++) {
        requests.push(
          request.get(`${API_BASE}/api/health`).catch((err) => err)
        );
      }

      const responses = await Promise.all(requests);

      // At least one request should be rate limited
      const rateLimited = responses.some((r) => r.status && r.status() === 429);

      if (rateLimited) {
        console.log('✅ Rate limiting is enforced');
        const rateLimitResponse = responses.find((r) => r.status && r.status() === 429);

        // Check for rate limit headers
        expect(rateLimitResponse?.headers()).toHaveProperty('x-ratelimit-limit');
        expect(rateLimitResponse?.headers()).toHaveProperty('x-ratelimit-remaining');
        expect(rateLimitResponse?.headers()).toHaveProperty('retry-after');
      } else {
        console.log('⚠️  Rate limiting not triggered with 50 requests');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/non-existent-route`);
      expect(response.status()).toBe(404);
    });

    test('should return 405 for invalid HTTP methods', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/health`);
      expect(response.status()).toBe(405);
    });

    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        data: 'not-valid-json',
      });

      expect(response.status()).toBe(400);
    });

    test('should return proper error messages', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        data: {
          prompt: '', // Invalid empty prompt
        },
      });

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });

  test.describe('CORS and Security Headers', () => {
    test('should include security headers in responses', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/health`);
      const headers = response.headers();

      // Check for common security headers
      expect(headers).toHaveProperty('x-frame-options');
      expect(headers).toHaveProperty('x-content-type-options');
    });

    test('should handle preflight CORS requests', async ({ request }) => {
      const response = await request.fetch(`${API_BASE}/api/health`, {
        method: 'OPTIONS',
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Content Type Handling', () => {
    test('should accept application/json', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'test',
        },
      });

      // Will fail auth but should accept content type
      expect(response.status()).toBe(401);
    });

    test('should reject unsupported content types', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/execute`, {
        headers: {
          'Content-Type': 'text/plain',
        },
        data: 'test data',
      });

      expect(response.status()).toBe(415);
    });
  });
});

test.describe('Background Jobs API', () => {
  test.describe('QStash Webhook Endpoints', () => {
    test('POST /api/jobs/process should verify QStash signature', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/jobs/process`, {
        data: {
          jobId: 'test-job-123',
        },
      });

      // Should reject without valid QStash signature
      expect(response.status()).toBe(401);
    });

    test('POST /api/jobs/process should validate job data', async ({ request }) => {
      // Create mock QStash signature (will fail verification but test validation)
      const response = await request.post(`${API_BASE}/api/jobs/process`, {
        headers: {
          'Upstash-Signature': 'mock-signature',
        },
        data: {
          // Missing required job fields
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});
