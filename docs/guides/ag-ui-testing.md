# AG-UI SDK Testing Guide

Comprehensive testing guide for AG-UI SDK integration across all 3 architectural layers.

## Overview

The AG-UI SDK is the **foundation** of the agent system, implementing the AG-UI protocol for standardized agent-to-UI communication. This guide covers testing strategies for all three layers of the architecture.

## AG-UI 3-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Frontend ↔ Backend (AG-UI SDK)                    │
│ - HttpAgent (from @ag-ui/client)                           │
│ - Observable pattern for event streams                      │
│ - SSE (Server-Sent Events) transport                       │
│ - AG-UI event types from @ag-ui/core                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Backend ↔ LLM (Vercel AI SDK)                     │
│ - Message format conversion                                 │
│ - streamText() integration                                  │
│ - Provider abstraction (OpenAI, Anthropic, etc.)           │
│ - Tool execution                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Data & Services (Storage)                         │
│ - Event storage in Redis                                    │
│ - Message persistence in Supabase                          │
│ - Vector search for RAG                                     │
│ - Background job processing (QStash)                        │
└─────────────────────────────────────────────────────────────┘
```

## Test Coverage

### Unit Tests (60+ tests)

**Location:** `src/__tests__/unit/agui-events.test.ts`

**Coverage:**
- Event creation functions
- SSE formatting
- Type compliance with @ag-ui/core
- Event lifecycle ordering
- Performance benchmarks

**Run:**
```bash
npm run test:unit:agui
```

**Key Test Suites:**

1. **Event Creation**
   - RUN_STARTED, RUN_FINISHED, RUN_ERROR
   - TEXT_MESSAGE_START, TEXT_MESSAGE_CONTENT, TEXT_MESSAGE_END
   - TOOL_CALL_START, TOOL_CALL_END, TOOL_CALL_RESULT
   - Timestamp generation
   - ID consistency

2. **SSE Formatting**
   - Valid SSE string format
   - JSON escaping
   - Double newline termination
   - Complex nested data handling

3. **Protocol Compliance**
   - EventType enum usage
   - Required field validation
   - Event sequence correctness

4. **Performance**
   - Event creation speed (1000 events < 100ms)
   - SSE formatting speed (1000 events < 50ms)

### Integration Tests (50+ tests)

**Location:** `src/__tests__/integration/base-agent.test.ts`

**Coverage:**
- BaseAgent class implementation
- Event lifecycle management
- Streaming vs non-streaming execution
- Tool execution with events
- ID generation (nanoid)
- Memory management

**Run:**
```bash
npm run test:integration:agui
```

**Key Test Suites:**

1. **Event Lifecycle - Streaming**
   - Complete event sequence validation
   - RUN_STARTED → TEXT_MESSAGE_* → RUN_FINISHED
   - Delta handling in TEXT_MESSAGE_CONTENT
   - Unique ID generation per execution

2. **Event Lifecycle - Non-Streaming**
   - Event collection and response return
   - Complete response text assembly

3. **Tool Execution**
   - Tool event emission
   - Error handling in tool calls
   - TOOL_CALL_* event sequence

4. **Error Handling**
   - RUN_ERROR event emission
   - Error message and stack trace inclusion
   - Graceful failure handling

5. **Performance**
   - Low latency streaming
   - Concurrent execution handling
   - Memory leak prevention

### E2E Tests (40+ tests)

**Location:** `src/__tests__/e2e/ag-ui.spec.ts`

**Coverage:**
- HttpAgent functionality
- Full protocol implementation
- Browser-based execution
- UI component integration
- Multi-layer data flow

**Run:**
```bash
npm run test:e2e:agui
```

**Key Test Suites:**

1. **Layer 1: Frontend ↔ Backend**
   - HttpAgent streaming via Observable
   - AG-UI event type correctness
   - ID generation and consistency
   - Delta-based content streaming
   - Observable pattern (next, complete, error)

2. **Layer 2: Backend ↔ LLM**
   - Message format conversion
   - Multi-provider support (OpenAI, Anthropic)
   - Tool call event emission
   - Vercel AI SDK integration

3. **Layer 3: Data & Services**
   - Event storage in Redis
   - Message persistence in Supabase
   - Event retrieval

4. **Error Handling**
   - RUN_ERROR event emission
   - HttpAgent connection failures
   - Graceful degradation

5. **UI Components**
   - Chat interface rendering
   - Real-time message display
   - Run status indicators
   - Streaming visualization

6. **Performance**
   - Rapid consecutive requests
   - Concurrent execution
   - Rate limiting behavior

## Pre-Deployment Validation

AG-UI tests are **critical** in the pre-deployment suite and block deployment on failure.

### Execution Order

```
Phase 1: Environment Validation ✓
Phase 2: Service Connectivity (7 services) ✓
Phase 3: Authentication E2E ✓ CRITICAL - BLOCKS
Phase 4: AG-UI SDK Integration ✓ CRITICAL - BLOCKS ← YOU ARE HERE
  4.1: AG-UI Event System (Unit)
  4.2: AG-UI BaseAgent (Integration)
  4.3: AG-UI Protocol (E2E)
