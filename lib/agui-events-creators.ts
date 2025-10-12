import { EventType, RunStartedEvent, RunFinishedEvent, RunErrorEvent, TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent, ToolCallStartEvent, ToolCallEndEvent, ToolCallResultEvent, AGUIEvent } from './agui-events';

export function createRunStartedEvent(threadId: string, runId: string): RunStartedEvent {
  return {
    type: EventType.RUN_STARTED,
    threadId,
    runId,
    timestamp: Date.now(),
  };
}

export function createRunFinishedEvent(threadId: string, runId: string): RunFinishedEvent {
  return {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    timestamp: Date.now(),
  };
}

export function createRunErrorEvent(message: string, code?: string): RunErrorEvent {
  return {
    type: EventType.RUN_ERROR,
    message,
    code,
    timestamp: Date.now(),
  };
}

export function createTextMessageStartEvent(messageId: string): TextMessageStartEvent {
  return {
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: 'assistant',
    timestamp: Date.now(),
  };
}

export function createTextMessageContentEvent(messageId: string, delta: string): TextMessageContentEvent {
  return {
    type: EventType.TEXT_MESSAGE_CONTENT,
    messageId,
    delta,
    timestamp: Date.now(),
  };
}

export function createTextMessageEndEvent(messageId: string): TextMessageEndEvent {
  return {
    type: EventType.TEXT_MESSAGE_END,
    messageId,
    timestamp: Date.now(),
  };
}

export function createToolCallStartEvent(toolCallId: string, toolCallName: string, args: any): ToolCallStartEvent {
  return {
    type: EventType.TOOL_CALL_START,
    toolCallId,
    toolCallName,
    args,
    timestamp: Date.now(),
  } as any;
}

export function createToolCallEndEvent(toolCallId: string): ToolCallEndEvent {
  return {
    type: EventType.TOOL_CALL_END,
    toolCallId,
    timestamp: Date.now(),
  };
}

export function createToolCallResultEvent(toolCallId: string, messageId: string, content: string): ToolCallResultEvent {
  return {
    type: EventType.TOOL_CALL_RESULT,
    toolCallId,
    messageId,
    content,
    timestamp: Date.now(),
  };
}

export function formatSSE(event: AGUIEvent): string {
  const json = JSON.stringify(event);
  return `data: ${json}\n\n`;
}
