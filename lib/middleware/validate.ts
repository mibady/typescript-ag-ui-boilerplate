/**
 * Input Validation Middleware
 *
 * Provides centralized request body validation using Zod schemas.
 * Eliminates repetitive validation code in API routes.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate request body against a Zod schema
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, body: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Parse request body
      const rawBody = await req.json();

      // Validate against schema
      const validationResult = schema.safeParse(rawBody);

      if (!validationResult.success) {
        // Format validation errors
        const errors = validationResult.error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return NextResponse.json(
          {
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        );
      }

      // Call handler with validated body
      return handler(req, validationResult.data);
    } catch (error) {
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            error: 'Invalid JSON',
            message: error.message,
          },
          { status: 400 }
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function withQueryValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, query: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get query parameters
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};

      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      // Validate against schema
      const validationResult = schema.safeParse(queryParams);

      if (!validationResult.success) {
        // Format validation errors
        const errors = validationResult.error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return NextResponse.json(
          {
            error: 'Query validation failed',
            details: errors,
          },
          { status: 400 }
        );
      }

      // Call handler with validated query
      return handler(req, validationResult.data);
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Validate both body and query parameters
 */
export function withFullValidation<TBody, TQuery>(
  bodySchema: z.ZodSchema<TBody>,
  querySchema: z.ZodSchema<TQuery>,
  handler: (
    req: NextRequest,
    body: TBody,
    query: TQuery
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Validate body
      const rawBody = await req.json();
      const bodyResult = bodySchema.safeParse(rawBody);

      if (!bodyResult.success) {
        const errors = bodyResult.error.issues.map((err: { path: (string | number)[]; message: string; code: string }) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
          location: 'body' as const,
        }));

        return NextResponse.json(
          {
            error: 'Body validation failed',
            details: errors,
          },
          { status: 400 }
        );
      }

      // Validate query
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};

      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      const queryResult = querySchema.safeParse(queryParams);

      if (!queryResult.success) {
        const errors = queryResult.error.issues.map((err: { path: (string | number)[]; message: string; code: string }) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
          location: 'query' as const,
        }));

        return NextResponse.json(
          {
            error: 'Query validation failed',
            details: errors,
          },
          { status: 400 }
        );
      }

      // Call handler with validated data
      return handler(req, bodyResult.data, queryResult.data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            error: 'Invalid JSON',
            message: error.message,
          },
          { status: 400 }
        );
      }

      throw error;
    }
  };
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().regex(/^\d+$/).default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).default('10').transform(Number),
  }),

  // UUID
  uuid: z.string().uuid(),

  // Organization ID
  organizationId: z.string().uuid(),

  // User ID
  userId: z.string().uuid(),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1).max(500),
    limit: z.string().regex(/^\d+$/).default('10').transform(Number),
  }),

  // Date range
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),

  // LLM request
  llmRequest: z.object({
    messages: z.array(
      z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']),
        content: z.string(),
      })
    ),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
  }),
};

/**
 * Example usage:
 *
 * ```typescript
 * // API route with body validation
 * import { withValidation } from '@/lib/middleware/validate';
 * import { z } from 'zod';
 *
 * const createDocumentSchema = z.object({
 *   name: z.string().min(1).max(255),
 *   content: z.string().min(1),
 *   contentType: z.string().optional(),
 * });
 *
 * export const POST = withValidation(
 *   createDocumentSchema,
 *   async (req, body) => {
 *     // body is fully typed and validated
 *     const { name, content, contentType } = body;
 *     // ... handle request
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