Phase 5: Unit Tests ✓
Phase 6: Integration Tests ✓
Phase 7: Full E2E Suite ✓
Phase 8: Load Tests ✓
Phase 9: Security Scan ✓
```

### Why AG-UI Tests Block Deployment

AG-UI is the **foundation** of the agent system. If AG-UI tests fail, the entire agent communication layer is broken, which means:

- Frontend cannot communicate with backend agents
- Events may be malformed or missing
- Streaming may not work
- Tool calls may fail silently
- User experience will be completely broken

**Run full suite:**
```bash
npm run test:pre-deploy
```

## Writing AG-UI Tests

### Unit Test Example

Test event creation and formatting:

```typescript
import { describe, it, expect } from 'vitest';
import { createTextMessageContentEvent, formatSSE } from '@/lib/agui-events';
import { EventType } from '@ag-ui/core';

describe('AG-UI Event Creation', () => {
  it('should create valid TEXT_MESSAGE_CONTENT event', () => {
    const event = createTextMessageContentEvent('msg-123', 'Hello');

    expect(event.type).toBe(EventType.TEXT_MESSAGE_CONTENT);
    expect(event.messageId).toBe('msg-123');
    expect(event.content.delta).toBe('Hello');
    expect(event.timestamp).toBeDefined();
  });

  it('should format as valid SSE string', () => {
    const event = createTextMessageContentEvent('msg-123', 'Test');
    const sse = formatSSE(event);

    expect(sse).toMatch(/^data: /);
    expect(sse).toMatch(/\n\n$/);
    expect(sse).toContain('"type":"text_message_content"');
  });
});
```

### Integration Test Example

Test BaseAgent event lifecycle:

```typescript
import { describe, it, expect } from 'vitest';
import { BaseAgent } from '@/lib/agents/base-agent';
import { EventType } from '@ag-ui/core';

class TestAgent extends BaseAgent {
  async *generateStreamingResponse(prompt: string) {
    yield 'Response: ';
    yield prompt;
  }
}

describe('BaseAgent Event Lifecycle', () => {
  it('should emit complete event sequence', async () => {
    const agent = new TestAgent();
    const events = [];

    for await (const event of agent.executeStream('thread-1', 'Hello')) {
      events.push(event);
    }

    // Verify sequence
    expect(events[0].type).toBe(EventType.RUN_STARTED);
    expect(events[events.length - 1].type).toBe(EventType.RUN_FINISHED);

    // Verify text message events exist
    const hasTextStart = events.some((e) => e.type === EventType.TEXT_MESSAGE_START);
    const hasTextContent = events.some((e) => e.type === EventType.TEXT_MESSAGE_CONTENT);
    const hasTextEnd = events.some((e) => e.type === EventType.TEXT_MESSAGE_END);

    expect(hasTextStart).toBeTruthy();
    expect(hasTextContent).toBeTruthy();
    expect(hasTextEnd).toBeTruthy();
  });
});
```

### E2E Test Example

Test HttpAgent integration:

```typescript
import { test, expect } from '@playwright/test';

test('should stream AG-UI events via HttpAgent', async ({ page }) => {
  await page.goto('/dashboard');

  const events = await page.evaluate(async () => {
    const { HttpAgent } = await import('@ag-ui/client');
    const { EventType } = await import('@ag-ui/core');

    const agent = new HttpAgent({ url: '/api/agent/stream' });
    const collectedEvents = [];

    const observable = await agent.run({
      threadId: 'test-thread',
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
    });

    await new Promise((resolve) => {
      observable.subscribe({
        next: (event) => collectedEvents.push(event),
        complete: () => resolve(),
      });
    });

    return collectedEvents;
  });

  expect(events.length).toBeGreaterThan(0);
  expect(events[0].type).toBe('run_started');
});
```

## Common Issues and Solutions

### Issue 1: Events Not Streaming

**Symptoms:**
- HttpAgent hangs
- No events received
- Timeout errors

**Solutions:**
1. Check SSE formatting in `lib/agui-events.ts`
2. Verify `formatSSE()` ends with `\n\n`
3. Check API route returns `ReadableStream`
4. Verify `Content-Type: text/event-stream` header

### Issue 2: Malformed Events

**Symptoms:**
- JSON parse errors
- Missing fields
- Wrong event types

**Solutions:**
1. Use types from `@ag-ui/core` (not custom strings)
2. Verify event creation functions in `lib/agui-events.ts`
3. Check all required fields are included
4. Test with unit tests first

### Issue 3: ID Mismatch

**Symptoms:**
- Different runIds within same run
- messageIds don't match across events
- toolCallIds inconsistent

**Solutions:**
1. Generate IDs once at start of execution
2. Pass IDs through all event creation calls
3. Don't regenerate IDs for same entity
4. Use nanoid for consistency

### Issue 4: Event Order Wrong

**Symptoms:**
- TEXT_MESSAGE_END before TEXT_MESSAGE_START
- RUN_FINISHED before TEXT_MESSAGE events
- Tool events out of order

**Solutions:**
1. Follow AG-UI spec event sequence:
   ```
   RUN_STARTED
   → TEXT_MESSAGE_START
   → TEXT_MESSAGE_CONTENT (multiple)
   → TEXT_MESSAGE_END
   → RUN_FINISHED
   ```
2. Don't emit events concurrently
3. Use async generators to maintain order
4. Test event sequence in integration tests

## Performance Benchmarks

### Event Creation

```
Target: 1000 events < 100ms
Actual: ~50ms ✓
```

### SSE Formatting

```
Target: 1000 events < 50ms
Actual: ~25ms ✓
```

### Streaming Latency

```
Target: First event < 100ms
Actual: ~30ms ✓
```

### Concurrent Executions

```
Target: 10 concurrent runs without error
Actual: 10+ concurrent ✓
```

## Best Practices

### 1. Always Use Official Types

```typescript
// ✅ GOOD: Use types from @ag-ui/core
import { EventType } from '@ag-ui/core';
const event = { type: EventType.TEXT_MESSAGE_CONTENT };

