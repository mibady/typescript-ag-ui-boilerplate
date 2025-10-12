'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { HttpAgent } from '@ag-ui/client';
import { EventType, type Message as AGUIMessage, type BaseEvent } from '@ag-ui/core';
import { nanoid } from 'nanoid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  sessionId: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'mistral';
  model?: string;
  onMessagesChange?: (messages: Message[]) => void;
}

export function ChatInterface({
  sessionId,
  provider,
  model,
  onMessagesChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HttpAgent | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Notify parent of messages change
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const handleSend = async (content: string) => {
    setError(null);
    setIsLoading(true);
    setStreamingContent('');

    // Add user message
    const userMessage: Message = {
      id: `msg_${nanoid()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Convert messages to AG-UI format
      const allMessages = [...messages, userMessage];
      const aguiMessages: AGUIMessage[] = allMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Initialize HttpAgent (AG-UI SDK)
      const agent = new HttpAgent({
        url: '/api/agent/stream',
      });
      agentRef.current = agent;

      // Run agent with AG-UI protocol
      const eventObservable = await agent.run({
        threadId: sessionId,
        runId: `run_${nanoid()}`,
        messages: aguiMessages,
        tools: [],
        context: provider && model ? [
          { description: 'provider', value: provider },
          { description: 'model', value: model },
        ] : [],
        state: null,
        forwardedProps: null,
      });

      let assistantContent = '';

      // Subscribe to AG-UI events
      eventObservable.subscribe({
        next: (event: BaseEvent) => {
          console.log('[ChatInterface] Received event:', event);
          try {
            // Handle TEXT_MESSAGE_START
            if (event.type === EventType.TEXT_MESSAGE_START) {
              const startEvent = event as any;
              setCurrentMessageId(startEvent.messageId);
              assistantContent = '';
              setStreamingContent('');
            }

            // Handle TEXT_MESSAGE_CONTENT (streaming delta)
            else if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
              const contentEvent = event as any;
              assistantContent += contentEvent.delta;
              setStreamingContent(assistantContent);
            }

            // Handle TEXT_MESSAGE_END
            else if (event.type === EventType.TEXT_MESSAGE_END) {
              const endEvent = event as any;
              if (assistantContent) {
                const assistantMessage: Message = {
                  id: endEvent.messageId || `msg_${nanoid()}`,
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
              }
              setStreamingContent('');
              setCurrentMessageId(null);
            }

            // Handle RUN_ERROR
            else if (event.type === EventType.RUN_ERROR) {
              const errorEvent = event as any;
              setError(errorEvent.message || 'An error occurred');
            }
          } catch (err) {
            console.error('Error processing event:', err);
          }
        },
        error: (err) => {
          console.error('AG-UI subscription error:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
          setIsLoading(false);
        },
        complete: () => {
          console.log('Agent run completed');
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // AG-UI HttpAgent handles cleanup automatically
      // Observable subscriptions are cleaned up when component unmounts
      agentRef.current = null;
    };
  }, []);

  return (
    <Card className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}

          {streamingContent && (
            <ChatMessage
              role="assistant"
              content={streamingContent}
              isStreaming={true}
            />
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {error && (
        <div className="px-4 pb-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 border-t">
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder={
            isLoading ? 'Agent is thinking...' : 'Type your message...'
          }
        />
      </div>
    </Card>
  );
}
