/**
 * MCP Tool Execution API
 *
 * POST /api/mcp/execute
 * Executes an MCP tool with authentication and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutionContext, validateToolArgs, sanitizeArgs } from '@/lib/mcp/middleware';
import { getTool } from '@/lib/mcp/tools';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get execution context (validates auth)
    const context = await getExecutionContext();

    // Parse request body
    const body = await request.json();
    const { toolName, args = {} } = body;

    if (!toolName) {
      return NextResponse.json(
        { success: false, error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Get tool
    const toolRegistration = getTool(toolName);

    if (!toolRegistration) {
      return NextResponse.json(
        { success: false, error: `Tool "${toolName}" not found` },
        { status: 404 }
      );
    }

    if (!toolRegistration.enabled) {
      return NextResponse.json(
        { success: false, error: `Tool "${toolName}" is disabled` },
        { status: 403 }
      );
    }

    const { tool } = toolRegistration;

    // Validate arguments
    const validation = validateToolArgs(args, tool.schema);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid arguments',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Sanitize arguments
    const sanitizedArgs = sanitizeArgs(args);

    // Execute tool
    const result = await tool.execute(sanitizedArgs, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MCP Execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
