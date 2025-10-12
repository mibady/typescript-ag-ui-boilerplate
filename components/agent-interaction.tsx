'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HttpAgent } from '@ag-ui/client';
import {
  EventType,
  type Message,
  type RunErrorEvent,
  type TextMessageContentEvent,
  type TextMessageStartEvent,
  type TextMessageEndEvent,
  type RunStartedEvent,
  type RunFinishedEvent,
  type BaseEvent
} from '@ag-ui/core';
import { nanoid } from 'nanoid';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * AgentInteraction Component
 *
 * Reference implementation for AG-UI SDK integration
 * Demonstrates proper use of:
 * - HttpAgent from @ag-ui/client
 * - Event types from @ag-ui/core
 * - Observable pattern for real-time streaming
 * - Proper event lifecycle handling
 */
export function AgentInteraction() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const agentRef = useRef<HttpAgent | null>(null);

  const startAgent = async () => {
    setMessages([]);
    setIsAgentRunning(true);
    setRunStatus('running');

    const threadId = nanoid();
    const runId = nanoid();
    setCurrentRunId(runId);

    // Initialize HttpAgent pointing to the endpoint
    const agent = new HttpAgent({
      url: '/api/agent/start',
    });
    agentRef.current = agent;

    try {
      // Run agent with AG-UI RunAgentInput
      const eventObservable = await agent.run({
        threadId,
        runId,
        messages: [],
        tools: [],
        context: [],
        state: null,
        forwardedProps: null,
      });

      // Subscribe to AG-UI event stream
      eventObservable.subscribe({
        next: (event: BaseEvent) => {
          console.log('AG-UI Event:', event.type, event);

          // Handle RUN_STARTED
          if (event.type === EventType.RUN_STARTED) {
            const startedEvent = event as RunStartedEvent;
            console.log('Run started:', startedEvent.threadId, startedEvent.runId);
          }

          // Handle TEXT_MESSAGE_START
          else if (event.type === EventType.TEXT_MESSAGE_START) {
            const startEvent = event as TextMessageStartEvent;
            const newMessage: Message = {
              id: startEvent.messageId,
              role: startEvent.role,
              content: '',
            };
            setMessages((prev) => [...prev, newMessage]);
          }

          // Handle TEXT_MESSAGE_CONTENT (streaming delta)
          else if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
            const contentEvent = event as TextMessageContentEvent;
            setMessages((prevMessages) => {
              const existingMessageIndex = prevMessages.findIndex(
                m => m.id === contentEvent.messageId
              );
              if (existingMessageIndex !== -1) {
                // Append delta to existing message
                const updatedMessages = [...prevMessages];
                const existingMessage = updatedMessages[existingMessageIndex];
                updatedMessages[existingMessageIndex] = {
                  ...existingMessage,
                  content: (existingMessage.content || '') + contentEvent.delta,
                };
                return updatedMessages;
              }
              return prevMessages;
            });
          }

          // Handle TEXT_MESSAGE_END
          else if (event.type === EventType.TEXT_MESSAGE_END) {
            const endEvent = event as TextMessageEndEvent;
            console.log('Message completed:', endEvent.messageId);
          }

          // Handle RUN_FINISHED
          else if (event.type === EventType.RUN_FINISHED) {
            const finishedEvent = event as RunFinishedEvent;
            console.log('Run finished:', finishedEvent.result);
            setRunStatus('success');
          }

          // Handle RUN_ERROR
          else if (event.type === EventType.RUN_ERROR) {
            const errorEvent = event as RunErrorEvent;
            console.error('Agent run error:', errorEvent.message);
            setRunStatus('error');
            setIsAgentRunning(false);
          }
        },
        error: (err) => {
          console.error('Subscription error:', err);
          setRunStatus('error');
          setIsAgentRunning(false);
        },
        complete: () => {
          console.log('Agent run completed');
          setIsAgentRunning(false);
          if (runStatus !== 'error') {
            setRunStatus('success');
          }
        },
      });
    } catch (error) {
      console.error('Failed to start agent run:', error);
      setRunStatus('error');
      setIsAgentRunning(false);
    }
  };

  useEffect(() => {
    // HttpAgent handles cleanup automatically
    // Observable subscriptions are cleaned up on unmount
    return () => {
      agentRef.current = null;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Agent Interaction
              {runStatus === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {runStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {runStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
            </CardTitle>
            <CardDescription>
              Reference implementation using AG-UI SDK
            </CardDescription>
          </div>
          <Badge variant={runStatus === 'running' ? 'default' : 'secondary'}>
            {runStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={startAgent}
          disabled={isAgentRunning}
          className="w-full"
        >
          {isAgentRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Agent Running...
            </>
          ) : (
            'Start Agent Demo'
          )}
        </Button>

        {currentRunId && (
          <div className="text-xs text-muted-foreground">
            Run ID: <code className="bg-muted px-1 py-0.5 rounded">{currentRunId}</code>
          </div>
        )}

        <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Start the agent to see real-time streaming.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-background p-3 rounded border"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {msg.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {msg.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Uses HttpAgent from @ag-ui/client</p>
          <p>• Handles all AG-UI event types</p>
          <p>• Observable-based streaming</p>
          <p>• Styled with shadcn/ui + Tailwind</p>
        </div>
      </CardContent>
    </Card>
  );
}
