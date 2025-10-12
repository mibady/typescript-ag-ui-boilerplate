import { storeEvent, getEventsSince } from './redis';
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
} from './agui-events-creators';
import {
  EventType,
  type BaseEvent,
  type TextMessageStartEvent,
  type TextMessageContentEvent,
  type TextMessageEndEvent,
  type ToolCallStartEvent,
  type ToolCallEndEvent,
  type ToolCallResultEvent,
  type RunStartedEvent,
  type RunFinishedEvent,
  type RunErrorEvent,
  type StepStartedEvent,
  type StepFinishedEvent,
  type ThinkingStartEvent,
  type ThinkingEndEvent,
  type CustomEvent,
} from '@ag-ui/core';

/**
 * AG-UI Event Types
 * Using official AG-UI SDK types from @ag-ui/core
 */
export { EventType };
export type {
  BaseEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  StepStartedEvent,
  StepFinishedEvent,
  ThinkingStartEvent,
  ThinkingEndEvent,
  CustomEvent,
};

/**
 * Union type for all AG-UI events
 */
export type AGUIEvent =
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | StepStartedEvent
  | StepFinishedEvent
  | ThinkingStartEvent
  | ThinkingEndEvent
  | CustomEvent;

/**
 * Emit an AG-UI event to the event stream
 */
export async function emitAGUIEvent(
  sessionId: string,
  event: AGUIEvent
): Promise<void> {
  // Store the event directly without wrapping it
  await storeEvent(sessionId, event);
}

/**
 * Emit run started event
 */
export async function emitRunStarted(
  sessionId: string,
  threadId: string,
  runId: string
): Promise<void> {
  const event = createRunStartedEvent(threadId, runId);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit run finished event
 */
export async function emitRunFinished(
  sessionId: string,
  threadId: string,
  runId: string,
  metadata?: any
): Promise<void> {
  const event = createRunFinishedEvent(threadId, runId);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit run error event
 */
export async function emitRunError(
  sessionId: string,
  error: any
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const event = createRunErrorEvent(errorMessage);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit thinking start event
 */
export async function emitThinkingStart(
  sessionId: string,
  title?: string
): Promise<void> {
  const event: ThinkingStartEvent = {
    type: EventType.THINKING_START,
    title,
    timestamp: Date.now(),
  };
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit thinking end event
 */
export async function emitThinkingEnd(sessionId: string): Promise<void> {
  const event: ThinkingEndEvent = {
    type: EventType.THINKING_END,
    timestamp: Date.now(),
  };
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit tool call start event
 */
export async function emitToolCallStart(
  sessionId: string,
  toolCallId: string,
  toolName: string,
  argsOrParentMessageId: any
): Promise<void> {
  // Handle old signature where 4th param was parentMessageId
  const args = typeof argsOrParentMessageId === 'string' ? {} : argsOrParentMessageId;
  const event = createToolCallStartEvent(toolCallId, toolName, args);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit tool call end event
 */
export async function emitToolCallEnd(
  sessionId: string,
  toolCallId: string
): Promise<void> {
  const event = createToolCallEndEvent(toolCallId);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit tool call result event
 */
export async function emitToolCallResult(
  sessionId: string,
  messageId: string,
  toolCallId: string,
  content: string
): Promise<void> {
  const event = createToolCallResultEvent(toolCallId, messageId, content);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit text message start event
 */
export async function emitMessageStart(
  sessionId: string,
  messageId: string,
  role?: 'user' | 'assistant' | 'system'
): Promise<void> {
  const event = createTextMessageStartEvent(messageId);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit text message content event (for streaming)
 */
export async function emitMessageDelta(
  sessionId: string,
  messageId: string,
  delta: string
): Promise<void> {
  console.log('[emitMessageDelta] Emitting delta:', { sessionId, messageId, deltaLength: delta.length, deltaPreview: delta.substring(0, 50) });
  const event = createTextMessageContentEvent(messageId, delta);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit text message end event
 */
export async function emitMessageEnd(
  sessionId: string,
  messageId: string
): Promise<void> {
  const event = createTextMessageEndEvent(messageId);
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit step started event
 */
export async function emitStepStarted(
  sessionId: string,
  stepName: string
): Promise<void> {
  const event: StepStartedEvent = {
    type: EventType.STEP_STARTED,
    stepName,
    timestamp: Date.now(),
  };
  await emitAGUIEvent(sessionId, event);
}

/**
 * Emit step finished event
 */
export async function emitStepFinished(
  sessionId: string,
  stepName: string
): Promise<void> {
  const event: StepFinishedEvent = {
    type: EventType.STEP_FINISHED,
    stepName,
    timestamp: Date.now(),
  };
  await emitAGUIEvent(sessionId, event);
}

// Backward compatibility aliases
export const emitAgentStart = emitRunStarted;
export const emitComplete = emitRunFinished;
export const emitError = emitRunError;
export const emitThinking = emitThinkingStart;
export const emitToolStart = emitToolCallStart;
export const emitToolComplete = emitToolCallEnd;
export const emitMessageComplete = emitMessageEnd;

/**
 * Get new events since a specific index
 * Used for Server-Sent Events polling
 */
export async function getNewEvents(
  sessionId: string,
  sinceIndex: number
): Promise<AGUIEvent[]> {
  const events = await getEventsSince(sessionId, sinceIndex);
  return events as AGUIEvent[];
}

/**
 * Format event for SSE transmission
 * AG-UI SDK compliant format
 */
export function formatSSEEvent(event: AGUIEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Format multiple events for SSE transmission
 */
export function formatSSEEvents(events: AGUIEvent[]): string {
  return events.map(formatSSEEvent).join('');
}
