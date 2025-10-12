import { NextRequest, NextResponse } from 'next/server';
import { getEventsSince } from '@/lib/redis';

// Disable caching and enable streaming
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  console.log('[AG-UI Stream] GET request received for sessionId:', sessionId);

  if (!sessionId) {
    console.log('[AG-UI Stream] Bad request - no sessionId');
    return new NextResponse('sessionId is required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let isActive = true;
      let lastIndex = 0;

      console.log('[AG-UI Stream] Starting to poll events for sessionId:', sessionId);

      // Poll for events using the shared getEventsSince function
      const pollEvents = async () => {
        while (isActive) {
          try {
            // Get events since lastIndex - this works with both Redis and in-memory
            const events = await getEventsSince(sessionId, lastIndex);
            console.log('[AG-UI Stream] Polled events:', { count: events.length, lastIndex });

            if (events && events.length > 0) {
              // Process all events
              for (const event of events) {
                // Events are already parsed objects, serialize them for SSE
                const eventStr = typeof event === 'string' ? event : JSON.stringify(event);
                const sseMessage = `data: ${eventStr}\n\n`;
                controller.enqueue(new TextEncoder().encode(sseMessage));
                console.log('[AG-UI Stream] Sent event:', eventStr.substring(0, 100));
              }
              // Update lastIndex
              lastIndex += events.length;
              console.log('[AG-UI Stream] Updated lastIndex to:', lastIndex);
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            if (isActive) {
              console.error('[AG-UI Stream] Error polling events:', error);
            }
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      };

      // Start polling
      pollEvents();

      // Heartbeat to keep the connection alive
      const intervalId = setInterval(() => {
        if (isActive) {
          controller.enqueue(new TextEncoder().encode(': \n\n'));
        }
      }, 30000);

      // Clean up on client disconnect
      req.signal.onabort = () => {
        console.log(`Client disconnected for sessionId: ${sessionId}`);
        isActive = false;
        clearInterval(intervalId);
        controller.close();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
