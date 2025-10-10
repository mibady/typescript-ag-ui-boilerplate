/**
 * MCP Tools List API
 *
 * GET /api/mcp/list
 * Returns list of available MCP tools with their schemas
 */

import { NextResponse } from 'next/server';
import { getToolSchemas } from '@/lib/mcp/tools';

export const runtime = 'edge';

export async function GET() {
  try {
    const schemas = getToolSchemas();

    return NextResponse.json({
      success: true,
      tools: schemas,
      count: schemas.length,
    });
  } catch (error) {
    console.error('[MCP List] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
