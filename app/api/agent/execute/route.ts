import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAssistantAgent } from '@/lib/agents';
import type { CoreMessage } from 'ai';

export const runtime = 'edge';
export const maxDuration = 60;

interface ExecuteAgentRequest {
  messages: CoreMessage[];
  sessionId: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'mistral';
  model?: string;
  temperature?: number;
}

/**
 * POST /api/agent/execute
 * Execute an AI agent with the given messages
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: ExecuteAgentRequest = await request.json();
    const { messages, sessionId, provider, model, temperature } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Create agent with configuration
    const agent = createAssistantAgent({
      provider,
      model,
      temperature,
    });

    // Execute agent (non-streaming for simple POST)
    const response = await agent.execute({
      sessionId,
      organizationId: orgId,
      userId,
      messages,
    });

    return NextResponse.json({
      success: true,
      response: {
        content: response.content,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
        finishReason: response.finishReason,
      },
    });
  } catch (error) {
    console.error('Agent execution error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
