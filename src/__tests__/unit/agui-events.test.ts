import { describe, it, expect } from 'vitest';
import {
  createRunStartedEvent,
  createRunFinishedEvent,
  createRunErrorEvent,
  createTextMessageStartEvent,
  createTextMessageContentEvent,
  createTextMessageEndEvent,
  createToolCallStartEvent,
  createToolCallEndEvent,
  createToolCallResultEvent,
  formatSSE,
} from '@/lib/agui-events-creators';
import { EventType } from '@ag-ui/core';

/**
 * AG-UI Event System Unit Tests
 *
 * Tests the core event creation and formatting functions
 * to ensure compliance with AG-UI protocol specification.
 */

describe('AG-UI Event System', () => {
  describe('Event Creation', () => {
    describe('createRunStartedEvent', () => {
      it('should create valid RUN_STARTED event', () => {
        const event = createRunStartedEvent('thread-123', 'run-456');

        expect(event.type).toBe(EventType.RUN_STARTED);
        expect(event.threadId).toBe('thread-123');
        expect(event.runId).toBe('run-456');
        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe('number');
      });

      it('should have unique timestamps', async () => {
        const event1 = createRunStartedEvent('thread-1', 'run-1');
        await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure different timestamps
        const event2 = createRunStartedEvent('thread-2', 'run-2');

        expect(event1.timestamp).toBeLessThanOrEqual(event2.timestamp!);
      });
    });

    describe('createRunFinishedEvent', () => {
      it('should create valid RUN_FINISHED event', () => {
        const event = createRunFinishedEvent('thread-123', 'run-123');

        expect(event.type).toBe(EventType.RUN_FINISHED);
        expect(event.runId).toBe('run-123');
        expect(event.timestamp).toBeDefined();
      });
    });

    describe('createRunErrorEvent', () => {
      it('should create valid RUN_ERROR event with error details', () => {
        const error = new Error('Test error');
        const event = createRunErrorEvent(error.message);

        expect(event.type).toBe(EventType.RUN_ERROR);
        expect(event.message).toBe('Test error');
        expect(event.timestamp).toBeDefined();
      });

      it('should handle string errors', () => {
        const event = createRunErrorEvent('String error');

        expect(event.message).toBe('String error');
      });
    });

    describe('createTextMessageStartEvent', () => {
      it('should create valid TEXT_MESSAGE_START event', () => {
        const event = createTextMessageStartEvent('msg-123');

        expect(event.type).toBe(EventType.TEXT_MESSAGE_START);
        expect(event.messageId).toBe('msg-123');
        expect(event.timestamp).toBeDefined();
      });
    });

    describe('createTextMessageContentEvent', () => {
      it('should create valid TEXT_MESSAGE_CONTENT event with delta', () => {
        const event = createTextMessageContentEvent('msg-123', 'Hello');

        expect(event.type).toBe(EventType.TEXT_MESSAGE_CONTENT);
        expect(event.messageId).toBe('msg-123');
        expect(event.delta).toBe('Hello');
        expect(event.timestamp).toBeDefined();
      });

      it('should handle empty deltas', () => {
        const event = createTextMessageContentEvent('msg-123', '');

        expect(event.delta).toBe('');
      });

      it('should handle special characters in deltas', () => {
        const delta = 'Hello\nWorld\t"Test"';
        const event = createTextMessageContentEvent('msg-123', delta);

        expect(event.delta).toBe(delta);
      });
    });

    describe('createTextMessageEndEvent', () => {
      it('should create valid TEXT_MESSAGE_END event', () => {
        const event = createTextMessageEndEvent('msg-123');

        expect(event.type).toBe(EventType.TEXT_MESSAGE_END);
        expect(event.messageId).toBe('msg-123');
        expect(event.timestamp).toBeDefined();
      });
    });

    describe('Tool Call Events', () => {
      it('should create valid TOOL_CALL_START event', () => {
        const event = createToolCallStartEvent(
          'tool-call-123',
          'get_weather',
          { location: 'San Francisco' }
        );

        expect(event.type).toBe(EventType.TOOL_CALL_START);
        expect(event.toolCallId).toBe('tool-call-123');
        expect(event.toolCallName).toBe('get_weather');
        expect((event as any).args).toEqual({ location: 'San Francisco' });
        expect(event.timestamp).toBeDefined();
      });

      it('should create valid TOOL_CALL_END event', () => {
        const event = createToolCallEndEvent('tool-call-123');

        expect(event.type).toBe(EventType.TOOL_CALL_END);
        expect(event.toolCallId).toBe('tool-call-123');
        expect(event.timestamp).toBeDefined();
      });

      it('should create valid TOOL_CALL_RESULT event', () => {
        const result = { temperature: 72, conditions: 'sunny' };
        const event = createToolCallResultEvent('tool-call-123', 'msg-1', JSON.stringify(result));

        expect(event.type).toBe(EventType.TOOL_CALL_RESULT);
        expect(event.toolCallId).toBe('tool-call-123');
        expect(event.content).toEqual(JSON.stringify(result));
        expect(event.timestamp).toBeDefined();
      });

      it('should handle complex tool arguments', () => {
        const complexArgs = {
          nested: {
            array: [1, 2, 3],
            object: { key: 'value' },
          },
          number: 42,
          boolean: true,
          null: null,
        };

        const event = createToolCallStartEvent(
          'tool-123',
          'complex_tool',
          complexArgs
        );

        expect((event as any).args).toEqual(complexArgs);
      });
    });
  });

  describe('SSE Formatting', () => {
    it('should format event as valid SSE string', () => {
      const event = createRunStartedEvent('thread-123', 'run-456');
      const sse = formatSSE(event);

      expect(sse).toMatch(/^data: /);
      expect(sse).toContain('"type":"RUN_STARTED"');
      expect(sse).toContain('"threadId":"thread-123"');
      expect(sse).toContain('"runId":"run-456"');
    });

    it('should end with double newline', () => {
      const event = createTextMessageContentEvent('msg-123', 'Test');
      const sse = formatSSE(event);

      expect(sse).toMatch(/\n\n$/);
    });

    it('should properly escape special characters in JSON', () => {
      const event = createTextMessageContentEvent('msg-123', 'Line1\nLine2\t"Quote"');
      const sse = formatSSE(event);

      // Should be valid JSON
      const jsonStr = sse.substring(6, sse.length - 2);
      expect(() => JSON.parse(jsonStr)).not.toThrow();
    });

    it('should handle events with complex nested data', () => {
      const event = createToolCallResultEvent('tool-123', 'msg-1', JSON.stringify({ data: { nested: [1, 2, { key: 'value' }] } }));
      const sse = formatSSE(event);

      const jsonStr = sse.substring(6, sse.length - 2);
      const parsed = JSON.parse(jsonStr);

      expect(JSON.parse(parsed.content).data.nested).toEqual([1, 2, { key: 'value' }]);
    });
  });

  describe('Event Type Compliance', () => {
    it('should use EventType enum from @ag-ui/core', () => {
      // Verify we're using the official enum
      expect(EventType.RUN_STARTED).toBe('RUN_STARTED');
      expect(EventType.RUN_FINISHED).toBe('RUN_FINISHED');
      expect(EventType.RUN_ERROR).toBe('RUN_ERROR');
      expect(EventType.TEXT_MESSAGE_START).toBe('TEXT_MESSAGE_START');
      expect(EventType.TEXT_MESSAGE_CONTENT).toBe('TEXT_MESSAGE_CONTENT');
      expect(EventType.TEXT_MESSAGE_END).toBe('TEXT_MESSAGE_END');
      expect(EventType.TOOL_CALL_START).toBe('TOOL_CALL_START');
      expect(EventType.TOOL_CALL_END).toBe('TOOL_CALL_END');
      expect(EventType.TOOL_CALL_RESULT).toBe('TOOL_CALL_RESULT');
    });

    it('should create events with correct type field', () => {
      const events = [
        createRunStartedEvent('t', 'r'),
        createRunFinishedEvent('t', 'r'),
        createRunErrorEvent('error'),
        createTextMessageStartEvent('m'),
        createTextMessageContentEvent('m', 'text'),
        createTextMessageEndEvent('m'),
        createToolCallStartEvent('tc', 'tool', {}),
        createToolCallEndEvent('tc'),
        createToolCallResultEvent('tc', 'msg-1', '{}'),
      ];

      const expectedTypes = [
        'RUN_STARTED',
        'RUN_FINISHED',
        'RUN_ERROR',
        'TEXT_MESSAGE_START',
        'TEXT_MESSAGE_CONTENT',
        'TEXT_MESSAGE_END',
        'TOOL_CALL_START',
        'TOOL_CALL_END',
        'TOOL_CALL_RESULT',
      ];

      events.forEach((event, index) => {
        expect(event.type).toBe(expectedTypes[index]);
      });
    });
  });

  describe('Event Lifecycle', () => {
    it('should maintain correct event sequence for text message', () => {
      const messageId = 'msg-123';

      const startEvent = createTextMessageStartEvent(messageId);
      const contentEvent1 = createTextMessageContentEvent(messageId, 'Hello');
      const contentEvent2 = createTextMessageContentEvent(messageId, ' World');
      const endEvent = createTextMessageEndEvent(messageId);

      // All events should have same messageId
      expect(startEvent.messageId).toBe(messageId);
      expect(contentEvent1.messageId).toBe(messageId);
      expect(contentEvent2.messageId).toBe(messageId);
      expect(endEvent.messageId).toBe(messageId);

      // Timestamps should be in order
      expect(startEvent.timestamp).toBeLessThanOrEqual(contentEvent1.timestamp!);
      expect(contentEvent1.timestamp).toBeLessThanOrEqual(contentEvent2.timestamp!);
      expect(contentEvent2.timestamp).toBeLessThanOrEqual(endEvent.timestamp!);
    });

    it('should maintain correct event sequence for tool call', () => {
      const toolCallId = 'tool-call-123';
      const toolName = 'get_data';
      const args = { id: '456' };
      const result = { data: 'test' };

      const startEvent = createToolCallStartEvent(toolCallId, toolName, args);
      const endEvent = createToolCallEndEvent(toolCallId);
      const resultEvent = createToolCallResultEvent(toolCallId, 'msg-1', JSON.stringify(result));

      // All events should have same toolCallId
      expect(startEvent.toolCallId).toBe(toolCallId);
      expect(endEvent.toolCallId).toBe(toolCallId);
      expect(resultEvent.toolCallId).toBe(toolCallId);

      // Start event should have tool details
      expect(startEvent.toolCallName).toBe(toolName);
      expect((startEvent as any).args).toEqual(args);

      // Result event should have result
      expect(JSON.parse(resultEvent.content)).toEqual(result);
    });

    it('should maintain correct event sequence for full run', () => {
      const threadId = 'thread-123';
      const runId = 'run-456';
      const messageId = 'msg-789';

      const runStart = createRunStartedEvent(threadId, runId);
      const msgStart = createTextMessageStartEvent(messageId);
      const msgContent = createTextMessageContentEvent(messageId, 'Response');
      const msgEnd = createTextMessageEndEvent(messageId);
      const runFinish = createRunFinishedEvent(threadId, runId);

      // Run events should have consistent IDs
      expect(runStart.threadId).toBe(threadId);
      expect(runStart.runId).toBe(runId);
      expect(runFinish.runId).toBe(runId);

      // All events should have timestamps
      [runStart, msgStart, msgContent, msgEnd, runFinish].forEach((event) => {
        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined values gracefully', () => {
      // These should not throw
      expect(() => createRunStartedEvent('', '')).not.toThrow();
      expect(() => createTextMessageContentEvent('msg', '')).not.toThrow();
      expect(() => createToolCallStartEvent('tc', 'tool', {})).not.toThrow();
    });

    it('should handle error objects without stack traces', () => {
      const errorObj = { message: 'Custom error' };
      const event = createRunErrorEvent(errorObj.message as any);

      expect(event.message).toBe('Custom error');
    });
  });

  describe('Type Safety', () => {
    it('should maintain TypeScript type safety', () => {
      // This test verifies compile-time type checking
      const event = createTextMessageContentEvent('msg-123', 'test');

      // TypeScript should infer correct types
      const _type: string = event.type;
      const _messageId: string = event.messageId;
      const _delta: string = event.delta;
      const _timestamp: number = event.timestamp!;

      expect(_type).toBeDefined();
      expect(_messageId).toBeDefined();
      expect(_delta).toBeDefined();
      expect(_timestamp).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should create events quickly', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        createTextMessageContentEvent(`msg-${i}`, `content-${i}`);
      }

      const duration = performance.now() - start;

      // Creating 1000 events should take less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should format SSE strings quickly', () => {
      const events = Array.from({ length: 1000 }, (_, i) =>
        createTextMessageContentEvent(`msg-${i}`, `content-${i}`)
      );

      const start = performance.now();

      events.forEach((event) => formatSSE(event));

      const duration = performance.now() - start;

      // Formatting 1000 events should take less than 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
