import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAssistantAgent } from '@/lib/agents';
import { createMessage } from '@/lib/db/messages';
import {
  checkUsageLimit,
  recordUsage,
  getSubscriptionWithPlan,
} from '@/lib/db/subscriptions';
import { ajApi, getRateLimitForPlan } from '@/lib/arcjet';
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

    // Get subscription plan for tier-based rate limiting
    const subscription = await getSubscriptionWithPlan(orgId);
    const planName = subscription?.plan?.name || 'free';

    // Apply tier-based rate limiting
    const rateLimitRule = getRateLimitForPlan(
      planName as 'free' | 'pro' | 'enterprise'
    );

    const decision = await ajApi
      .withRule(rateLimitRule)
      .protect(request, {
        requested: 1,
        ip: request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            plan: planName,
            retryAfter: decision.reason.resetTime,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Request blocked' },
        { status: 403 }
      );
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

    // Check usage limits before processing
    const usageCheck = await checkUsageLimit(orgId, 'messages_per_month');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Message limit exceeded',
          limit: usageCheck.limit,
          currentUsage: usageCheck.currentUsage,
        },
        { status: 429 }
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

    // Save user message to database
    const userMessage = messages[messages.length - 1];
    if (userMessage && userMessage.role === 'user') {
      await createMessage({
        organizationId: orgId,
        sessionId,
        role: 'user',
        content: userMessage.content as string,
        metadata: {},
      });
    }

    // Save assistant response to database
    if (response.content) {
      await createMessage({
        organizationId: orgId,
        sessionId,
        role: 'assistant',
        content: response.content,
        metadata: {
          tokensUsed: response.tokensUsed,
          cost: response.cost,
          finishReason: response.finishReason,
          provider,
          model,
        },
      });

      // Record usage metrics
      await recordUsage({
        organizationId: orgId,
        metricName: 'messages_per_month',
        quantity: 2, // 1 user message + 1 assistant response
      });

      if (response.tokensUsed) {
        await recordUsage({
          organizationId: orgId,
          metricName: 'tokens_per_month',
          quantity: response.tokensUsed,
          unit: 'tokens',
        });
      }
    }

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
