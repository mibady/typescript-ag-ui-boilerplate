import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAssistantAgent } from '@/lib/agents';
import { getNewEvents, formatSSEEvents } from '@/lib/agui-events';
import { createMessage } from '@/lib/db/messages';
import { checkUsageLimit, recordUsage } from '@/lib/db/subscriptions';
import { clearEvents } from '@/lib/redis';
import type { RunAgentInput } from '@ag-ui/core';
import type { CoreMessage } from 'ai';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * POST /api/agent/stream
 * AG-UI compliant endpoint for streaming agent execution
 * Accepts RunAgentInput from HttpAgent and returns SSE stream
 */
export async function POST(request: NextRequest) {
  console.log('[Stream Route] POST request received');
  try {
    // Authenticate user
    const { userId, orgId } = await auth();
    console.log('[Stream Route] Auth:', { userId, orgId });

    if (!userId) {
      console.log('[Stream Route] Unauthorized - no userId');
      return new Response('Unauthorized', { status: 401 });
    }

    // Use orgId if available, otherwise use userId as fallback for single-tenant mode
    const organizationId = orgId || userId;

    // Parse AG-UI RunAgentInput
    const body: RunAgentInput = await request.json();
    const { threadId, runId, messages, context } = body;
    console.log('[Stream Route] Request body:', { threadId, runId, messageCount: messages?.length, context });

    if (!messages || messages.length === 0) {
      console.log('[Stream Route] Bad request - no messages');
      return new Response('Messages are required', { status: 400 });
    }

    if (!threadId) {
      console.log('[Stream Route] Bad request - no threadId');
      return new Response('Thread ID is required', { status: 400 });
    }

    // Extract provider/model from context (if provided)
    const providerContext = context?.find(c => c.description === 'provider');
    const modelContext = context?.find(c => c.description === 'model');
    const provider = providerContext?.value as 'openai' | 'anthropic' | 'google' | 'mistral' | undefined;
    const model = modelContext?.value;

    // Use threadId as sessionId for storage
    const sessionId = threadId;

    // Clear old events for this session to prevent replaying stale events
    await clearEvents(sessionId);
    console.log('[Stream Route] Cleared old events for session:', sessionId);

    // Check usage limits before processing
    const usageCheck = await checkUsageLimit(organizationId, 'messages_per_month');
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Message limit exceeded',
          limit: usageCheck.limit,
          currentUsage: usageCheck.currentUsage,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Convert AG-UI messages to CoreMessage format for Vercel AI SDK
    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content || '',
    }));

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    let eventIndex = 0;

    console.log('[Stream Route] Creating ReadableStream for sessionId:', sessionId);

    const stream = new ReadableStream({
      async start(controller) {
        console.log('[Stream Route] Stream started');
        let assistantContent = '';

        try {
          // Save user message to database first
          const userMessage = messages[messages.length - 1];
          if (userMessage && userMessage.role === 'user') {
            await createMessage({
              organizationId,
              sessionId,
              role: 'user',
              content: userMessage.content || '',
              metadata: {},
            });
          }

          // Create agent with configuration
          const agent = createAssistantAgent({
            provider,
            model,
          });

          // Start streaming execution in background
          const executionPromise = agent.executeStream({
            sessionId,
            organizationId,
            userId,
            messages: coreMessages,
          });

          // Poll for new events and send via SSE
          const pollInterval = setInterval(async () => {
            try {
              const newEvents = await getNewEvents(sessionId, eventIndex);

              if (newEvents.length > 0) {
                console.log(`[Stream] Sending ${newEvents.length} events, index: ${eventIndex}`);
                const sseData = formatSSEEvents(newEvents);
                controller.enqueue(encoder.encode(sseData));
                eventIndex += newEvents.length;
              }
            } catch (error) {
              console.error('[Stream] Error polling events:', error);
            }
          }, 100); // Poll every 100ms

          console.log('[Stream] Started polling for session:', sessionId);

          // Wait for execution to complete
          const response = await executionPromise;
          console.log('[Stream] Execution complete, response:', { content: response?.content?.substring(0, 50), tokensUsed: response?.tokensUsed });

          // Send any remaining events
          const finalEvents = await getNewEvents(sessionId, eventIndex);
          console.log('[Stream] Final events count:', finalEvents.length);
          if (finalEvents.length > 0) {
            const sseData = formatSSEEvents(finalEvents);
            controller.enqueue(encoder.encode(sseData));
          }

          // The agent internally handles recording usage and saving the assistant message.
          // We only need to record the initial user message usage here.
          await recordUsage({
            organizationId,
            metricName: 'messages_per_month',
            quantity: 1, // 1 user message
          });

          // Clean up and close
          clearInterval(pollInterval);
          controller.close();
        } catch (error) {
          console.error('Stream execution error:', error);
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
