/**
 * Database Query Tool
 *
 * Executes safe, read-only queries against the Supabase database.
 * Enforces organization-based Row Level Security.
 */

import { MCPTool, MCPToolResult, MCPToolExecutionContext, DatabaseQueryToolArgs } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Allowed tables for queries (whitelist)
 */
const ALLOWED_TABLES = [
  'documents',
  'agent_sessions',
  'messages',
  'api_keys',
  'usage_tracking',
];

/**
 * Database Query Tool Implementation
 */
export const databaseQueryTool: MCPTool = {
  schema: {
    name: 'database-query',
    description: 'Execute read-only database queries with RLS enforcement',
    parameters: {
      query: {
        type: 'string',
        description: 'SQL query to execute (SELECT only)',
        required: true,
      },
      params: {
        type: 'array',
        description: 'Query parameters for parameterized queries',
      },
    },
  },

  async execute(
    args: Record<string, unknown>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResult> {
    const { query, params = [] } = args as unknown as DatabaseQueryToolArgs;

    try {
      // Validate query is SELECT only
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery.startsWith('select')) {
        return {
          success: false,
          error: 'Only SELECT queries are allowed',
        };
      }

      // Check for dangerous keywords
      const dangerousKeywords = [
        'drop',
        'delete',
        'insert',
        'update',
        'truncate',
        'alter',
        'create',
        'grant',
        'revoke',
      ];

      for (const keyword of dangerousKeywords) {
        if (normalizedQuery.includes(keyword)) {
          return {
            success: false,
            error: `Query contains forbidden keyword: ${keyword}`,
          };
        }
      }

      // Validate table access
      const tableMatch = normalizedQuery.match(/from\s+(\w+)/);
      if (tableMatch) {
        const table = tableMatch[1];
        if (!ALLOWED_TABLES.includes(table)) {
          return {
            success: false,
            error: `Access to table "${table}" is not allowed`,
          };
        }
      }

      // Set RLS context (organization-based isolation)
      await supabase.rpc('set_current_org_id', {
        org_id: context.organizationId,
      });

      // Execute query with RLS enforced
      const { data, error } = await supabase.rpc('execute_read_query', {
        query_text: query,
        query_params: params,
      });

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      return {
        success: true,
        data: {
          results: data,
          rowCount: Array.isArray(data) ? data.length : 0,
        },
        metadata: {
          organizationId: context.organizationId,
          table: tableMatch?.[1],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
      };
    }
  },
};
