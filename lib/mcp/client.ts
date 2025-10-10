/**
 * MCP Client
 *
 * Client-side interface for executing MCP tools from agents.
 * Handles tool discovery, execution, and error handling.
 */

import {
  MCPToolResult,
  MCPToolExecutionContext,
  MCPToolSchema,
} from './types';
import { getTool, isToolAvailable, getToolSchemas } from './tools';
import {
  validateToolArgs,
  checkRateLimit,
  sanitizeArgs,
  logToolExecution,
} from './middleware';

export class MCPClient {
  private context: MCPToolExecutionContext;

  constructor(context: MCPToolExecutionContext) {
    this.context = context;
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const startTime = Date.now();

    try {
      // Check if tool exists and is enabled
      if (!isToolAvailable(toolName)) {
        return {
          success: false,
          error: `Tool "${toolName}" is not available`,
        };
      }

      const toolRegistration = getTool(toolName);
      if (!toolRegistration) {
        return {
          success: false,
          error: `Tool "${toolName}" not found`,
        };
      }

      const { tool, rateLimit } = toolRegistration;

      // Validate arguments
      const validation = validateToolArgs(args, tool.schema);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid arguments: ${validation.errors.join(', ')}`,
        };
      }

      // Check rate limit
      if (rateLimit) {
        const rateLimitCheck = await checkRateLimit(
          toolName,
          this.context.userId,
          rateLimit
        );

        if (!rateLimitCheck.allowed) {
          return {
            success: false,
            error: `Rate limit exceeded. Try again at ${new Date(rateLimitCheck.resetAt).toISOString()}`,
            metadata: {
              rateLimit: {
                remaining: rateLimitCheck.remaining,
                resetAt: rateLimitCheck.resetAt,
              },
            },
          };
        }
      }

      // Sanitize arguments
      const sanitizedArgs = sanitizeArgs(args);

      // Execute tool
      const result = await tool.execute(sanitizedArgs, this.context);

      const executionTime = Date.now() - startTime;

      // Log execution
      await logToolExecution(toolName, this.context, sanitizedArgs, {
        success: result.success,
        executionTime,
      });

      // Add execution time to metadata
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Log failed execution
      await logToolExecution(toolName, this.context, args, {
        success: false,
        executionTime,
      });

      return {
        success: false,
        error: `Tool execution failed: ${errorMessage}`,
        metadata: {
          executionTime,
        },
      };
    }
  }

  /**
   * Get available tool schemas
   */
  getAvailableTools(): MCPToolSchema[] {
    return getToolSchemas() as unknown as MCPToolSchema[];
  }

  /**
   * Check if a tool is available
   */
  isToolAvailable(toolName: string): boolean {
    return isToolAvailable(toolName);
  }

  /**
   * Get tool schema
   */
  getToolSchema(toolName: string): MCPToolSchema | null {
    const toolRegistration = getTool(toolName);
    return toolRegistration ? toolRegistration.tool.schema : null;
  }
}

/**
 * Create an MCP client instance
 */
export function createMCPClient(
  context: MCPToolExecutionContext
): MCPClient {
  return new MCPClient(context);
}
