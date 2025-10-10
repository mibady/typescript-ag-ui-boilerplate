import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAssistantAgent } from '@/lib/agents';
import { getNewEvents, formatSSEEvents } from '@/lib/agui-events';
import type { CoreMessage } from 'ai';

export const runtime = 'edge';
export const maxDuration = 60;

interface StreamAgentRequest {
  messages: CoreMessage[];
  sessionId: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'mistral';
  model?: string;
  temperature?: number;
}

/**
 * POST /api/agent/stream
 * Execute an AI agent with streaming response via Server-Sent Events
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body: StreamAgentRequest = await request.json();
    const { messages, sessionId, provider, model, temperature } = body;

    if (!messages || messages.length === 0) {
      return new Response('Messages are required', { status: 400 });
    }

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 });
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    let eventIndex = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create agent with configuration
          const agent = createAssistantAgent({
            provider,
            model,
            temperature,
          });

          // Start streaming execution in background
          const executionPromise = agent.executeStream(
            {
              sessionId,
              organizationId: orgId,
              userId,
              messages,
            },
            () => {
              // Optional: handle individual chunks if needed
            }
          );

          // Poll for new events and send via SSE
          const pollInterval = setInterval(async () => {
            try {
              const newEvents = await getNewEvents(sessionId, eventIndex);

              if (newEvents.length > 0) {
                const sseData = formatSSEEvents(newEvents);
                controller.enqueue(encoder.encode(sseData));
                eventIndex += newEvents.length;
              }
            } catch (error) {
              console.error('Error polling events:', error);
            }
          }, 100); // Poll every 100ms

          // Wait for execution to complete
          await executionPromise;

          // Send any remaining events
          const finalEvents = await getNewEvents(sessionId, eventIndex);
          if (finalEvents.length > 0) {
            const sseData = formatSSEEvents(finalEvents);
            controller.enqueue(encoder.encode(sseData));
          }

          // Clean up and close
          clearInterval(pollInterval);
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream execution error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream setup error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}
