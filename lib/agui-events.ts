import { storeEvent, getEventsSince } from './redis';

/**
 * AG-UI Event Types
 * Based on the AG-UI protocol specification
 */
export type AGUIEventType =
  | 'agent.start'
  | 'agent.thinking'
  | 'agent.tool.start'
  | 'agent.tool.complete'
  | 'agent.message.start'
  | 'agent.message.delta'
  | 'agent.message.complete'
  | 'agent.error'
  | 'agent.complete';

export interface AGUIEvent {
  type: AGUIEventType;
  timestamp: number;
  data: unknown;
}

export interface AgentStartEvent extends AGUIEvent {
  type: 'agent.start';
  data: {
    sessionId: string;
    agentType: string;
    model: string;
    provider: string;
  };
}

export interface AgentThinkingEvent extends AGUIEvent {
  type: 'agent.thinking';
  data: {
    message: string;
  };
}

export interface AgentToolStartEvent extends AGUIEvent {
  type: 'agent.tool.start';
  data: {
    toolName: string;
    toolInput: unknown;
  };
}

export interface AgentToolCompleteEvent extends AGUIEvent {
  type: 'agent.tool.complete';
  data: {
    toolName: string;
    toolOutput: unknown;
  };
}

export interface AgentMessageStartEvent extends AGUIEvent {
  type: 'agent.message.start';
  data: {
    messageId: string;
  };
}

export interface AgentMessageDeltaEvent extends AGUIEvent {
  type: 'agent.message.delta';
  data: {
    delta: string;
  };
}

export interface AgentMessageCompleteEvent extends AGUIEvent {
  type: 'agent.message.complete';
  data: {
    messageId: string;
    content: string;
    tokensUsed: number;
    cost: number;
  };
}

export interface AgentErrorEvent extends AGUIEvent {
  type: 'agent.error';
  data: {
    error: string;
    code?: string;
  };
}

export interface AgentCompleteEvent extends AGUIEvent {
  type: 'agent.complete';
  data: {
    totalTokens: number;
    totalCost: number;
    duration: number;
  };
}

/**
 * Emit an AG-UI event to the event stream
 */
export async function emitAGUIEvent(
  sessionId: string,
  event: AGUIEvent
): Promise<void> {
  await storeEvent(sessionId, {
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
  });
}

/**
 * Create an AG-UI event with current timestamp
 */
export function createAGUIEvent(
  type: AGUIEventType,
  data: unknown
): AGUIEvent {
  return {
    type,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Emit agent start event
 */
export async function emitAgentStart(
  sessionId: string,
  agentType: string,
  model: string,
  provider: string
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.start', {
      sessionId,
      agentType,
      model,
      provider,
    })
  );
}

/**
 * Emit thinking event
 */
export async function emitThinking(
  sessionId: string,
  message: string
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.thinking', { message })
  );
}

/**
 * Emit tool start event
 */
export async function emitToolStart(
  sessionId: string,
  toolName: string,
  toolInput: unknown
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.tool.start', { toolName, toolInput })
  );
}

/**
 * Emit tool complete event
 */
export async function emitToolComplete(
  sessionId: string,
  toolName: string,
  toolOutput: unknown
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.tool.complete', { toolName, toolOutput })
  );
}

/**
 * Emit message start event
 */
export async function emitMessageStart(
  sessionId: string,
  messageId: string
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.message.start', { messageId })
  );
}

/**
 * Emit message delta event (for streaming)
 */
export async function emitMessageDelta(
  sessionId: string,
  delta: string
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.message.delta', { delta })
  );
}

/**
 * Emit message complete event
 */
export async function emitMessageComplete(
  sessionId: string,
  messageId: string,
  content: string,
  tokensUsed: number,
  cost: number
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.message.complete', {
      messageId,
      content,
      tokensUsed,
      cost,
    })
  );
}

/**
 * Emit error event
 */
export async function emitError(
  sessionId: string,
  error: string,
  code?: string
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.error', { error, code })
  );
}

/**
 * Emit agent complete event
 */
export async function emitComplete(
  sessionId: string,
  totalTokens: number,
  totalCost: number,
  duration: number
): Promise<void> {
  await emitAGUIEvent(
    sessionId,
    createAGUIEvent('agent.complete', { totalTokens, totalCost, duration })
  );
}

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
 */
export function formatSSEEvent(event: AGUIEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/**
 * Format multiple events for SSE transmission
 */
export function formatSSEEvents(events: AGUIEvent[]): string {
  return events.map(formatSSEEvent).join('');
}