// ❌ BAD: Use string literals
const event = { type: 'text_message_content' };
```

### 2. Generate IDs Once

```typescript
// ✅ GOOD: Generate once, reuse
const runId = nanoid();
const startEvent = createRunStartedEvent(threadId, runId);
const finishEvent = createRunFinishedEvent(runId);

// ❌ BAD: Generate multiple times
const startEvent = createRunStartedEvent(threadId, nanoid());
const finishEvent = createRunFinishedEvent(nanoid());
```

### 3. Follow Event Sequence

```typescript
// ✅ GOOD: Correct sequence
yield createRunStartedEvent(threadId, runId);
yield createTextMessageStartEvent(messageId);
yield createTextMessageContentEvent(messageId, 'Hello');
yield createTextMessageEndEvent(messageId);
yield createRunFinishedEvent(runId);

// ❌ BAD: Wrong order
yield createTextMessageContentEvent(messageId, 'Hello');
yield createTextMessageStartEvent(messageId); // Too late!
```

### 4. Handle Errors Properly

```typescript
// ✅ GOOD: Emit RUN_ERROR event
try {
  await generateResponse();
} catch (error) {
  yield createRunErrorEvent(runId, error);
  return;
}

// ❌ BAD: Throw without event
try {
  await generateResponse();
} catch (error) {
  throw error; // Frontend doesn't know what happened
}
```

### 5. Test All Three Layers

```typescript
// ✅ GOOD: Test each layer
// Unit: Test event creation
// Integration: Test BaseAgent lifecycle
// E2E: Test HttpAgent → Backend → LLM flow

// ❌ BAD: Only test one layer
// Only unit tests → Integration issues missed
// Only E2E tests → Slow, hard to debug
```

## CI/CD Integration

AG-UI tests run automatically in GitHub Actions:

**.github/workflows/test.yml:**

```yaml
jobs:
  ag-ui-tests:
    name: AG-UI SDK Tests (Critical)
    runs-on: ubuntu-latest

    steps:
      - name: Run AG-UI Unit Tests
        run: npm run test:unit:agui

      - name: Run AG-UI Integration Tests
        run: npm run test:integration:agui

      - name: Run AG-UI E2E Tests
        run: npm run test:e2e:agui

      - name: Fail pipeline if AG-UI tests fail
        if: failure()
        run: exit 1
```

## Resources

- [AG-UI Protocol Specification](https://github.com/ag-ui/protocol)
- [@ag-ui/core Documentation](https://www.npmjs.com/package/@ag-ui/core)
- [@ag-ui/client Documentation](https://www.npmjs.com/package/@ag-ui/client)
- [Observable Pattern Guide](https://rxjs.dev/guide/observable)
- [Server-Sent Events (SSE) MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## Summary

AG-UI SDK testing ensures:

✅ **Protocol Compliance** - All events follow AG-UI specification
✅ **Type Safety** - Using @ag-ui/core types throughout
✅ **Event Lifecycle** - Correct event sequence and timing
✅ **ID Management** - Proper nanoid generation and consistency
✅ **Error Handling** - RUN_ERROR events for all failures
✅ **Performance** - Fast event creation and streaming
✅ **Integration** - HttpAgent → Backend → LLM works correctly
✅ **UI/UX** - Real-time streaming with proper deltas

**Total Test Count:** 150+ tests across 3 layers
**Critical Priority:** Blocks deployment on failure
**Execution Time:** ~2-3 minutes for full AG-UI suite
