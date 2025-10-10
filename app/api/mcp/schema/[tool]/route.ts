/**
 * MCP Tool Schema API
 *
 * GET /api/mcp/schema/[tool]
 * Returns the schema for a specific tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTool } from '@/lib/mcp/tools';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const toolName = params.tool;

    const toolRegistration = getTool(toolName);

    if (!toolRegistration) {
      return NextResponse.json(
        { success: false, error: `Tool "${toolName}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tool: toolRegistration.tool.schema,
      enabled: toolRegistration.enabled,
    });
  } catch (error) {
    console.error('[MCP Schema] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
