/**
 * MCP Tool Middleware
 *
 * Authentication, validation, and rate limiting for MCP tools.
 */

import { auth } from '@clerk/nextjs/server';
import { MCPToolExecutionContext, MCPToolSchema } from './types';
import { redis } from '../redis';

/**
 * Extract execution context from request
 */
export async function getExecutionContext(
  sessionId?: string
): Promise<MCPToolExecutionContext> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized: Authentication required');
  }

  return {
    userId,
    organizationId: orgId,
    sessionId,
    metadata: {},
  };
}

/**
 * Validate tool arguments against schema
 */
export function validateToolArgs(
  args: Record<string, unknown>,
  schema: MCPToolSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required parameters
  Object.entries(schema.parameters).forEach(([key, param]) => {
    if (param.required && !(key in args)) {
      errors.push(`Missing required parameter: ${key}`);
    }

    // Type validation
    if (key in args) {
      const value = args[key];
      const expectedType = param.type;

      if (expectedType === 'string' && typeof value !== 'string') {
        errors.push(`Parameter "${key}" must be a string`);
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`Parameter "${key}" must be a number`);
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter "${key}" must be a boolean`);
      } else if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`Parameter "${key}" must be an array`);
      } else if (
        expectedType === 'object' &&
        (typeof value !== 'object' || Array.isArray(value) || value === null)
      ) {
        errors.push(`Parameter "${key}" must be an object`);
      }

      // Enum validation
      if (param.enum && !param.enum.includes(value)) {
        errors.push(
          `Parameter "${key}" must be one of: ${param.enum.join(', ')}`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting for tool execution
 */
export async function checkRateLimit(
  toolName: string,
  userId: string,
  limit: { maxCalls: number; windowMs: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    // Allow all requests if Redis is not configured
    return {
      allowed: true,
      remaining: limit.maxCalls,
      resetAt: Date.now() + limit.windowMs,
    };
  }

  const key = `ratelimit:tool:${toolName}:${userId}`;
  const now = Date.now();
  const windowStart = now - limit.windowMs;

  // Get recent calls
  const calls = await redis.zrange(key, windowStart, now, {
    byScore: true,
  });

  const callCount = Array.isArray(calls) ? calls.length : 0;

  if (callCount >= limit.maxCalls) {
    // Get oldest call to determine reset time
    const oldestCallStr = Array.isArray(calls) && calls.length > 0 ? String(calls[0]) : '0';
    const oldestCall = parseInt(oldestCallStr, 10);
    const resetAt = oldestCall + limit.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add current call
  await redis.zadd(key, { score: now, member: now.toString() });

  // Set expiry on key (convert ms to seconds)
  const ttlSeconds = Math.ceil(limit.windowMs / 1000);
  await redis.expire(key, ttlSeconds);

  // Clean up old calls
  await redis.zremrangebyscore(key, 0, windowStart);

  return {
    allowed: true,
    remaining: limit.maxCalls - callCount - 1,
    resetAt: now + limit.windowMs,
  };
}

/**
 * Sanitize tool arguments
 */
export function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  Object.entries(args).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Log tool execution
 */
export async function logToolExecution(
  toolName: string,
  context: MCPToolExecutionContext,
  args: Record<string, unknown>,
  result: { success: boolean; executionTime?: number }
): Promise<void> {
  if (!redis) {
    return;
  }

  const logEntry = {
    tool: toolName,
    userId: context.userId,
    organizationId: context.organizationId,
    sessionId: context.sessionId,
    timestamp: new Date().toISOString(),
    success: result.success,
    executionTime: result.executionTime,
    argsHash: hashArgs(args), // Don't log sensitive data
  };

  // Store in Redis for analytics (TTL: 7 days)
  const key = `tool:execution:${context.organizationId}:${Date.now()}`;
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(logEntry));
}

/**
 * Hash arguments for logging (avoid logging sensitive data)
 */
function hashArgs(args: Record<string, unknown>): string {
  const keys = Object.keys(args).sort();
  return keys.join(',');
}
