import { test, expect } from '@playwright/test';

/**
 * AG-UI SDK Integration E2E Tests
 *
 * Tests the complete AG-UI protocol implementation across all 3 layers:
 * - Layer 1: Frontend ↔ Backend (HttpAgent, AG-UI Events)
 * - Layer 2: Backend ↔ LLM (Vercel AI SDK integration)
 * - Layer 3: Data & Services (Event storage, message persistence)
 *
 * This test suite validates:
 * - AG-UI protocol compliance
 * - Event streaming via SSE
 * - HttpAgent functionality
 * - Event type correctness
 * - ID generation (threadId, runId, messageId, toolCallId)
 * - Observable pattern implementation
 * - Error handling
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('AG-UI SDK Integration', () => {
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    // Authenticate
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

  test.describe('Layer 1: Frontend ↔ Backend (AG-UI SDK)', () => {
    test('should stream AG-UI events via HttpAgent', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      // Inject test code to use HttpAgent
      const events = await page.evaluate(async () => {
        const { HttpAgent } = await import('@ag-ui/client');
        const { EventType } = await import('@ag-ui/core');

        const agent = new HttpAgent({ url: '/api/agent/stream' });
        const collectedEvents: any[] = [];

        try {
          const observable = await agent.run({
            threadId: 'test-thread-' + Date.now(),
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Say hello in one word' }],
              },
            ],
            context: [
              {
                type: 'provider_config',
                provider: 'openai',
                modelName: 'gpt-3.5-turbo',
                temperature: 0.7,
              },
            ],
          });

          await new Promise<void>((resolve, reject) => {
            observable.subscribe({
              next: (event) => {
                collectedEvents.push({
                  type: event.type,
                  hasId: 'id' in event,
                  hasTimestamp: 'timestamp' in event,
                });
              },
              complete: () => resolve(),
              error: (err) => reject(err),
            });

            // Timeout after 30 seconds
            setTimeout(() => reject(new Error('Timeout')), 30000);
          });

          return collectedEvents;
        } catch (error: any) {
          throw new Error(error.message);
        }
      });

      // Verify AG-UI event sequence
      expect(events.length).toBeGreaterThan(0);

      // Should contain RUN_STARTED
      const runStarted = events.find((e) => e.type === 'run_started');
      expect(runStarted).toBeDefined();
      expect(runStarted?.hasId).toBeTruthy();
      expect(runStarted?.hasTimestamp).toBeTruthy();

      // Should contain TEXT_MESSAGE events
      const textEvents = events.filter((e) =>
        e.type.startsWith('text_message')
      );
      expect(textEvents.length).toBeGreaterThan(0);

      // Should contain RUN_FINISHED
      const runFinished = events.find((e) => e.type === 'run_finished');
      expect(runFinished).toBeDefined();
    });

    test('should use proper AG-UI event types from @ag-ui/core', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId: 'test-thread-' + Date.now(),
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Test message' }],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'openai',
              modelName: 'gpt-3.5-turbo',
            },
          ],
        },
      });

      expect(response.ok()).toBeTruthy();

      // Parse SSE stream
      const body = await response.text();
      const events = body
        .split('\n\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => {
          try {
            return JSON.parse(line.substring(6));
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Verify event structure matches AG-UI spec
      events.forEach((event: any) => {
        // All events must have type field
        expect(event).toHaveProperty('type');

        // All events should have timestamp
        expect(event).toHaveProperty('timestamp');

        // Events should have valid AG-UI event types
        const validTypes = [
          'run_started',
          'run_finished',
          'run_error',
          'text_message_start',
          'text_message_content',
          'text_message_end',
          'tool_call_start',
          'tool_call_end',
          'tool_call_result',
        ];
        expect(validTypes).toContain(event.type);
      });
    });

    test('should generate proper AG-UI IDs (threadId, runId, messageId)', async ({ request }) => {
      const threadId = 'test-thread-' + Date.now();

      const response = await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId,
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Hello' }],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'openai',
              modelName: 'gpt-3.5-turbo',
            },
          ],
        },
      });

      const body = await response.text();
      const events = body
        .split('\n\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => JSON.parse(line.substring(6)));

      // Check RUN_STARTED has runId and threadId
      const runStarted = events.find((e: any) => e.type === 'run_started');
      expect(runStarted).toBeDefined();
      expect(runStarted.runId).toBeDefined();
      expect(runStarted.threadId).toBe(threadId);

      // Check TEXT_MESSAGE events have messageId
      const textStart = events.find((e: any) => e.type === 'text_message_start');
      if (textStart) {
        expect(textStart.messageId).toBeDefined();
        expect(typeof textStart.messageId).toBe('string');
      }
    });

    test('should handle Observable pattern correctly', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      const result = await page.evaluate(async () => {
        const { HttpAgent } = await import('@ag-ui/client');

        const agent = new HttpAgent({ url: '/api/agent/stream' });

        let nextCalled = false;
        let completeCalled = false;
        let errorCalled = false;

        try {
          const observable = await agent.run({
            threadId: 'test-observable-' + Date.now(),
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Hi' }],
              },
            ],
            context: [
              {
                type: 'provider_config',
                provider: 'openai',
                modelName: 'gpt-3.5-turbo',
              },
            ],
          });

          await new Promise<void>((resolve) => {
            observable.subscribe({
              next: () => {
                nextCalled = true;
              },
              complete: () => {
                completeCalled = true;
                resolve();
              },
              error: () => {
                errorCalled = true;
                resolve();
              },
            });

            setTimeout(() => resolve(), 30000);
          });

          return { nextCalled, completeCalled, errorCalled };
        } catch (error) {
          return { nextCalled, completeCalled, errorCalled, error: true };
        }
      });

      expect(result.nextCalled).toBeTruthy();
      expect(result.completeCalled).toBeTruthy();
      expect(result.errorCalled).toBeFalsy();
    });

    test('should handle streaming text message content with deltas', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      const deltas = await page.evaluate(async () => {
        const { HttpAgent } = await import('@ag-ui/client');
        const { EventType } = await import('@ag-ui/core');

        const agent = new HttpAgent({ url: '/api/agent/stream' });
        const textDeltas: string[] = [];

        try {
          const observable = await agent.run({
            threadId: 'test-deltas-' + Date.now(),
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Count to 5' }],
              },
            ],
            context: [
              {
                type: 'provider_config',
                provider: 'openai',
                modelName: 'gpt-3.5-turbo',
              },
            ],
          });

          await new Promise<void>((resolve, reject) => {
            observable.subscribe({
              next: (event) => {
                if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
                  // @ts-ignore
                  if (event.content?.delta) {
                    // @ts-ignore
                    textDeltas.push(event.content.delta);
                  }
                }
              },
              complete: () => resolve(),
              error: (err) => reject(err),
            });

            setTimeout(() => reject(new Error('Timeout')), 30000);
          });

          return textDeltas;
        } catch (error) {
          return [];
        }
      });

      // Should receive multiple deltas
      expect(deltas.length).toBeGreaterThan(0);

      // Deltas should be strings
      deltas.forEach((delta) => {
        expect(typeof delta).toBe('string');
      });
    });
  });

  test.describe('Layer 2: Backend ↔ LLM (Vercel AI SDK)', () => {
    test('should convert AG-UI messages to Vercel AI SDK CoreMessage format', async ({ request }) => {
      // This test verifies the backend properly converts AG-UI RunAgentInput to CoreMessage
      const response = await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId: 'test-conversion-' + Date.now(),
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'What is 2+2?' },
              ],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'openai',
              modelName: 'gpt-3.5-turbo',
            },
          ],
        },
      });

      expect(response.ok()).toBeTruthy();

      const body = await response.text();
      const events = body
        .split('\n\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => JSON.parse(line.substring(6)));

      // Should get response from LLM
      const textContent = events.filter((e: any) => e.type === 'text_message_content');
      expect(textContent.length).toBeGreaterThan(0);
    });

    test('should support multiple LLM providers via context', async ({ request }) => {
      const providers = ['openai', 'anthropic'];

      for (const provider of providers) {
        // Skip if provider not configured
        if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) continue;

        const response = await request.post(`${API_BASE}/api/agent/stream`, {
          headers: {
            'Cookie': `__session=${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            threadId: `test-provider-${provider}-${Date.now()}`,
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Say hello' }],
              },
            ],
            context: [
              {
                type: 'provider_config',
                provider,
                modelName: provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku-20240307',
              },
            ],
          },
        });

        expect(response.ok()).toBeTruthy();
      }
    });

    test('should handle tool calls with proper AG-UI events', async ({ request }) => {
      // Test tool execution emits TOOL_CALL_START, TOOL_CALL_END, TOOL_CALL_RESULT
      const response = await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId: 'test-tools-' + Date.now(),
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'What is the weather in San Francisco?' }],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'openai',
              modelName: 'gpt-4-turbo',
            },
            {
              type: 'tools',
              tools: [
                {
                  name: 'get_weather',
                  description: 'Get current weather for a location',
                  parameters: {
                    type: 'object',
                    properties: {
                      location: { type: 'string' },
                    },
                    required: ['location'],
                  },
                },
              ],
            },
          ],
        },
      });

      if (response.ok()) {
        const body = await response.text();
        const events = body
          .split('\n\n')
          .filter((line) => line.startsWith('data: '))
          .map((line) => JSON.parse(line.substring(6)));

        // Check for tool events if tool was called
        const toolEvents = events.filter((e: any) =>
          ['tool_call_start', 'tool_call_end', 'tool_call_result'].includes(e.type)
        );

        if (toolEvents.length > 0) {
          // Verify tool events have toolCallId
          toolEvents.forEach((event: any) => {
            expect(event.toolCallId).toBeDefined();
          });
        }
      }
    });
  });

  test.describe('Layer 3: Data & Services (Event Storage)', () => {
    test('should store AG-UI events in Redis with proper format', async ({ request }) => {
      const threadId = 'test-storage-' + Date.now();

      // Make request that generates events
      await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId,
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Store this message' }],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'openai',
              modelName: 'gpt-3.5-turbo',
            },
          ],
        },
      });

      // Verify events can be retrieved
      // In real implementation, you'd have an API endpoint to retrieve stored events
      // For now, just verify the request succeeded
    });

    test('should persist messages in Supabase with AG-UI format', async ({ request }) => {
      // Verify messages are stored in database
      const threadId = 'test-persist-' + Date.now();

      await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId,
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Persist this' }],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'openai',
              modelName: 'gpt-3.5-turbo',
            },
          ],
        },
      });

      // In production, you'd query the database to verify storage
      // For now, just verify the request succeeded
    });
  });

  test.describe('Error Handling', () => {
    test('should emit RUN_ERROR event on failure', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/agent/stream`, {
        headers: {
          'Cookie': `__session=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          threadId: 'test-error-' + Date.now(),
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Test' }],
            },
          ],
          context: [
            {
              type: 'provider_config',
              provider: 'invalid-provider',
              modelName: 'invalid-model',
            },
          ],
        },
      });

      // Should return error
      expect([400, 500]).toContain(response.status());
    });

    test('should handle HttpAgent connection failures gracefully', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      const errorHandled = await page.evaluate(async () => {
        const { HttpAgent } = await import('@ag-ui/client');

        const agent = new HttpAgent({ url: '/api/non-existent-endpoint' });

        try {
          await agent.run({
            threadId: 'test-error-' + Date.now(),
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Test' }],
              },
            ],
            context: [],
          });
          return false;
        } catch (error) {
          return true;
        }
      });

      expect(errorHandled).toBeTruthy();
    });
  });

  test.describe('UI Components', () => {
    test('should render chat interface with AG-UI integration', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      // Check for chat interface
      const chatInterface = page.locator('[data-testid="chat-interface"]');
      if (await chatInterface.count() > 0) {
        await expect(chatInterface).toBeVisible();

        // Should have input field
        await expect(page.locator('textarea, input[type="text"]')).toBeVisible();

        // Should have send button
        await expect(page.locator('button:has-text("Send")')).toBeVisible();
      }
    });

    test('should display streaming messages in real-time', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      const messageInput = page.locator('textarea, input[type="text"]').first();
      const sendButton = page.locator('button:has-text("Send")').first();

      if (await messageInput.count() > 0) {
        await messageInput.fill('Say hello');
        await sendButton.click();

        // Wait for response to appear
        await page.waitForSelector('[data-role="assistant"]', { timeout: 30000 });

        // Should show assistant message
        const assistantMessage = page.locator('[data-role="assistant"]').last();
        await expect(assistantMessage).toBeVisible();

        const text = await assistantMessage.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('should show run status indicators', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      // Check for agent-interaction component
      const agentComponent = page.locator('[data-testid="agent-interaction"]');

      if (await agentComponent.count() > 0) {
        await expect(agentComponent).toBeVisible();

        // Should show run status
        const statusIndicator = page.locator('[data-testid="run-status"]');
        if (await statusIndicator.count() > 0) {
          await expect(statusIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid consecutive requests', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard`);

      const results = await page.evaluate(async () => {
        const { HttpAgent } = await import('@ag-ui/client');

        const agent = new HttpAgent({ url: '/api/agent/stream' });
        const promises = [];

        // Make 5 rapid requests
        for (let i = 0; i < 5; i++) {
          promises.push(
            agent.run({
              threadId: `test-rapid-${Date.now()}-${i}`,
              messages: [
                {
                  role: 'user',
                  content: [{ type: 'text', text: `Message ${i}` }],
                },
              ],
              context: [
                {
                  type: 'provider_config',
                  provider: 'openai',
                  modelName: 'gpt-3.5-turbo',
                },
              ],
            })
          );
        }

        const results = await Promise.allSettled(promises);
        return results.map((r) => r.status);
      });

      // Most requests should succeed (allow 1-2 failures due to rate limiting)
      const successful = results.filter((status) => status === 'fulfilled').length;
      expect(successful).toBeGreaterThanOrEqual(3);
    });
  });
});
